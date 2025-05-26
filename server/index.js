const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const menuRoutes = require('./routes/menuRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const path = require('path');


const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/reservations', reservationRoutes);

const PORT = 5000;

app.listen(PORT, async () => {
  await initializeDatabase();
  console.log(` Server running on http://localhost:${PORT}`);
});
