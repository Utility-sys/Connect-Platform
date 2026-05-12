const cron = require('node-cron');
const { Op } = require('sequelize');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Venue = require('../models/Venue');
const emailService = require('./emailService');
const emailTemplates = require('./emailTemplates');

/**
 * Scheduler Service: Connect Platforms
 * Runs periodically to check for upcoming reservations and send 4-hour reminders.
 */
const initScheduler = () => {
    console.log('⏰ Reservation Scheduler Initialized (Checking every 15 mins)');

    // Run every 15 minutes: "*/15 * * * *"
    cron.schedule('*/15 * * * *', async () => {
        const now = new Date();
        console.log(`🔍 [${now.toISOString()}] Scanning for upcoming reservation reminders...`);

        try {
            // Find bookings that are:
            // 1. Confirmed
            // 2. Reminder not yet sent
            const bookings = await Booking.findAll({
                where: {
                    status: 'Confirmed',
                    reminderSent: false,
                },
                include: [
                    { model: User, attributes: ['id', 'firstName', 'email'] },
                    { model: Venue, attributes: ['id', 'name', 'location'] }
                ]
            });

            for (const b of bookings) {
                try {
                    if (!b.timeSlots || b.timeSlots.length === 0) continue;

                    // Parse booking start time
                    const hour = String(b.timeSlots[0]).padStart(2, '0');
                    const startTime = new Date(`${b.date}T${hour}:00:00`);

                    // Calculate the 4-hour reminder threshold
                    const reminderThreshold = new Date(startTime.getTime() - (4 * 60 * 60 * 1000));

                    // Use saved customerEmail if available, fallback to User record
                    const targetEmail = b.customerEmail || b.User?.email;
                    const recipientName = b.customerName?.split(' ')[0] || b.User?.firstName || 'Customer';

                    if (targetEmail && now >= reminderThreshold && now < startTime) {
                        console.log(`🚀 Sending 4h reminder for Booking ${b.id} to ${targetEmail}`);

                        await emailService.sendEmail({
                            to: targetEmail,
                            subject: `Reminder: Your reservation at ${b.Venue.name} starts in 4 hours!`,
                            html: emailTemplates.bookingReminder({ firstName: recipientName }, b.Venue, b)
                        });

                        // Mark as sent
                        b.reminderSent = true;
                        await b.save();
                        console.log(`✅ Reminder marked as sent for ${b.id}`);
                    }
                } catch (bErr) {
                    console.error(`❌ Error processing reminder for booking ${b.id}:`, bErr.message);
                }
            }
        } catch (err) {
            console.error('❌ Scheduler cycle failed:', err.message);
        }
    });
};

module.exports = { initScheduler };
