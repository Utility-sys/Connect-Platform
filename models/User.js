const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('user', 'owner', 'admin'),
    defaultValue: 'user'
  },
  otp: {
    type: DataTypes.STRING,
    allowNull: true
  },
  otpExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // ── Security Fields ──────────────────────────────────────────────────────────
  failedLoginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lockoutUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  twoFactorSecret: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isTwoFactorEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  hooks: {
    beforeSave: async (user) => {
      if (user.isNewRecord || user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

module.exports = User;
