const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Venue = sequelize.define('Venue', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Sports'
  },
  facilityType: {
    type: DataTypes.STRING,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Full street address — shown only inside venue detail, not in search listings
  fullAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  price: {
    type: DataTypes.STRING,
    allowNull: false
  },
  priceNum: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  img: {
    type: DataTypes.TEXT,
  },
  // Gallery: array of image paths (URL strings or /uploads/filename)
  gallery: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  time: {
    type: DataTypes.STRING,
    defaultValue: '6 AM - 10 PM'
  },
  description: {
    type: DataTypes.TEXT,
  },
  ownerId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  // Availability management by owner
  isClosed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  closureReason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Specific time availability override (JSON array of blocked hour strings e.g. ["06","07"])
  blockedSlots: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
    defaultValue: 'Pending'
  },
  verificationDoc: {
    type: DataTypes.TEXT, // URL to the NIC or Business Registration
  },
  docType: {
    type: DataTypes.ENUM('NIC', 'BR'),
    allowNull: true
  },
  confidenceScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  verificationAnalysis: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  capacity: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  amenities: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  matchPrice: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  }
});

// Relationships
User.hasMany(Venue, { foreignKey: 'ownerId' });
Venue.belongsTo(User, { foreignKey: 'ownerId' });

module.exports = Venue;
