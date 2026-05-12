const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User  = require('./User');
const Venue = require('./Venue');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  venueId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  reviewerName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 },
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

// Relationships
Venue.hasMany(Review, { foreignKey: 'venueId', onDelete: 'CASCADE' });
Review.belongsTo(Venue, { foreignKey: 'venueId' });
User.hasMany(Review,  { foreignKey: 'userId',  onDelete: 'CASCADE' });
Review.belongsTo(User, { foreignKey: 'userId' });

module.exports = Review;
