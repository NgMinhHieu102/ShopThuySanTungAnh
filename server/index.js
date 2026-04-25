const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./database/db');
const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payment');
const chatbotRoutes = require('./routes/chatbot');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server đang hoạt động tốt!' });
});

// Initialize database
db.init().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại port ${PORT}`);
    console.log(`📊 Database SQLite đã được khởi tạo`);
  });
}).catch(err => {
  console.error('❌ Lỗi khởi tạo database:', err);
});