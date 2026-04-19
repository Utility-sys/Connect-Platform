const Booking = require('../models/Booking');
const User = require('../models/User');
const Venue = require('../models/Venue');
const emailService = require('../services/emailService');

const mapBooking = (b) => ({
  ...b.toJSON(),
  totalPrice: b.totalAmount,
  customerId: b.userId,
});

exports.createBooking = async (req, res) => {
  try {
    const id = `b-${Date.now()}`;
    const booking = await Booking.create({ ...req.body, id });

    // Send confirmation email — non-fatal (failure just logs a warning)
    try {
      const user = await User.findByPk(booking.userId);
      const venue = await Venue.findByPk(booking.venueId);
      if (user && venue) {
        await emailService.sendEmail({
          to: user.email,
          subject: `Booking Confirmed & Receipt: ${venue.name}`,
          html: `<h2>Your Booking is Confirmed!</h2>
                 <p>Thank you for booking with Connect Platforms.</p>
                 <hr/>
                 <p><b>Venue:</b> ${venue.name}</p>
                 <p><b>Date:</b> ${booking.date}</p>
                 <p><b>Time Slots:</b> ${booking.timeSlots ? booking.timeSlots.join(', ') : ''}</p>
                 <p><b>Total Amount Paid:</b> LKR ${booking.totalAmount}</p>
                 <hr/>
                 <p>You can reschedule or cancel this booking via your dashboard.</p>`
        });
      }
    } catch (emailErr) {
      console.warn('  Email dispatch failed (booking still created):', emailErr.message);
    }

    res.status(201).json(mapBooking(booking));
  } catch (error) {
    console.error('Create booking error:', error);
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
    const bookings = await Booking.findAll({
      where: { ownerId },
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
    await Booking.update(
      { status: 'Cancelled', cancellationReason: reason },
      { where: { id } }
    );
    const updatedBooking = await Booking.findByPk(id);
    res.status(200).json(mapBooking(updatedBooking));
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
    await Booking.update(
      { date, timeSlots: slots, status: 'Edited' },
      { where: { id } }
    );
    const updatedBooking = await Booking.findByPk(id);
    res.status(200).json(mapBooking(updatedBooking));
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ message: error.message });
  }
};
