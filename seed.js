/**
 * seed.js — Resets and populates the database with demo accounts.
 * Run: node seed.js
 *
 * Creates:
 *  - 2 venue owners (each with venues they manage)
 *  - 2 searcher/customer accounts
 *  - A selection of demo venues (owned by the owners defined above)
 *
 * All existing data is WIPED and recreated cleanly.
 */

const sequelize = require('./config/database');
const User      = require('./models/User');
const Venue     = require('./models/Venue');
const Booking   = require('./models/Booking');

const DEMO_USERS = [
  // Venue Owners
  {
    id: 'owner-dineth',
    email: 'dineth@connect.lk',
    password: 'password123',
    firstName: 'Dineth',
    lastName: 'Perera',
    role: 'owner',
  },
  {
    id: 'owner-chamara',
    email: 'chamara@connect.lk',
    password: 'password123',
    firstName: 'Chamara',
    lastName: 'Silva',
    role: 'owner',
  },
  // Customers (Searchers)
  {
    id: 'user-rithil',
    email: 'rithil@connect.lk',
    password: 'password123',
    firstName: 'Rithil',
    lastName: 'Fernando',
    role: 'user',
  },
  {
    id: 'user-kasun',
    email: 'kasun@connect.lk',
    password: 'password123',
    firstName: 'Kasun',
    lastName: 'Mendis',
    role: 'user',
  },
  // Administrators
  {
    id: 'admin-main',
    email: 'admin@connect.lk',
    password: 'adminpassword123',
    firstName: 'System',
    lastName: 'Admin',
    role: 'admin',
  },
];

const DEMO_VENUES = [];

async function seed() {
  try {
    await sequelize.sync({ force: true }); // Full reset
    console.log('🗄️  Database reset complete.');

    // Create users
    for (const u of DEMO_USERS) {
      await User.create(u);
    }
    console.log(`✅ Created ${DEMO_USERS.length} users.`);

    // Create venues
    for (const v of DEMO_VENUES) {
      await Venue.create(v);
    }
    console.log(`✅ Created ${DEMO_VENUES.length} venues.`);

    console.log('\n────────────────────────────────');
    console.log('🎉 Seeding complete! Test accounts:');
    console.log('  OWNERS:');
    DEMO_USERS.filter(u => u.role === 'owner').forEach(u =>
      console.log(`   • ${u.email} / ${u.password}  (${u.firstName} ${u.lastName})`)
    );
    console.log('  CUSTOMERS:');
    DEMO_USERS.filter(u => u.role === 'user').forEach(u =>
      console.log(`   • ${u.email} / ${u.password}  (${u.firstName} ${u.lastName})`)
    );
    console.log('  ADMINS:');
    DEMO_USERS.filter(u => u.role === 'admin').forEach(u =>
      console.log(`   • ${u.email} / ${u.password}  (${u.firstName} ${u.lastName})`)
    );
    console.log('────────────────────────────────\n');

  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await sequelize.close();
  }
}

seed();
