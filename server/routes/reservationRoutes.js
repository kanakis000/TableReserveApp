const express = require('express');
const router = express.Router();
const { getPool } = require('../config/db');
const jwt = require('jsonwebtoken');

// Middleware to authenticate user from token
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    const user = jwt.verify(token, 'your_jwt_secret');
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// CREATE reservation
router.post('/', authenticateUser, async (req, res) => {
  const { restaurant_id, date, time, people_count } = req.body;
  const user_id = req.user.user_id;

  if (!restaurant_id || !date || !time || !people_count) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const pool = getPool();
    const conn = await pool.getConnection();

    await conn.query(
      `INSERT INTO reservations (user_id, restaurant_id, date, time, people_count)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, restaurant_id, date, time, people_count]
    );

    conn.release();
    res.status(201).json({ message: 'Reservation created successfully' });
  } catch (err) {
    console.error('Error creating reservation:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE reservation (edit)
router.put('/:id', authenticateUser, async (req, res) => {
    const reservationId = req.params.id;
    const { date, time, people_count } = req.body;
    const userId = req.user.user_id;
  
    console.log(`Update request for reservation ${reservationId} by user ${userId}`);
    console.log('Received values:', { date, time, people_count });
  
    if (!date || !time || !people_count) {
      return res.status(400).json({ error: 'All fields are required' });
    }
  
    try {
      const pool = getPool();
      const conn = await pool.getConnection();
      const formattedDate = new Date(date).toISOString().split('T')[0];
  
      const [reservation] = await conn.query(
        `SELECT * FROM reservations WHERE reservation_id = ? AND user_id = ?`,
        [reservationId, userId]
      );
  
      console.log('Fetched reservation:', reservation);
  
      if (!reservation) {
        conn.release();
        return res.status(403).json({ error: 'Not authorized to update this reservation' });
      }
  
      await conn.query(
        `UPDATE reservations SET date = ?, time = ?, people_count = ? WHERE reservation_id = ?`,
        [formattedDate, time, people_count, reservationId]
      );
  
      conn.release();
      res.json({ message: 'Reservation updated successfully' });
    } catch (err) {
      console.error('Error updating reservation:', err);
      res.status(500).json({ error: 'Failed to update reservation' });
    }
  });
  

// DELETE reservation (cancel)
router.delete('/:id', authenticateUser, async (req, res) => {
  const reservationId = req.params.id;
  const userId = req.user.user_id;

  try {
    const pool = getPool();
    const conn = await pool.getConnection();

    const [reservation] = await conn.query(
      `SELECT * FROM reservations WHERE reservation_id = ? AND user_id = ?`,
      [reservationId, userId]
    );

    if (!reservation) {
      conn.release();
      return res.status(403).json({ error: 'Not authorized to cancel this reservation' });
    }

    await conn.query(`DELETE FROM reservations WHERE reservation_id = ?`, [reservationId]);
    conn.release();

    console.log(`Reservation ${reservationId} canceled by user ${userId}`);
    res.json({ message: 'Reservation cancelled successfully' });
  } catch (err) {
    console.error('Error cancelling reservation:', err);
    res.status(500).json({ error: 'Failed to cancel reservation' });
  }
});

// GET reservations for a user
router.get('/user/:userId', authenticateUser, async (req, res) => {
  const userId = req.params.userId;

  try {
    const pool = getPool();
    const conn = await pool.getConnection();

    const reservations = await conn.query(
      `SELECT r.*, rs.name AS restaurant_name
       FROM reservations r
       JOIN restaurants rs ON r.restaurant_id = rs.restaurant_id
       WHERE r.user_id = ?
       ORDER BY r.date DESC, r.time DESC`,
      [userId]
    );

    conn.release();
    res.json(reservations);
  } catch (err) {
    console.error('Error fetching user reservations:', err);
    res.status(500).json({ error: 'Failed to load reservations' });
  }
});

module.exports = router;
