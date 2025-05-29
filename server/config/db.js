const mariadb = require('mariadb');
const bcrypt = require('bcrypt');
require('dotenv').config();

const DB_NAME = process.env.DB_NAME || 'tablereserve_db';

const rootPool = mariadb.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306,
  connectionLimit: 5,
  allowPublicKeyRetrieval: true,
});

let pool;

async function initializeDatabase() {
  const rootConn = await rootPool.getConnection();
  await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  console.log(`📁 Database '${DB_NAME}' ensured.`);
  rootConn.release();

  pool = mariadb.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: DB_NAME,
    port: process.env.DB_PORT || 3306,
    connectionLimit: 5,
    allowPublicKeyRetrieval: true,
  });

  const conn = await pool.getConnection();

  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100),
      email VARCHAR(100) UNIQUE,
      password VARCHAR(255),
      role ENUM('user', 'admin') DEFAULT 'user'
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS restaurants (
      restaurant_id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100),
      location VARCHAR(100),
      description TEXT,
      image_url LONGTEXT
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS reservations (
      reservation_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      restaurant_id INT,
      date DATE,
      time TIME,
      people_count INT,
      status ENUM('pending', 'accepted', 'denied') DEFAULT 'pending',
      FOREIGN KEY (user_id) REFERENCES users(user_id),
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id)
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      restaurant_id INT NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      price DECIMAL(10,2),
      category VARCHAR(50),
      image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id) ON DELETE CASCADE
    )
  `);

  const admins = await conn.query(`SELECT * FROM users WHERE role = 'admin'`);
  if (admins.length === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await conn.query(
      `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')`,
      ['Admin', 'admin@example.com', hashedPassword]
    );
    console.log('👤 Default admin created: admin@example.com / admin123');
  }

  conn.release();
  console.log('✅ All tables and columns ensured.');
}

module.exports = {
  initializeDatabase,
  getPool: () => pool
};
