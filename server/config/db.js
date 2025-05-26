const mariadb = require('mariadb');
const bcrypt = require('bcrypt');

const DB_NAME = 'tablereserve_db';

const rootPool = mariadb.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: 'Dkanakis2004',
  port: 3306,
  connectionLimit: 5,
  allowPublicKeyRetrieval: true,
});

let pool;

async function initializeDatabase() {
  const rootConn = await rootPool.getConnection();
  await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  console.log(` Database '${DB_NAME}' ensured.`);
  rootConn.release();

  pool = mariadb.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'Dkanakis2004',
    database: DB_NAME,
    port: 3306,
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
      description TEXT
    )
  `);

  const [imageCol] = await conn.query(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'restaurants' AND COLUMN_NAME = 'image_url'
  `, [DB_NAME]);

  if (!imageCol) {
    await conn.query(`
      ALTER TABLE restaurants 
      MODIFY COLUMN image_url LONGTEXT
    `);
    console.log(" 'image_url' column changed to LONGTEXT to support base64 images.");
    
  }

  await conn.query(`
    CREATE TABLE IF NOT EXISTS reservations (
      reservation_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      restaurant_id INT,
      date DATE,
      time TIME,
      people_count INT,
      FOREIGN KEY (user_id) REFERENCES users(user_id),
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id)
    )
  `);

  const [statusCol] = await conn.query(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'reservations' AND COLUMN_NAME = 'status'
  `, [DB_NAME]);

  if (!statusCol) {
    await conn.query(`
      ALTER TABLE reservations 
      ADD COLUMN status ENUM('pending', 'accepted', 'denied') DEFAULT 'pending'
    `);
    console.log(" 'status' column added to reservations table.");
  }

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
  console.log(' All tables and columns ensured.');
}

module.exports = {
  initializeDatabase,
  getPool: () => pool
};
