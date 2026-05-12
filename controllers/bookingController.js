const Booking = require('../models/Booking');
const User = require('../models/User');
const Venue = require('../models/Venue');
const emailService = require('../services/emailService');
const emailTemplates = require('../services/emailTemplates');
const sequelize = require('../config/database');
const crypto = require('crypto');

/**
 * PayHere Webhook Verification (NFR-SEC-05)
 * Verifies the MD5 signature of the payment callback to prevent forged payments.
 */
exports.payHereWebhook = async (req, res) => {
  try {
    const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig } = req.body;
    
    // In production, this comes from process.env.PAYHERE_SECRET
    const merchantSecret = process.env.PAYHERE_SECRET || 'MOCKED_SECRET_KEY';
    const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
    
    const amountFormatted = parseFloat(payhere_amount).toLocaleString('en-us', { minimumFractionDigits: 2 }).replaceAll(',', '');
    const sigString = `${merchant_id}${order_id}${amountFormatted}${payhere_currency}${status_code}${hashedSecret}`;
    const generatedSig = crypto.createHash('md5').update(sigString).digest('hex').toUpperCase();

    if (generatedSig === md5sig) {
      console.log('✅ PayHere Signature Verified for Order:', order_id);
      // Logic to mark booking as Paid goes here
      return res.status(200).send('OK');
    } else {
      console.error('❌ PayHere Signature Verification Failed!');
      return res.status(400).send('Invalid Signature');
    }
  } catch (error) {
    console.error('Webhook Error:', error);
    return res.status(500).send('Webhook Error');
  }
};

const mapBooking = (b) => ({
  ...b.toJSON(),
  totalPrice: b.totalAmount,
  customerId: b.userId,
});

/**
 * Creates a new booking with ACID transaction safety and idempotency protection.
 * @async
 * @param {Object} req - The Express request object containing booking payload in body.
 * @param {Object} res - The Express response object.
 * @returns {Promise<void>} Returns the created booking JSON or an error message.
 * @throws {Error} Will rollback the transaction if any database operation fails.
 */
