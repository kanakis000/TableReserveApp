const express = require('express');
const router = express.Router();
const db = require('../config/db');


router.get('/', async (req, res) => {
  const pool = db.getPool();

  try {
    const conn = await pool.getConnection();
    const restaurants = await conn.query('SELECT * FROM restaurants');
    conn.release();
    res.json(restaurants);
  } catch (err) {
    console.error('Error fetching restaurants:', err);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

module.exports = router;
