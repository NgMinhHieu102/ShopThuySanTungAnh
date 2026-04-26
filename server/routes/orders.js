const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db } = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'thuysan_tunganh_secret_key';

// Middleware xác thực token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Không có token xác thực' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token không hợp lệ' });
    }
    req.user = user;
    next();
  });
};

// GET - Lấy danh sách đơn hàng của khách hàng
router.get('/', authenticateToken, (req, res) => {
  const customerId = req.user.id;

  db.all(
    `SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC`,
    [customerId],
    (err, orders) => {
      if (err) {
        return res.status(500).json({ error: 'Lỗi server' });
      }

      // Lấy chi tiết items cho mỗi đơn hàng
      const ordersWithItems = [];
      let completed = 0;

      if (orders.length === 0) {
        return res.json([]);
      }

      orders.forEach(order => {
        db.all(
          `SELECT oi.*, p.name as product_name, p.image_url 
           FROM order_items oi 
           LEFT JOIN products p ON oi.product_id = p.id 
           WHERE oi.order_id = ?`,
          [order.id],
          (err, items) => {
            if (err) {
              console.error('Error fetching order items:', err);
            }

            ordersWithItems.push({
              ...order,
              items: items || []
            });

            completed++;
            if (completed === orders.length) {
              res.json(ordersWithItems);
            }
          }
        );
      });
    }
  );
});

// GET - Lấy chi tiết một đơn hàng
router.get('/:id', authenticateToken, (req, res) => {
  const orderId = req.params.id;
  const customerId = req.user.id;

  db.get(
    'SELECT * FROM orders WHERE id = ? AND customer_id = ?',
    [orderId, customerId],
    (err, order) => {
      if (err) {
        return res.status(500).json({ error: 'Lỗi server' });
      }

      if (!order) {
        return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
      }

      // Lấy items của đơn hàng
      db.all(
        `SELECT oi.*, p.name as product_name, p.image_url 
         FROM order_items oi 
         LEFT JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id = ?`,
        [orderId],
        (err, items) => {
          if (err) {
            return res.status(500).json({ error: 'Lỗi server' });
          }

          res.json({
            ...order,
            items: items || []
          });
        }
      );
    }
  );
});

// POST - Tạo đơn hàng mới
router.post('/', authenticateToken, (req, res) => {
  const { items, shipping_address, phone, notes, payment_method } = req.body;
  const customerId = req.user.id;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Đơn hàng phải có ít nhất 1 sản phẩm' });
  }

  // Tính tổng tiền
  let totalAmount = 0;
  items.forEach(item => {
    totalAmount += item.price * item.quantity;
  });

  // Tạo đơn hàng
  db.run(
    `INSERT INTO orders (customer_id, total_amount, status, shipping_address, phone, notes, payment_method) 
     VALUES (?, ?, 'pending', ?, ?, ?, ?)`,
    [customerId, totalAmount, shipping_address, phone, notes, payment_method || 'cod'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Lỗi tạo đơn hàng' });
      }

      const orderId = this.lastID;

      // Thêm items vào đơn hàng
      const stmt = db.prepare(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)'
      );

      items.forEach(item => {
        stmt.run(orderId, item.product_id, item.quantity, item.price);
      });

      stmt.finalize();

      res.status(201).json({
        message: 'Đặt hàng thành công',
        orderId: orderId
      });
    }
  );
});

module.exports = router;
