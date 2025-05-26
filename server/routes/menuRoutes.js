const express = require('express');
const router = express.Router();
const db = require('../config/db');


router.get('/:restaurantId', async (req, res) => {
  const { restaurantId } = req.params;
  const pool = db.getPool();

  try {
    const conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM menu_items WHERE restaurant_id = ?', [restaurantId]);
    conn.release();
    res.json(rows);
  } catch (err) {
    console.error('Error fetching menu items:', err);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});


router.post('/:restaurantId', async (req, res) => {
  const { restaurantId } = req.params;
  const { name, description, price, category } = req.body;
  const pool = db.getPool();

  try {
    const conn = await pool.getConnection();
    await conn.query(
      `INSERT INTO menu_items (restaurant_id, name, description, price, category) 
       VALUES (?, ?, ?, ?, ?)`,
      [restaurantId, name, description, price, category]
    );
    conn.release();
    res.status(201).json({ message: 'Menu item added' });
  } catch (err) {
    console.error('Error adding menu item:', err);
    res.status(500).json({ error: 'Failed to add menu item' });
  }
});

module.exports = router;
