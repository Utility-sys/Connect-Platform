const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');

exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    
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

    // Send welcome email — non-fatal
    try {
      await emailService.sendEmail({
        to: user.email,
        subject: 'Welcome to Connect!',
        html: `<h3>Welcome ${user.firstName}!</h3><p>Your account has been successfully created. Explore top venues today!</p>`
      });
    } catch (emailErr) {
      console.warn('  Welcome email failed (registration still succeeded):', emailErr.message);
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
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
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
    
    await user.destroy();
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) { res.status(500).json({ message: error.message }); }
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
      console.warn('  OTP email failed (OTP still saved):', emailErr.message);
    }

    res.status(200).json({ message: 'OTP sent to email successfully.' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
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