exports.createBooking = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const id = `b-${Date.now()}`;
    const idempotencyKey = req.body.idempotencyKey;

    if (idempotencyKey) {
      const existingBooking = await Booking.findOne({ where: { idempotencyKey } });
      if (existingBooking) {
        await transaction.rollback();
        return res.status(200).json(existingBooking);
      }
    }
    
    const userId = req.body.userId || req.user?.id;
    if (!userId) {
      await transaction.rollback();
      console.error('❌ Booking failed: Missing userId in both body and auth context.');
      return res.status(400).json({ message: 'User verification failed' });
    }

    const body = req.body;
    const userRecord = await User.findByPk(userId);

    // Helpers to detect missing or empty data
    const isMissing = (val) => !val || val === '' || val === 'null' || val === 'undefined';

    const customerName = isMissing(body.customerName) 
        ? (userRecord ? `${userRecord.firstName} ${userRecord.lastName}` : 'Guest')
        : body.customerName;

    const customerEmail = isMissing(body.customerEmail) 
        ? (userRecord?.email || '—')
        : body.customerEmail;

    const customerPhone = isMissing(body.customerPhone) 
        ? (userRecord?.phone || '—')
        : body.customerPhone;

    console.log('📡 --- Security Hardened Payload ---');
    console.log(`👤 Name:   ${customerName}`);
    console.log(`📧 Email:  ${customerEmail}`);
    console.log(`📞 Phone:  ${customerPhone}`);
    console.log('------------------------------------');

    const booking = await Booking.create({ 
      ...body, 
      id, 
      userId,
      customerName,
      customerEmail,
      customerPhone,
      idempotencyKey
    }, { transaction });
    console.log(`✅ Multi-Layer Save Success: ${id}`);
    await transaction.commit();

    // Send confirmation email — non-fatal
    try {
      const venue = await Venue.findByPk(booking.venueId);
      const owner = await User.findByPk(booking.ownerId);

      // Build a proper customer object with firstName extracted from saved name
      const nameParts = (customerName || '').trim().split(' ');
      const customerObj = {
        firstName: nameParts[0] || 'Customer',
        lastName:  nameParts.slice(1).join(' ') || '',
        email:     customerEmail,
        phone:     req.body.customerPhone || null,
      };

      console.log(`📡 Preparing notifications for ${customerEmail}`);

      if (customerEmail && venue) {
        // 1. Customer confirmation
        await emailService.sendEmail({
          to: customerEmail,
          subject: `Booking Confirmed: ${venue.name}`,
          html: emailTemplates.bookingConfirmed(customerObj, venue, booking)
        });

        // 2. Owner notification (dedicated revenue-focused email)
        if (owner && owner.email) {
          await emailService.sendEmail({
            to: owner.email,
            subject: `New Booking Confirmed at ${venue.name}`,
            html: emailTemplates.bookingConfirmedForOwner(owner, venue, booking, customerObj)
          });
        }

        console.log(`✅ Real-time notifications dispatched successfully.`);
      }
    } catch (emailErr) {
      console.warn('⚠️  Confirmation email failed (booking still succeeded):', emailErr.message);
    }

    res.status(201).json(booking);
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error('❌ Error creating booking:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      include: [
        { model: User, attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Venue, attributes: ['id', 'name', 'ownerId'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.status(200).json(bookings.map(mapBooking));
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const { userId } = req.params;
    const bookings = await Booking.findAll({
      where: { userId },
      include: [
        { model: Venue, attributes: ['id', 'name', 'img', 'gallery', 'location', 'ownerId'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.status(200).json(bookings.map(mapBooking));
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getOwnerBookings = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const { Op } = require('sequelize');
    
    // 1. Get all venue IDs for this owner
    const venues = await Venue.findAll({ where: { ownerId }, attributes: ['id'] });
    const venueIds = venues.map(v => v.id);

    // 2. Fetch bookings matching either the ownerId OR any of the owner's venues
    const bookings = await Booking.findAll({
      where: {
        [Op.or]: [
          { ownerId },
          { venueId: { [Op.in]: venueIds } }
        ]
      },
      include: [
        { model: User, attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Venue, attributes: ['id', 'name', 'img'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.status(200).json(bookings.map(mapBooking));
  } catch (error) {
    console.error('Get owner bookings error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const booking = await Booking.findByPk(id, {
      include: [
        { model: User, attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Venue, attributes: ['id', 'name', 'img'] },
      ]
    });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    await booking.update({ status: 'Cancelled', cancellationReason: reason });

    // Notify user of cancellation
    try {
      const targetEmail = booking.customerEmail || booking.User?.email;
      if (targetEmail && booking.Venue) {
        await emailService.sendEmail({
          to: targetEmail,
          subject: `⚠️ Booking Update: Your reservation at ${booking.Venue.name} has been cancelled`,
          html: emailTemplates.emergencyCancellation({ firstName: booking.customerName || booking.User?.firstName || 'Customer' }, booking.Venue, booking, reason)
        });
      }
    } catch (e) { console.warn('Cancellation email failed:', e.message); }

    res.status(200).json(mapBooking(booking));
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, timeSlots, timeSlot } = req.body;
    const slots = timeSlots || (timeSlot ? [timeSlot] : undefined);
    
    const booking = await Booking.findByPk(id, {
      include: [
        { model: User, attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Venue, attributes: ['id', 'name', 'img'] },
      ]
    });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    await booking.update({ date, timeSlots: slots, status: 'Edited' });

    // Notify customer of update
    try {
      const targetEmail = booking.customerEmail || booking.User?.email;
      if (targetEmail && booking.Venue) {
        await emailService.sendEmail({
          to: targetEmail,
          subject: `🗓️ Booking Updated: ${booking.Venue.name}`,
          html: emailTemplates.bookingEdited(booking.User || { firstName: booking.customerName.split(' ')[0] }, booking.Venue, booking)
        });
      }
    } catch (e) { console.warn('Update email failed:', e.message); }

    res.status(200).json(mapBooking(booking));
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ message: error.message });
  }
};
