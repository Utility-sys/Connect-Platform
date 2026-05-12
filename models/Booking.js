const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Venue = require('./Venue');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  venueId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Venue, key: 'id' }
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: { model: User, key: 'id' }
  },
  venueName: {
    type: DataTypes.STRING,
  },
  customerName: {
    type: DataTypes.STRING,
    defaultValue: 'Guest'
  },
  idempotencyKey: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  customerEmail: {
    type: DataTypes.STRING,
    defaultValue: '—'
  },
  customerPhone: {
    type: DataTypes.STRING,
    defaultValue: '—'
  },
  ownerId: {
    type: DataTypes.STRING,
  },
  date: {
    type: DataTypes.STRING,
    allowNull: false
  },
  timeSlots: {
    type: DataTypes.JSON,
    allowNull: false
  },
  totalAmount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Confirmed', 'Cancelled', 'Edited'),
    defaultValue: 'Confirmed'
  },
  cancellationReason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reminderSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

// Relationships
User.hasMany(Booking, { foreignKey: 'userId' });
Booking.belongsTo(User, { foreignKey: 'userId' });
Venue.hasMany(Booking, { foreignKey: 'venueId' });
Booking.belongsTo(Venue, { foreignKey: 'venueId' });

module.exports = Booking;
