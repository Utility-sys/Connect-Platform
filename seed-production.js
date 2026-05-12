/**
 * seed-production.js — Seeds the production PostgreSQL database on Render
 * with an admin user and all demo venues.
 *
 * Run remotely via Render Shell:
 *   node seed-production.js
 *
 * Or locally against production (requires DATABASE_URL in .env):
 *   DATABASE_URL=<your-render-db-url> node seed-production.js
 */
require('dotenv').config();
const sequelize = require('./config/database');
const User = require('./models/User');
const Venue = require('./models/Venue');

// ── Admin User ────────────────────────────────────────────────────────────────
const ADMIN = {
  id: 'admin-main',
  email: 'admin@connect.lk',
  password: 'Admin@1234',
  firstName: 'Connect',
  lastName: 'Admin',
  role: 'admin',
};

// ── System venue owner (venues need an ownerId FK) ────────────────────────────
const SYSTEM_OWNER = {
  id: 'owner-system',
  email: 'venues@connect.lk',
  password: 'Owner@1234',
  firstName: 'Connect',
  lastName: 'Venues',
  role: 'owner',
};

// ── Demo Venues (from mockData.js) ────────────────────────────────────────────
const VENUES = [
  { id: 1,  name: 'Colombo Cricket Nets',       type: 'Cricket',        category: 'Sports',        facilityType: 'Indoor Net',                   location: 'Colombo 02',   price: 'LKR 2,500/hr', priceNum: 2500, rating: 4.9, time: '6 AM - 9 PM',    img: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80', description: 'Professional cricket nets with turf pitches, LED lighting, and bowling machines.' },
  { id: 2,  name: 'SSC Cricket Grounds',        type: 'Cricket',        category: 'Sports',        facilityType: 'Ground with all facilities',    location: 'Colombo 07',   price: 'LKR 5,000/hr', priceNum: 5000, rating: 4.8, time: '7 AM - 8 PM',    img: 'https://images.unsplash.com/photo-1540747913346-19e32fc3e6a5?auto=format&fit=crop&q=80', description: 'Historic cricket ground in the heart of Colombo. Full outfield available for matches and practice.' },
  { id: 3,  name: 'Malay Cricket Club',         type: 'Cricket',        category: 'Sports',        facilityType: 'Ground with all facilities',    location: 'Colombo 08',   price: 'LKR 3,000/hr', priceNum: 3000, rating: 4.6, time: '6 AM - 10 PM',   img: 'https://images.unsplash.com/photo-1589803893043-4e63cd2d5dc6?auto=format&fit=crop&q=80', description: 'Well-maintained cricket practice facility with multiple nets and a full practice ground.' },
  { id: 4,  name: 'Coliseum Futsal Arena',      type: 'Futsal',         category: 'Sports',        facilityType: 'Court',                         location: 'Colombo 07',   price: 'LKR 3,500/hr', priceNum: 3500, rating: 4.9, time: '6 AM - 12 AM',   img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80', description: 'Premium futsal court with synthetic turf, professional lighting and changing rooms.' },
  { id: 5,  name: 'CR&FC Futsal Ground',        type: 'Futsal',         category: 'Sports',        facilityType: 'Court',                         location: 'Colombo 07',   price: 'LKR 4,000/hr', priceNum: 4000, rating: 4.5, time: '8 AM - 11 PM',   img: 'https://images.unsplash.com/photo-1518605368461-1ee7c58ed83e?auto=format&fit=crop&q=80', description: 'Iconic Colombo rugby and futsal ground with premium courts and floodlights for night matches.' },
  { id: 6,  name: 'Mount Lavinia Futsal Park',  type: 'Futsal',         category: 'Sports',        facilityType: 'Court',                         location: 'Mount Lavinia',price: 'LKR 3,000/hr', priceNum: 3000, rating: 4.3, time: '6 AM - 12 AM',   img: 'https://images.unsplash.com/photo-1551280857-e613f890e10b?auto=format&fit=crop&q=80', description: 'Beachside futsal park with quality synthetic turf courts.' },
  { id: 7,  name: 'Royal Basketball Court',     type: 'Basketball',     category: 'Sports',        facilityType: 'Court',                         location: 'Colombo 07',   price: 'LKR 3,000/hr', priceNum: 3000, rating: 4.8, time: '7 AM - 10 PM',   img: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80', description: 'Full-length hardwood basketball courts with professional markings and adjustable hoops.' },
  { id: 8,  name: 'Nugegoda Hoops Center',      type: 'Basketball',     category: 'Sports',        facilityType: 'Court',                         location: 'Nugegoda',     price: 'LKR 2,800/hr', priceNum: 2800, rating: 4.4, time: '8 AM - 10 PM',   img: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80', description: 'Modern indoor basketball facility with air conditioning, bleachers, and quality flooring.' },
  { id: 9,  name: 'Borella Sports Complex',     type: 'Basketball',     category: 'Sports',        facilityType: 'Court',                         location: 'Borella',      price: 'LKR 2,500/hr', priceNum: 2500, rating: 4.5, time: '6 AM - 9 PM',    img: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a26?auto=format&fit=crop&q=80', description: 'Municipal sports complex with indoor and outdoor basketball courts.' },
  { id: 10, name: 'Smashers Badminton Club',    type: 'Badminton',      category: 'Sports',        facilityType: 'Court',                         location: 'Nawala',       price: 'LKR 2,000/hr', priceNum: 2000, rating: 4.8, time: '5 AM - 10 PM',   img: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&q=80', description: 'Six synthetic badminton courts with BWF-standard markings and LED lighting.' },
  { id: 11, name: 'Rajagiriya Badminton Hall',  type: 'Badminton',      category: 'Sports',        facilityType: 'Court',                         location: 'Rajagiriya',   price: 'LKR 1,800/hr', priceNum: 1800, rating: 4.6, time: '6 AM - 9 PM',    img: 'https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?auto=format&fit=crop&q=80', description: 'Spacious badminton hall with 8 courts and air-conditioning.' },
  { id: 12, name: 'Dehiwala Shuttle Arena',     type: 'Badminton',      category: 'Sports',        facilityType: 'Court',                         location: 'Dehiwala',     price: 'LKR 1,500/hr', priceNum: 1500, rating: 4.3, time: '6 AM - 10 PM',   img: 'https://images.unsplash.com/photo-1625449745613-2e0e20f6b81e?auto=format&fit=crop&q=80', description: 'Affordable badminton facility in South Colombo with quality courts.' },
  { id: 13, name: 'Aqua Swim Center',           type: 'Swimming',       category: 'Sports',        facilityType: 'Pool',                          location: 'Colombo 05',   price: 'LKR 1,500/hr', priceNum: 1500, rating: 4.6, time: '6 AM - 8 PM',    img: 'https://images.unsplash.com/photo-1600965962361-9035dbfd1c50?auto=format&fit=crop&q=80', description: 'Olympic-size swimming pool with dedicated lanes for lap swimming.' },
  { id: 14, name: 'Wellawatte Aquatic Club',    type: 'Swimming',       category: 'Sports',        facilityType: 'Pool',                          location: 'Wellawatte',   price: 'LKR 1,200/hr', priceNum: 1200, rating: 4.4, time: '5:30 AM - 7:30 PM', img: 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?auto=format&fit=crop&q=80', description: 'Community swimming pool with recreational and training lanes.' },
  { id: 15, name: 'Colombo Hilton Pool',        type: 'Swimming',       category: 'Sports',        facilityType: 'Pool',                          location: 'Colombo 01',   price: 'LKR 3,500/hr', priceNum: 3500, rating: 4.9, time: '6 AM - 9 PM',    img: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&q=80', description: 'Premium rooftop swimming pool with panoramic city views and heated water.' },
  { id: 16, name: 'Lankan Sounds Studio',       type: 'Music Studio',   category: 'Entertainment', facilityType: 'Recording Studio',              location: 'Colombo 03',   price: 'LKR 5,000/hr', priceNum: 5000, rating: 4.7, time: '24 Hours',        img: 'https://images.unsplash.com/photo-1470229722913-7c090bf8c04c?auto=format&fit=crop&q=80', description: 'Professional-grade recording studio with SSL mixing console and isolation booths.' },
  { id: 17, name: 'Urban Beats Studio',         type: 'Music Studio',   category: 'Entertainment', facilityType: 'Recording Studio',              location: 'Colombo 01',   price: 'LKR 6,000/hr', priceNum: 6000, rating: 5.0, time: '24 Hours',        img: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80', description: "Colombo's premier recording facility with a live room, vocal booth, and Pro Tools setup." },
  { id: 18, name: 'Crescendo Recording Hub',    type: 'Music Studio',   category: 'Entertainment', facilityType: 'Recording Studio',              location: 'Colombo 06',   price: 'LKR 4,500/hr', priceNum: 4500, rating: 4.6, time: '10 AM - 2 AM',   img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&q=80', description: 'Boutique recording studio perfect for podcasts, voiceovers, and solo artists.' },
  { id: 19, name: 'Rhythm Room Practice Space', type: 'Music Practice', category: 'Entertainment', facilityType: 'Practice Room',                 location: 'Colombo 04',   price: 'LKR 1,500/hr', priceNum: 1500, rating: 4.7, time: '8 AM - 11 PM',   img: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80', description: 'Fully soundproofed band practice rooms with drum kits, amps, and PA system.' },
  { id: 20, name: 'Harmony Practice Studios',   type: 'Music Practice', category: 'Entertainment', facilityType: 'Practice Room',                 location: 'Nugegoda',     price: 'LKR 1,200/hr', priceNum: 1200, rating: 4.5, time: '7 AM - 10 PM',   img: 'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?auto=format&fit=crop&q=80', description: 'Multiple soundproof practice rooms for solo musicians and bands.' },
  { id: 21, name: 'SoundBox Music Hall',        type: 'Music Practice', category: 'Entertainment', facilityType: 'Practice Room',                 location: 'Rajagiriya',   price: 'LKR 1,800/hr', priceNum: 1800, rating: 4.8, time: '9 AM - 12 AM',   img: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&q=80', description: 'Spacious music halls for rehearsals and small performances.' },
  { id: 22, name: 'City Football Ground',       type: 'Football',       category: 'Sports',        facilityType: 'Ground with all facilities',    location: 'Colombo 08',   price: 'LKR 5,500/hr', priceNum: 5500, rating: 4.8, time: '6 AM - 10 PM',   img: 'https://images.unsplash.com/photo-1518605368461-1ee7c58ed83e?auto=format&fit=crop&q=80', description: 'Full 11-a-side professional football ground with natural grass and floodlights.' },
  { id: 23, name: 'Pele City Pitch',            type: 'Football',       category: 'Sports',        facilityType: 'Ground with all facilities',    location: 'Colombo 10',   price: 'LKR 4,000/hr', priceNum: 4000, rating: 4.4, time: '7 AM - 9 PM',    img: 'https://images.unsplash.com/photo-1624880357913-a8539b06368c?auto=format&fit=crop&q=80', description: 'Standard size 11-a-side football pitch with modern changing rooms.' },
  { id: 24, name: 'Lanka F.C. Arena',           type: 'Football',       category: 'Sports',        facilityType: 'Ground with all facilities',    location: 'Mount Lavinia',price: 'LKR 4,500/hr', priceNum: 4500, rating: 4.7, time: '6 AM - 10 PM',   img: 'https://images.unsplash.com/photo-1518605368461-1ee7c58ed83e?auto=format&fit=crop&q=80', description: 'A dedicated football arena with highly maintained turf and stadium seating.' },
];

async function seed() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected.');

    console.log('🔄 Syncing tables (no force — preserving existing data)...');
    await sequelize.sync();

    // ── Create admin user ────────────────────────────────────────────────────
    const [admin, adminCreated] = await User.findOrCreate({
      where: { email: ADMIN.email },
      defaults: ADMIN,
    });
    console.log(adminCreated ? '✅ Admin user created.' : 'ℹ️  Admin user already exists.');

    // ── Create system owner ──────────────────────────────────────────────────
    const [owner, ownerCreated] = await User.findOrCreate({
      where: { email: SYSTEM_OWNER.email },
      defaults: SYSTEM_OWNER,
    });
    console.log(ownerCreated ? '✅ System owner created.' : 'ℹ️  System owner already exists.');

    // ── Create venues ────────────────────────────────────────────────────────
    let created = 0;
    let skipped = 0;
    for (const v of VENUES) {
      const [, wasCreated] = await Venue.findOrCreate({
        where: { id: v.id },
        defaults: { ...v, ownerId: owner.id, status: 'Approved' },
      });
      wasCreated ? created++ : skipped++;
    }
    console.log(`✅ Venues: ${created} created, ${skipped} already existed.`);

    console.log('\n────────────────────────────────');
    console.log('🎉 Seeding complete!');
    console.log('  Admin:        admin@connect.lk / Admin@1234');
    console.log('  System Owner: venues@connect.lk / Owner@1234');
    console.log(`  Venues:       ${VENUES.length} total`);
    console.log('────────────────────────────────\n');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seed();
