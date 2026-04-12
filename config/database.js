const { Sequelize } = require('sequelize');

// Using SQLite to ensure the database runs smoothly on your Windows machine
// without requiring Docker or a local MySQL server setup.
// If you host this later, simply change the dialect below back to 'mysql'.
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false, // Set to console.log to see SQL queries
});

module.exports = sequelize;
