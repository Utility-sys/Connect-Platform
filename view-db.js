const User = require('./models/User');
const Venue = require('./models/Venue');
const Booking = require('./models/Booking');

async function viewDatabase() {
  try {
    const users = await User.findAll({ raw: true });
    const venues = await Venue.findAll({ raw: true });
    const bookings = await Booking.findAll({ raw: true });

    console.log('\n--- USERS ---');
    console.table(users.map(u => ({ id: u.id, email: u.email, role: u.role })));

    console.log('\n--- VENUES ---');
    console.table(venues.map(v => ({ id: v.id, name: v.name, type: v.type, ownerId: v.ownerId })));

    console.log('\n--- BOOKINGS ---');
    console.table(bookings.map(b => ({ 
      id: b.id, 
      venueId: b.venueId, 
      userId: b.userId, 
      date: b.date, 
      slots: b.timeSlots,
      amount: b.totalAmount,
      status: b.status 
    })));

    process.exit(0);
  } catch (error) {
    console.error('Error viewing database:', error);
    process.exit(1);
  }
}

viewDatabase();
