const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const verifyToken = require('../middleware/authMiddleware');
const { getPool } = require('../config/db');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });


function checkAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  next();
}


router.get('/restaurants', verifyToken, checkAdmin, async (req, res) => {
  try {
    const pool = getPool();
    const conn = await pool.getConnection();
    const restaurants = await conn.query('SELECT * FROM restaurants');
    conn.release();
    res.json(restaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ message: 'Server error fetching restaurants' });
  }
});


router.post(
  '/restaurants',
  verifyToken,
  checkAdmin,
  upload.single('image'),
  async (req, res) => {
    const { name, location, description } = req.body;
    const image_url = req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : null;

    try {
      const pool = getPool();
      const conn = await pool.getConnection();
      await conn.query(
        'INSERT INTO restaurants (name, location, description, image_url) VALUES (?, ?, ?, ?)',
        [name, location, description, image_url]
      );
      conn.release();
      res.status(201).json({ message: 'Restaurant created successfully' });
    } catch (error) {
      console.error('Error creating restaurant:', error);
      res.status(500).json({ message: 'Server error creating restaurant' });
    }
  }
);


router.put(
  '/restaurants/:id',
  verifyToken,
  checkAdmin,
  upload.single('image'),
  async (req, res) => {
    const { name, location, description } = req.body;
    const id = req.params.id;
    const image_url = req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : null;

    try {
      const pool = getPool();
      const conn = await pool.getConnection();

      
      if (image_url) {
        await conn.query(
          'UPDATE restaurants SET name = ?, location = ?, description = ?, image_url = ? WHERE restaurant_id = ?',
          [name, location, description, image_url, id]
        );
      } else {
        await conn.query(
          'UPDATE restaurants SET name = ?, location = ?, description = ? WHERE restaurant_id = ?',
          [name, location, description, id]
        );
      }

      conn.release();
      res.json({ message: 'Restaurant updated successfully' });
    } catch (error) {
      console.error('Error updating restaurant:', error);
      res.status(500).json({ message: 'Server error updating restaurant' });
    }
  }
);


router.delete('/restaurants/:id', verifyToken, checkAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    const pool = getPool();
    const conn = await pool.getConnection();
    await conn.query('DELETE FROM restaurants WHERE restaurant_id = ?', [id]);
    conn.release();
    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    res.status(500).json({ message: 'Server error deleting restaurant' });
  }
});


router.get('/restaurants/:id/reservations', verifyToken, checkAdmin, async (req, res) => {
  const restaurantId = req.params.id;
  try {
    const pool = getPool();
    const conn = await pool.getConnection();
    const reservations = await conn.query(`
      SELECT r.*, u.name AS user_name, u.email 
      FROM reservations r
      JOIN users u ON r.user_id = u.user_id
      WHERE r.restaurant_id = ?
      ORDER BY r.date DESC, r.time DESC
    `, [restaurantId]);
    conn.release();
    res.json(reservations);
  } catch (err) {
    console.error('Error fetching reservations:', err);
    res.status(500).json({ message: 'Error fetching reservations' });
  }
});


router.put('/reservations/:id/status', verifyToken, checkAdmin, async (req, res) => {
  const { status } = req.body;
  const id = req.params.id;

  if (!['accepted', 'denied'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const pool = getPool();
    const conn = await pool.getConnection();
    await conn.query(
      'UPDATE reservations SET status = ? WHERE reservation_id = ?',
      [status, id]
    );
    conn.release();
    res.json({ message: `Reservation ${status}` });
  } catch (err) {
    console.error('Error updating reservation status:', err);
    res.status(500).json({ message: 'Error updating reservation status' });
  }
});

module.exports = router;
