const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getPool } = require('../config/db');

const JWT_SECRET = 'your_jwt_secret'; 

// Register
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const pool = getPool();
    const conn = await pool.getConnection();

    const [existingUser] = await conn.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await conn.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    conn.release();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const pool = getPool();
    const conn = await pool.getConnection();

    const [user] = await conn.query('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ user_id: user.user_id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '1h',
    });

    conn.release();
    res.json({ token, user: { user_id: user.user_id, name: user.name, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const pool = getPool();
    const conn = await pool.getConnection();

    const result = await conn.query(
      'SELECT user_id, name, email, role FROM users WHERE user_id = ?',
      [userId]
    );

    conn.release();

    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result[0]; 
    res.json(user); 
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};




  