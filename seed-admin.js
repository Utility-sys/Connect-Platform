/**
 * seed-admin.js  – run once:  node seed-admin.js
 * Password is passed as plain text; the User model's beforeSave hook hashes it.
 */
require('dotenv').config();
const sequelize = require('./config/database');
const User      = require('./models/User');

async function seed() {
  await sequelize.sync();

  const email = 'admin@connect.lk';
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    // Wipe and recreate so we're guaranteed a clean password
    await existing.destroy();
    console.log('ℹ️  Old admin removed, recreating…');
  }

  // Plain-text password — the beforeSave hook will hash it automatically
  await User.create({
    id:        `u-admin-${Date.now()}`,
    firstName: 'System',
    lastName:  'Admin',
    email,
    password:  'Admin@1234',   // plain text → hook hashes once
    role:      'admin',
  });

  console.log('✅ Admin account ready!');
  console.log('   Email:    admin@connect.lk');
  console.log('   Password: Admin@1234');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
