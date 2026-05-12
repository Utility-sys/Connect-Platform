const { Sequelize } = require('sequelize');

// Using SQLite to ensure the database runs smoothly on your Windows machine
// without requiring Docker or a local MySQL server setup.
// If you host this later, simply change the dialect below back to 'mysql'.
const sequelize = new Sequelize(
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

module.exports = sequelize;
