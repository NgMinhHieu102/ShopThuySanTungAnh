const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db } = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'thuysan_tunganh_secret_key';

// Middleware xác thực admin
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Không có quyền truy cập' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Không có quyền admin' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token không hợp lệ' });
  }
};

// GET - Thống kê tổng quan
router.get('/stats', authenticateAdmin, (req, res) => {
  const stats = {};
  
  // Tổng số đơn hàng (chỉ tính COD hoặc PayOS đã thanh toán)
  db.get(`SELECT COUNT(*) as total FROM orders 
          WHERE (payment_method = 'cod' OR (payment_method = 'payos' AND payment_status = 'paid'))`, 
  (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.totalOrders = row.total;
    
    // Tổng doanh thu (chỉ tính COD hoặc PayOS đã thanh toán, không tính đơn hủy)
    db.get(`SELECT SUM(total_amount) as total FROM orders 
            WHERE status != "cancelled" 
            AND (payment_method = 'cod' OR (payment_method = 'payos' AND payment_status = 'paid'))`, 
    (err, row) => {
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
      AND (payment_method = 'cod' OR (payment_method = 'payos' AND payment_status = 'paid'))
      AND created_at >= date('now', '-12 months')
    GROUP BY month
    ORDER BY month ASC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET - Doanh thu theo filter (ngày/tháng/năm)
router.get('/revenue-by-period', authenticateAdmin, (req, res) => {
  const { period = 'month', limit = 12 } = req.query;
  
  let dateFormat, dateRange, groupBy;
  
  switch (period) {
    case 'day':
      dateFormat = '%Y-%m-%d';
      dateRange = `date('now', '-${limit} days')`;
      groupBy = 'day';
      break;
    case 'month':
      dateFormat = '%Y-%m';
      dateRange = `date('now', '-${limit} months')`;
      groupBy = 'month';
      break;
    case 'year':
      dateFormat = '%Y';
      dateRange = `date('now', '-${limit} years')`;
      groupBy = 'year';
      break;
    default:
      dateFormat = '%Y-%m';
      dateRange = `date('now', '-12 months')`;
      groupBy = 'month';
  }
  
  const query = `
    SELECT 
      strftime('${dateFormat}', created_at) as ${groupBy},
      SUM(total_amount) as revenue,
      COUNT(*) as orders
    FROM orders
    WHERE status != 'cancelled'
      AND (payment_method = 'cod' OR (payment_method = 'payos' AND payment_status = 'paid'))
      AND created_at >= ${dateRange}
    GROUP BY ${groupBy}
    ORDER BY ${groupBy} ASC
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
      AND (o.payment_method = 'cod' OR (o.payment_method = 'payos' AND o.payment_status = 'paid'))
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
    WHERE (o.payment_method = 'cod' OR (o.payment_method = 'payos' AND o.payment_status = 'paid'))
    ORDER BY o.created_at DESC
    LIMIT ?
  `;
  
  db.all(query, [limit], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET - Chi tiết đơn hàng
router.get('/orders/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  
  // Lấy thông tin đơn hàng
  db.get(
    `SELECT 
      o.*,
      c.full_name as customer_name,
      c.email as customer_email,
      c.phone as customer_phone
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE o.id = ?`,
    [id],
    (err, order) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
      
      // Lấy chi tiết sản phẩm trong đơn hàng
      db.all(
        `SELECT 
          oi.*,
          p.name as product_name,
          p.image_url
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?`,
        [id],
        (err, items) => {
          if (err) return res.status(500).json({ error: err.message });
          
          res.json({
            ...order,
            items: items
          });
        }
      );
    }
  );
});

// GET - Danh sách tất cả đơn hàng
router.get('/orders', authenticateAdmin, (req, res) => {
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
    WHERE (o.payment_method = 'cod' OR (o.payment_method = 'payos' AND o.payment_status = 'paid'))
  `;
  
  const params = [];
  if (status) {
    query += ' AND o.status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Đếm tổng số
    let countQuery = `SELECT COUNT(*) as total FROM orders 
                      WHERE (payment_method = 'cod' OR (payment_method = 'payos' AND payment_status = 'paid'))`;
    if (status) {
      countQuery += ' AND status = ?';
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
router.put('/orders/:id/status', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const validStatuses = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
  }
  
  // Kiểm tra phương thức thanh toán của đơn hàng
  db.get('SELECT payment_method FROM orders WHERE id = ?', [id], (err, order) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    
    // Nếu đơn hàng COD và trạng thái là "delivered", tự động cập nhật payment_status = "paid"
    // Vì COD = thanh toán khi nhận hàng, nên đã giao = đã thanh toán
    let updateQuery = 'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    let params = [status, id];
    
    if (order.payment_method === 'cod' && status === 'delivered') {
      updateQuery = 'UPDATE orders SET status = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      params = [status, 'paid', id];
    }
    
    db.run(updateQuery, params, function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
      }
      res.json({ message: 'Cập nhật trạng thái thành công', status });
    });
  });
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

// POST - Thêm sản phẩm mới
router.post('/products', (req, res) => {
  const { 
    name, category_id, price, size, description, image_url, stock_quantity,
    scientific_name, breeding_model, economic_value, key_features, food,
    breeding_time, difficulty, suitable_for, detailed_description
  } = req.body;
  
  if (!name || !category_id || !price) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin' });
  }
  
  db.run(
    `INSERT INTO products (
      name, category_id, price, size, description, image_url, stock_quantity, is_available,
      scientific_name, breeding_model, economic_value, key_features, food,
      breeding_time, difficulty, suitable_for, detailed_description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name, category_id, price, size, description, image_url, stock_quantity || 0,
      scientific_name, breeding_model, economic_value, key_features, food,
      breeding_time, difficulty, suitable_for, detailed_description
    ],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ 
        message: 'Thêm sản phẩm thành công',
        productId: this.lastID 
      });
    }
  );
});

// PUT - Cập nhật sản phẩm
router.put('/products/:id', (req, res) => {
  const { id } = req.params;
  const { 
    name, price, stock_quantity, is_available,
    scientific_name, breeding_model, economic_value, key_features, food,
    breeding_time, difficulty, suitable_for, detailed_description,
    size, description, image_url, category_id
  } = req.body;
  
  db.run(
    `UPDATE products SET 
      name = ?, price = ?, stock_quantity = ?, is_available = ?,
      scientific_name = ?, breeding_model = ?, economic_value = ?, key_features = ?,
      food = ?, breeding_time = ?, difficulty = ?, suitable_for = ?,
      detailed_description = ?, size = ?, description = ?, image_url = ?,
      category_id = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [
      name, price, stock_quantity, is_available,
      scientific_name, breeding_model, economic_value, key_features,
      food, breeding_time, difficulty, suitable_for,
      detailed_description, size, description, image_url, category_id, id
    ],
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

// DELETE - Xóa khách hàng
router.delete('/customers/:id', (req, res) => {
  const { id } = req.params;
  
  // Kiểm tra xem khách hàng có đơn hàng không
  db.get('SELECT COUNT(*) as count FROM orders WHERE customer_id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (row.count > 0) {
      return res.status(400).json({ error: 'Không thể xóa khách hàng đã có đơn hàng' });
    }
    
    db.run('DELETE FROM customers WHERE id = ?', [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
      }
      res.json({ message: 'Xóa khách hàng thành công' });
    });
  });
});

// DELETE - Xóa đơn hàng
router.delete('/orders/:id', (req, res) => {
  const { id } = req.params;
  
  // Xóa order items trước
  db.run('DELETE FROM order_items WHERE order_id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Sau đó xóa order
    db.run('DELETE FROM orders WHERE id = ?', [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
      }
      res.json({ message: 'Xóa đơn hàng thành công' });
    });
  });
});

// GET - Danh sách categories
router.get('/categories', (req, res) => {
  db.all('SELECT * FROM categories ORDER BY name', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST - Thêm category mới
router.post('/categories', (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Vui lòng nhập tên danh mục' });
  }
  
  db.run(
    'INSERT INTO categories (name, description) VALUES (?, ?)',
    [name, description],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ 
        message: 'Thêm danh mục thành công',
        categoryId: this.lastID 
      });
    }
  );
});

// PUT - Cập nhật category
router.put('/categories/:id', (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  
  db.run(
    'UPDATE categories SET name = ?, description = ? WHERE id = ?',
    [name, description, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Không tìm thấy danh mục' });
      }
      res.json({ message: 'Cập nhật danh mục thành công' });
    }
  );
});

// DELETE - Xóa category
router.delete('/categories/:id', (req, res) => {
  const { id } = req.params;
  
  // Kiểm tra xem có sản phẩm nào thuộc category này không
  db.get('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (row.count > 0) {
      return res.status(400).json({ error: 'Không thể xóa danh mục đang có sản phẩm' });
    }
    
    db.run('DELETE FROM categories WHERE id = ?', [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Không tìm thấy danh mục' });
      }
      res.json({ message: 'Xóa danh mục thành công' });
    });
  });
});

module.exports = router;
