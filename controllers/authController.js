const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');
const emailTemplates = require('../services/emailTemplates');

exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const id = `u-${Date.now()}`;
    // Password will be hashed by User model beforeSave hook
    const user = await User.create({ id, email, password, firstName, lastName, role });
    
    const userResponse = user.toJSON();
    delete userResponse.password;

    // Send role-specific welcome email — non-fatal
    try {
      await emailService.sendEmail({
        to: user.email,
        subject: `Welcome to Connect${user.role === 'owner' ? ' — Venue Partner Account Activated' : '!'}`,
        html: emailTemplates.welcomeEmail(user)
      });
    } catch (emailErr) {
      console.warn('⚠️  Welcome email failed (registration still succeeded):', emailErr.message);
    }

    res.status(201).json(userResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log(`❌ Login attempt for non-existent user: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // ── Security: Check Account Lockout ───────────────────────────────────────
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockoutUntil - new Date()) / 60000);
      return res.status(429).json({ message: `Account temporarily locked due to multiple failed login attempts. Try again in ${remainingMinutes} minutes.` });
    }

    // Compare password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`🔑 Login attempt for ${email} - Match: ${isMatch}`);
    
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockoutUntil = new Date(Date.now() + 30 * 60000); // Lock for 30 minutes
      }
      await user.save();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Reset lockout counters on successful login
    if (user.failedLoginAttempts > 0) {
      user.failedLoginAttempts = 0;
      user.lockoutUntil = null;
      await user.save();
    }

    // ── Security: Mandatory 2FA for Admin accounts ────────────────────────────
    if (user.role === 'admin' && !user.isTwoFactorEnabled) {
      // Issue a short-lived, limited "setup token" so the setup endpoints work
      const setupToken = jwt.sign(
        { id: user.id, role: user.role, purpose: '2fa_setup' },
        process.env.JWT_SECRET,
        { expiresIn: '10m' }
      );
      return res.status(403).json({
        requiresAdminTwoFASetup: true,
        setupToken,
        message: 'As an administrator, you must configure Two-Factor Authentication before accessing the console.'
      });
    }

    // ── Security: 2FA Verification (for accounts that already have it enabled) ─
    if (user.isTwoFactorEnabled) {
      const { totpToken } = req.body;
      if (!totpToken) {
        return res.status(403).json({ requires2FA: true, message: 'Two-Factor Authentication required.' });
      }

      const speakeasy = require('speakeasy');
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: totpToken,
        window: 1
      });

      if (!verified) {
        return res.status(401).json({ message: 'Invalid 2FA code.' });
      }
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(200).json({
      user: userResponse,
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    await user.save();
    
    const userResponse = user.toJSON();
    delete userResponse.password;
    res.status(200).json(userResponse);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });
    
    user.password = newPassword; 
    await user.save();
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Import models for manual cascading deletes to avoid SQLite FK constraint errors
    const Review = require('../models/Review');
    const Booking = require('../models/Booking');
    const Venue = require('../models/Venue');

    // 1. Delete all reviews made by the user
    await Review.destroy({ where: { userId: user.id } });
    
    // 2. Delete all bookings made by the user
    await Booking.destroy({ where: { userId: user.id } });
    
    // 3. If the user is a venue owner, delete all their venues and associated bookings/reviews
    if (user.role === 'owner') {
      const venues = await Venue.findAll({ where: { ownerId: user.id } });
      const venueIds = venues.map(v => v.id);
      
      if (venueIds.length > 0) {
        await Review.destroy({ where: { venueId: venueIds } });
        await Booking.destroy({ where: { venueId: venueIds } });
        await Venue.destroy({ where: { ownerId: user.id } });
      }
    }
    
    // 4. Finally, delete the user account
    await user.destroy();
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) { 
    console.error('Delete Account Error:', error);
    res.status(500).json({ message: error.message }); 
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'If that email exists, an OTP has been sent.' }); 
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await user.save();
    
    // Send OTP email — non-fatal (OTP is still saved in DB)
    try {
      await emailService.sendEmail({
        to: user.email,
        subject: 'Connect Platform - Password Reset OTP',
        html: `<h3>Password Reset</h3><p>Your OTP code is <b style="font-size: 24px;">${otp}</b>. It will expire in 15 minutes.</p>`
      });
    } catch (emailErr) {
      console.warn('⚠️  OTP email failed (OTP still saved):', emailErr.message);
    }

    res.status(200).json({ message: 'OTP sent to email successfully.' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.' });
    }

    const user = await User.findOne({ where: { email, otp } });
    
    if (!user || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    
    user.password = newPassword;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();
    
    res.status(200).json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.verifyEmail = async (req, res) => {
  res.status(200).json({ message: 'Email verified' });
};

// ── TWO-FACTOR AUTHENTICATION (TOTP) ────────────────────────────────────────

exports.setup2FA = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const speakeasy = require('speakeasy');
    const qrcode = require('qrcode');

    // Generate a new secret
    const secret = speakeasy.generateSecret({ 
      name: `Connect Platform (${user.email})` 
    });

    // Temporarily save the secret (it is NOT enabled until verified)
    user.twoFactorSecret = secret.base32;
    await user.save();

    // Generate QR code data URL
    qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
      if (err) return res.status(500).json({ message: 'Error generating QR code' });
      res.status(200).json({ secret: secret.base32, qrCode: data_url });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verify2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const speakeasy = require('speakeasy');
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 1
    });

    if (verified) {
      user.isTwoFactorEnabled = true;
      await user.save();
      res.status(200).json({ message: 'Two-Factor Authentication successfully enabled!' });
    } else {
      res.status(400).json({ message: 'Invalid code. Please try again.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
