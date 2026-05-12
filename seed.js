/**
 * seed.js — Resets the database and populates only the required system admin.
 * Run: node seed.js
 *
 * All existing data is WIPED and recreated cleanly.
 * NO dummy users or venues are created.
 */

const sequelize = require('./config/database');
const User      = require('./models/User');
const Venue     = require('./models/Venue');
const Booking   = require('./models/Booking');
const Review    = require('./models/Review');

const DEMO_USERS = [
  {
    id: 'admin-main',
    email: 'admin@connect.lk',
    password: 'Admin@1234',
    firstName: 'Connect',
    lastName: 'Admin',
    role: 'admin',
  }
];

async function seed() {
  try {
    await sequelize.sync({ force: true }); // Full reset
    console.log('🗄️  Database reset complete.');

    // Create admin user
    for (const u of DEMO_USERS) {
      await User.create(u);
    }
    console.log(`✅ Created system admin.`);

    console.log('\n────────────────────────────────');
    console.log('🎉 Seeding complete! Test accounts:');
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

