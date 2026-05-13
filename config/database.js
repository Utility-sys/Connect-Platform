const { Sequelize } = require('sequelize');

let sequelize;

if (process.env.DATABASE_URL) {
  // Production: Use Render's PostgreSQL DATABASE_URL
  sequelize = new Sequelize(process.env.DATABASE_URL, {
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
} else {
  // Local development: Use MySQL
  sequelize = new Sequelize(
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
}

module.exports = sequelize;

