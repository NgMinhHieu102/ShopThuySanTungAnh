const express = require('express');
const router = express.Router();
const { db } = require('../database/db');

// Middleware xác thực admin (đơn giản)
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Không có quyền truy cập' });
  }
  // TODO: Verify JWT token
  next();
};

// GET - Thống kê tổng quan
router.get('/stats', (req, res) => {
  const stats = {};
  
  // Tổng số đơn hàng
  db.get('SELECT COUNT(*) as total FROM orders', (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.totalOrders = row.total;
    
    // Tổng doanh thu
    db.get('SELECT SUM(total_amount) as total FROM orders WHERE status != "cancelled"', (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      stats.totalRevenue = row.total || 0;
      
      // Tổng số khách hàng
      db.get('SELECT COUNT(*) as total FROM customers', (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.totalCustomers = row.total;
        
        // Tổng số sản phẩm
        db.get('SELECT COUNT(*) as total FROM products', (err, row) => {
          if (err) return res.status(500).json({ error: err.message });
          stats.totalProducts = row.total;
          
          res.json(stats);
        });
      });
    });
  });
});

// GET - Doanh thu theo tháng (12 tháng gần nhất)
router.get('/revenue-by-month', (req, res) => {
  const query = `
    SELECT 
      strftime('%Y-%m', created_at) as month,
      SUM(total_amount) as revenue,
      COUNT(*) as orders
    FROM orders
    WHERE status != 'cancelled'
      AND created_at >= date('now', '-12 months')
    GROUP BY month
    ORDER BY month ASC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET - Top sản phẩm bán chạy
router.get('/top-products', (req, res) => {
  const query = `
    SELECT 
      p.id,
      p.name,
      p.image_url,
      SUM(oi.quantity) as total_sold,
      SUM(oi.quantity * oi.price) as revenue
    FROM products p
    JOIN order_items oi ON p.id = oi.product_id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status != 'cancelled'
    GROUP BY p.id
    ORDER BY total_sold DESC
    LIMIT 10
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET - Đơn hàng gần đây
router.get('/recent-orders', (req, res) => {
  const limit = req.query.limit || 10;
  const query = `
    SELECT 
      o.*,
      c.full_name as customer_name,
      c.email as customer_email
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    ORDER BY o.created_at DESC
    LIMIT ?
  `;
  
  db.all(query, [limit], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET - Danh sách tất cả đơn hàng
router.get('/orders', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const status = req.query.status;
  
  let query = `
    SELECT 
      o.*,
      c.full_name as customer_name,
      c.email as customer_email,
      c.phone as customer_phone
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
  `;
  
  const params = [];
  if (status) {
    query += ' WHERE o.status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Đếm tổng số
    let countQuery = 'SELECT COUNT(*) as total FROM orders';
    if (status) {
      countQuery += ' WHERE status = ?';
      db.get(countQuery, [status], (err, countRow) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          orders: rows,
          total: countRow.total,
          page,
          totalPages: Math.ceil(countRow.total / limit)
        });
      });
    } else {
      db.get(countQuery, [], (err, countRow) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          orders: rows,
          total: countRow.total,
          page,
          totalPages: Math.ceil(countRow.total / limit)
        });
      });
    }
  });
});

// PUT - Cập nhật trạng thái đơn hàng
router.put('/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const validStatuses = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
  }
  
  db.run(
    'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
      }
      res.json({ message: 'Cập nhật trạng thái thành công', status });
    }
  );
});

// GET - Danh sách sản phẩm
router.get('/products', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  
  const query = `
    SELECT 
      p.*,
      c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `;
  
  db.all(query, [limit, offset], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.get('SELECT COUNT(*) as total FROM products', [], (err, countRow) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        products: rows,
        total: countRow.total,
        page,
        totalPages: Math.ceil(countRow.total / limit)
      });
    });
  });
});

// PUT - Cập nhật sản phẩm
router.put('/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, price, stock_quantity, is_available } = req.body;
  
  db.run(
    `UPDATE products 
     SET name = ?, price = ?, stock_quantity = ?, is_available = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [name, price, stock_quantity, is_available, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
      }
      res.json({ message: 'Cập nhật sản phẩm thành công' });
    }
  );
});

// DELETE - Xóa sản phẩm
router.delete('/products/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }
    res.json({ message: 'Xóa sản phẩm thành công' });
  });
});

// GET - Danh sách khách hàng
router.get('/customers', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  
  const query = `
    SELECT 
      c.*,
      COUNT(o.id) as total_orders,
      SUM(CASE WHEN o.status != 'cancelled' THEN o.total_amount ELSE 0 END) as total_spent
    FROM customers c
    LEFT JOIN orders o ON c.id = o.customer_id
    GROUP BY c.id
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `;
  
  db.all(query, [limit, offset], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.get('SELECT COUNT(*) as total FROM customers', [], (err, countRow) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        customers: rows,
        total: countRow.total,
        page,
        totalPages: Math.ceil(countRow.total / limit)
      });
    });
  });
});

module.exports = router;
