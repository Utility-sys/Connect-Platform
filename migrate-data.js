/**
 * migrate-data.js
 * 
 * Use this script to move your LOCAL testing data (MySQL) to your PRODUCTION database (Render PostgreSQL).
 */

require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

// --- 1. LOCAL CONNECTION (MySQL) ---
const localSequelize = new Sequelize(
  process.env.DB_NAME || 'connect_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: 'mysql',
    logging: false,
    port: process.env.DB_PORT || 3306
  }
);

// --- 2. PRODUCTION CONNECTION (PostgreSQL) ---
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL is missing!');
  console.log('Usage: DATABASE_URL="postgres://..." node migrate-data.js');
  process.exit(1);
}

const prodSequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

// --- 3. MODEL DEFINITIONS ---
// We define them manually to avoid binding issues between two database instances
const defineModels = (s) => {
  const User = s.define('User', {
    id: { type: DataTypes.STRING, primaryKey: true },
    email: { type: DataTypes.STRING, unique: true },
    password: { type: DataTypes.STRING },
    firstName: { type: DataTypes.STRING },
    lastName: { type: DataTypes.STRING },
    role: { type: DataTypes.ENUM('user', 'owner', 'admin') }
  }, { timestamps: true });

  const Venue = s.define('Venue', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING },
    type: { type: DataTypes.STRING },
    location: { type: DataTypes.STRING },
    price: { type: DataTypes.STRING },
    priceNum: { type: DataTypes.INTEGER },
    rating: { type: DataTypes.FLOAT },
    img: { type: DataTypes.TEXT },
    description: { type: DataTypes.TEXT },
    ownerId: { type: DataTypes.STRING },
    status: { type: DataTypes.STRING, defaultValue: 'Approved' }
  }, { timestamps: true });

  return { User, Venue };
};

const local = defineModels(localSequelize);
const prod = defineModels(prodSequelize);

async function migrate() {
  try {
    console.log('🔄 Connecting to databases...');
    await localSequelize.authenticate();
    await prodSequelize.authenticate();
    console.log('✅ Connected.');

    // Sync production tables
    console.log('🔄 Ensuring production tables exist...');
    await prodSequelize.sync();

    // ── MIGRATING USERS ──
    console.log('👥 Fetching local users...');
    const users = await local.User.findAll();
    console.log(`Found ${users.length} users. Migrating...`);
    for (const u of users) {
      await prod.User.findOrCreate({
        where: { email: u.email },
        defaults: u.toJSON()
      });
    }
    console.log('✅ User migration complete.');

    // ── MIGRATING VENUES ──
    console.log('🏟️  Fetching local venues...');
    const venues = await local.Venue.findAll();
    console.log(`Found ${venues.length} venues. Migrating...`);
    for (const v of venues) {
      // Use findOrCreate to avoid duplicates
      await prod.Venue.findOrCreate({
        where: { name: v.name, location: v.location },
        defaults: v.toJSON()
      });
    }
    console.log('✅ Venue migration complete.');

    console.log('\n✨ ALL DONE! Your local data is now on the live website.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    if (err.message.includes('ECONNREFUSED')) {
      console.log('\n💡 TIP: Make sure your local MySQL is running on port 3306.');
    }
    if (err.message.includes('no pg_hba.conf entry')) {
      console.log('\n💡 TIP: You MUST use the EXTERNAL Database URL from Render for local access.');
    }
  } finally {
    await localSequelize.close();
    await prodSequelize.close();
    process.exit(0);
  }
}

migrate();
