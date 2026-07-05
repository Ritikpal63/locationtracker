const mysql = require('mysql2');

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'location_camera_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true // Required for creating tables
});

// Promisify for async/await
const promisePool = pool.promise();

// Database initialization function
const initializeDatabase = async () => {
  try {
    // Create database if not exists
    await promisePool.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'location_camera_db'}`);
    await promisePool.query(`USE ${process.env.DB_NAME || 'location_camera_db'}`);
    
    // Create users table
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        user_agent TEXT,
        ip_address VARCHAR(45),
        first_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_session_id (session_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create locations table
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        accuracy DECIMAL(10, 2),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_timestamp (timestamp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create photos table
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS photos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        image_data LONGTEXT NOT NULL,
        device_info TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_timestamp (timestamp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Database tables created/verified successfully');
    return promisePool;
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
};

module.exports = { pool: promisePool, initializeDatabase };