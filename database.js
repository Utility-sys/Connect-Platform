const { Sequelize } = require('sequelize');

// Using SQLite to ensure the database runs smoothly on your Windows machine
// without requiring Docker or a local MySQL server setup.
// If you host this later, simply change the dialect below back to 'mysql'.
let sequelize;

if (process.env.DATABASE_URL) {
  // Cloud deployment (Render PostgreSQL)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  });
} else {
  // Local development (MySQL/SQLite)
  sequelize = new Sequelize(
    process.env.DB_NAME || 'connect_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
      host: process.env.DB_HOST || '127.0.0.1',
      dialect: process.env.DB_DIALECT || 'mysql',
      logging: false,
      port: process.env.DB_PORT || 3306
    }
  );
}

module.exports = sequelize;
