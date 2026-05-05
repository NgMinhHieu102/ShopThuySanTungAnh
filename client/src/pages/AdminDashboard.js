import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  FaShoppingCart, FaUsers, FaBox, FaDollarSign, 
  FaChartLine, FaClipboardList, FaUsersCog, FaCog,
  FaSignOutAlt, FaEye
} from 'react-icons/fa';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [revenueData, setRevenueData] = useState([]);
  const [revenueFilter, setRevenueFilter] = useState('month');
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [topProducts, setTopProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category_id: '',
    price: '',
    size: '',
    description: '',
    image_url: '',
    stock_quantity: '',
    scientific_name: '',
    breeding_model: '',
    economic_value: '',
    key_features: '',
    food: '',
    breeding_time: '',
    difficulty: '',
    suitable_for: '',
    detailed_description: ''
  });
  const [pagination, setPagination] = useState({
    products: { page: 1, totalPages: 1 },
    orders: { page: 1, totalPages: 1 },
    customers: { page: 1, totalPages: 1 }
  });
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);

  // Helper function để tạo config với admin token
  const getAdminConfig = () => {
    const adminToken = localStorage.getItem('adminToken');
    return {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    };
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (revenueFilter) {
      loadRevenueData(revenueFilter);
    }
  }, [revenueFilter]);

  const loadDashboardData = async () => {
    try {
      const config = getAdminConfig();
      const [statsRes, topProductsRes, recentOrdersRes] = await Promise.all([
        axios.get('/api/admin/stats', config),
        axios.get('/api/admin/top-products', config),
        axios.get('/api/admin/recent-orders?limit=5', config)
      ]);

      setStats(statsRes.data);
      setTopProducts(topProductsRes.data);
      setRecentOrders(recentOrdersRes.data);
      
      // Load revenue data separately
      await loadRevenueData(revenueFilter);
      
      setLoading(false);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
      setLoading(false);
    }
  };

  const loadRevenueData = async (period = 'month') => {
    try {
      setRevenueLoading(true);
      const config = getAdminConfig();
      const limit = period === 'day' ? 30 : period === 'month' ? 12 : 5;
      const res = await axios.get(`/api/admin/revenue-by-period?period=${period}&limit=${limit}`, config);
      setRevenueData(res.data);
    } catch (error) {
      console.error('Lỗi tải dữ liệu doanh thu:', error);
    } finally {
      setRevenueLoading(false);
    }
  };

  const handleRevenueFilterChange = (newFilter) => {
    setRevenueFilter(newFilter);
    loadRevenueData(newFilter);
  };

  const loadOrders = async (page = 1) => {
    try {
      const config = getAdminConfig();
      const res = await axios.get(`/api/admin/orders?page=${page}&limit=20`, config);
      setOrders(res.data.orders);
      setPagination(prev => ({
        ...prev,
        orders: { page: res.data.page, totalPages: res.data.totalPages }
      }));
    } catch (error) {
      console.error('Lỗi tải đơn hàng:', error);
    }
  };

  const loadProducts = async (page = 1) => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        axios.get(`/api/admin/products?page=${page}&limit=20`),
        axios.get('/api/admin/categories')
      ]);
      setProducts(productsRes.data.products);
      setCategories(categoriesRes.data);
      setPagination(prev => ({
        ...prev,
        products: { page: productsRes.data.page, totalPages: productsRes.data.totalPages }
      }));
    } catch (error) {
      console.error('Lỗi tải sản phẩm:', error);
    }
  };

  const loadCustomers = async (page = 1) => {
    try {
      const res = await axios.get(`/api/admin/customers?page=${page}&limit=20`);
      setCustomers(res.data.customers);
      setPagination(prev => ({
        ...prev,
        customers: { page: res.data.page, totalPages: res.data.totalPages }
      }));
    } catch (error) {
      console.error('Lỗi tải khách hàng:', error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'orders' && orders.length === 0) loadOrders();
    if (tab === 'products' && products.length === 0) loadProducts();
    if (tab === 'customers' && customers.length === 0) loadCustomers();
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const config = getAdminConfig();
      await axios.put(`/api/admin/orders/${orderId}/status`, { status: newStatus }, config);
      alert('Cập nhật trạng thái thành công!');
      loadOrders();
    } catch (error) {
      console.error('Lỗi cập nhật:', error);
      alert('Có lỗi xảy ra!');
    }
  };

  const handleLogout = () => {
    // Xóa tất cả tokens khi admin đăng xuất
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    
    // Dispatch event để các component khác cập nhật
    window.dispatchEvent(new Event('authChange'));
    window.dispatchEvent(new Event('cartChange'));
    
    // Chuyển về trang chủ thay vì admin login
    navigate('/');
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      category_id: '',
      price: '',
      size: '',
      description: '',
      image_url: '',
      stock_quantity: '',
      scientific_name: '',
      breeding_model: '',
      economic_value: '',
      key_features: '',
      food: '',
      breeding_time: '',
      difficulty: '',
      suitable_for: '',
      detailed_description: ''
    });
    setShowProductModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category_id: product.category_id,
      price: product.price,
      size: product.size || '',
      description: product.description || '',
      image_url: product.image_url || '',
      stock_quantity: product.stock_quantity,
      scientific_name: product.scientific_name || '',
      breeding_model: product.breeding_model || '',
      economic_value: product.economic_value || '',
      key_features: product.key_features || '',
      food: product.food || '',
      breeding_time: product.breeding_time || '',
      difficulty: product.difficulty || '',
      suitable_for: product.suitable_for || '',
      detailed_description: product.detailed_description || ''
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async () => {
    try {
      if (editingProduct) {
        await axios.put(`/api/admin/products/${editingProduct.id}`, {
          ...productForm,
          is_available: 1
        });
        alert('Cập nhật sản phẩm thành công!');
      } else {
        await axios.post('/api/admin/products', productForm);
        alert('Thêm sản phẩm thành công!');
      }
      setShowProductModal(false);
      loadProducts();
    } catch (error) {
      console.error('Lỗi lưu sản phẩm:', error);
      alert('Có lỗi xảy ra!');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    
    try {
      await axios.delete(`/api/admin/products/${id}`);
      alert('Xóa sản phẩm thành công!');
      loadProducts();
    } catch (error) {
      console.error('Lỗi xóa sản phẩm:', error);
      alert('Có lỗi xảy ra!');
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa đơn hàng này?')) return;
    
    try {
      await axios.delete(`/api/admin/orders/${id}`);
      alert('Xóa đơn hàng thành công!');
      loadOrders();
    } catch (error) {
      console.error('Lỗi xóa đơn hàng:', error);
      alert('Có lỗi xảy ra!');
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa khách hàng này?')) return;
    
    try {
      await axios.delete(`/api/admin/customers/${id}`);
      alert('Xóa khách hàng thành công!');
      loadCustomers();
    } catch (error) {
      console.error('Lỗi xóa khách hàng:', error);
      alert(error.response?.data?.error || 'Có lỗi xảy ra!');
    }
  };

  const handleViewOrderDetail = async (order) => {
    try {
      const config = getAdminConfig();
      setSelectedOrder(order);
      // Lấy chi tiết đơn hàng từ admin API
      const res = await axios.get(`/api/admin/orders/${order.id}`, config);
      setOrderItems(res.data.items || []);
      setShowOrderDetailModal(true);
    } catch (error) {
      console.error('Lỗi tải chi tiết đơn hàng:', error);
      alert('Không thể tải chi tiết đơn hàng!');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      confirmed: '#17a2b8',
      shipping: '#007bff',
      delivered: '#28a745',
      cancelled: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      shipping: 'Đang giao',
      delivered: 'Đã giao',
      cancelled: 'Đã hủy'
    };
    return texts[status] || status;
  };

  const getPaymentMethodText = (method) => {
    const texts = {
      cod: 'Tiền mặt',
      payos: 'Chuyển khoản'
    };
    return texts[method] || method;
  };

  const getPaymentStatusText = (status) => {
    const texts = {
      pending: 'Chưa thanh toán',
      paid: 'Đã thanh toán'
    };
    return texts[status] || status;
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      paid: '#28a745'
    };
    return colors[status] || '#6c757d';
  };

  const formatDateLabel = (dateString, period) => {
    if (!dateString) return '';
    
    try {
      switch (period) {
        case 'day':
          return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit'
          });
        case 'month':
          return new Date(dateString + '-01').toLocaleDateString('vi-VN', {
            month: '2-digit',
            year: 'numeric'
          });
        case 'year':
          return dateString;
        default:
          return dateString;
      }
    } catch (error) {
      return dateString;
    }
  };

  const getFilterLabel = (period) => {
    switch (period) {
      case 'day': return 'ngày';
      case 'month': return 'tháng';
      case 'year': return 'năm';
      default: return 'tháng';
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return <div className="admin-loading">Đang tải...</div>;
  }

  return (
    <div className="admin-panel">
      <div className="admin-sidebar">
        <div className="admin-logo">
          <h2>Admin Panel</h2>
        </div>
        <nav className="admin-nav">
          <button 
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => handleTabChange('dashboard')}
          >
            <FaChartLine /> Dashboard
          </button>
          <button 
            className={activeTab === 'orders' ? 'active' : ''}
            onClick={() => handleTabChange('orders')}
          >
            <FaClipboardList /> Đơn hàng
          </button>
          <button 
            className={activeTab === 'products' ? 'active' : ''}
            onClick={() => handleTabChange('products')}
          >
            <FaBox /> Sản phẩm
          </button>
          <button 
            className={activeTab === 'customers' ? 'active' : ''}
            onClick={() => handleTabChange('customers')}
          >
            <FaUsersCog /> Khách hàng
          </button>
          <button onClick={handleLogout} className="logout-btn">
            <FaSignOutAlt /> Đăng xuất
          </button>
        </nav>
      </div>

      <div className="admin-content">
        {activeTab === 'dashboard' && (
          <>
            <h1>Dashboard</h1>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#4CAF50' }}>
                  <FaDollarSign />
                </div>
                <div className="stat-info">
                  <h3>{formatCurrency(stats.totalRevenue)}</h3>
                  <p>Tổng doanh thu</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#2196F3' }}>
                  <FaShoppingCart />
                </div>
                <div className="stat-info">
                  <h3>{stats.totalOrders}</h3>
                  <p>Tổng đơn hàng</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#FF9800' }}>
                  <FaUsers />
                </div>
                <div className="stat-info">
                  <h3>{stats.totalCustomers}</h3>
                  <p>Khách hàng</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#9C27B0' }}>
                  <FaBox />
                </div>
                <div className="stat-info">
                  <h3>{stats.totalProducts}</h3>
                  <p>Sản phẩm</p>
                </div>
              </div>
            </div>

            <div className="charts-grid">
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Doanh thu theo {getFilterLabel(revenueFilter)}</h3>
                  <div className="chart-filter">
                    <select 
                      value={revenueFilter} 
                      onChange={(e) => handleRevenueFilterChange(e.target.value)}
                      className="filter-select"
                      disabled={revenueLoading}
                    >
                      <option value="day">Theo ngày (30 ngày)</option>
                      <option value="month">Theo tháng (12 tháng)</option>
                      <option value="year">Theo năm (5 năm)</option>
                    </select>
                  </div>
                </div>
                {revenueLoading ? (
                  <div className="chart-loading">Đang tải dữ liệu...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey={revenueFilter} 
                        tickFormatter={(value) => formatDateLabel(value, revenueFilter)}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => formatCurrency(value)}
                        labelFormatter={(value) => formatDateLabel(value, revenueFilter)}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#4CAF50" name="Doanh thu" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>Số đơn hàng theo {getFilterLabel(revenueFilter)}</h3>
                </div>
                {revenueLoading ? (
                  <div className="chart-loading">Đang tải dữ liệu...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey={revenueFilter} 
                        tickFormatter={(value) => formatDateLabel(value, revenueFilter)}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => formatDateLabel(value, revenueFilter)}
                      />
                      <Legend />
                      <Bar dataKey="orders" fill="#2196F3" name="Đơn hàng" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="dashboard-tables">
              <div className="table-card">
                <h3>Top sản phẩm bán chạy</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Đã bán</th>
                      <th>Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map(product => (
                      <tr key={product.id}>
                        <td>
                          <div className="product-cell">
                            <img src={product.image_url} alt={product.name} />
                            <span>{product.name}</span>
                          </div>
                        </td>
                        <td>{product.total_sold}</td>
                        <td>{formatCurrency(product.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="table-card">
                <h3>Đơn hàng gần đây</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Mã ĐH</th>
                      <th>Khách hàng</th>
                      <th>Tổng tiền</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(order => (
                      <tr key={order.id}>
                        <td>#{order.id}</td>
                        <td>{order.customer_name}</td>
                        <td>{formatCurrency(order.total_amount)}</td>
                        <td>
                          <span 
                            className="status-badge" 
                            style={{ background: getStatusColor(order.status) }}
                          >
                            {getStatusText(order.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'orders' && (
          <>
            <h1>Quản lý đơn hàng</h1>
            <div className="table-card full-width">
              <table>
                <thead>
                  <tr>
                    <th>Mã ĐH</th>
                    <th>Khách hàng</th>
                    <th>SĐT</th>
                    <th>Tổng tiền</th>
                    <th>Phương thức TT</th>
                    <th>TT Thanh toán</th>
                    <th>Trạng thái</th>
                    <th>Ngày đặt</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{order.customer_name}</td>
                      <td>{order.customer_phone}</td>
                      <td>{formatCurrency(order.total_amount)}</td>
                      <td>
                        <span className={`payment-method-badge ${order.payment_method}`}>
                          {getPaymentMethodText(order.payment_method)}
                        </span>
                      </td>
                      <td>
                        <span 
                          className="status-badge" 
                          style={{ background: getPaymentStatusColor(order.payment_status) }}
                        >
                          {getPaymentStatusText(order.payment_status)}
                        </span>
                      </td>
                      <td>
                        <select 
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          style={{ background: getStatusColor(order.status), color: 'white' }}
                        >
                          <option value="pending">Chờ xác nhận</option>
                          <option value="confirmed">Đã xác nhận</option>
                          <option value="shipping">Đang giao</option>
                          <option value="delivered">Đã giao</option>
                          <option value="cancelled">Đã hủy</option>
                        </select>
                      </td>
                      <td>{formatDate(order.created_at)}</td>
                      <td>
                        <button 
                          className="btn-view"
                          onClick={() => handleViewOrderDetail(order)}
                        >
                          <FaEye /> Xem
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteOrder(order.id)}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Phân trang đơn hàng */}
            {pagination.orders.totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => loadOrders(pagination.orders.page - 1)}
                  disabled={pagination.orders.page === 1}
                >
                  « Trước
                </button>
                <span>Trang {pagination.orders.page} / {pagination.orders.totalPages}</span>
                <button 
                  onClick={() => loadOrders(pagination.orders.page + 1)}
                  disabled={pagination.orders.page === pagination.orders.totalPages}
                >
                  Sau »
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === 'products' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h1>Quản lý sản phẩm</h1>
              <button className="btn-add" onClick={handleAddProduct}>+ Thêm sản phẩm</button>
            </div>
            <div className="table-card full-width">
              <table>
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Danh mục</th>
                    <th>Giá</th>
                    <th>Tồn kho</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id}>
                      <td>
                        <div className="product-cell">
                          <img src={product.image_url} alt={product.name} />
                          <span>{product.name}</span>
                        </div>
                      </td>
                      <td>{product.category_name}</td>
                      <td>{formatCurrency(product.price)}</td>
                      <td>{product.stock_quantity}</td>
                      <td>
                        <span className={`status-badge ${product.is_available ? 'active' : 'inactive'}`}>
                          {product.is_available ? 'Còn hàng' : 'Hết hàng'}
                        </span>
                      </td>
                      <td>
                        <button className="btn-edit" onClick={() => handleEditProduct(product)}>Sửa</button>
                        <button className="btn-delete" onClick={() => handleDeleteProduct(product.id)}>Xóa</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Phân trang sản phẩm */}
            {pagination.products.totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => loadProducts(pagination.products.page - 1)}
                  disabled={pagination.products.page === 1}
                >
                  « Trước
                </button>
                <span>Trang {pagination.products.page} / {pagination.products.totalPages}</span>
                <button 
                  onClick={() => loadProducts(pagination.products.page + 1)}
                  disabled={pagination.products.page === pagination.products.totalPages}
                >
                  Sau »
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === 'customers' && (
          <>
            <h1>Quản lý khách hàng</h1>
            <div className="table-card full-width">
              <table>
                <thead>
                  <tr>
                    <th>Tên</th>
                    <th>Email</th>
                    <th>SĐT</th>
                    <th>Tổng đơn</th>
                    <th>Tổng chi tiêu</th>
                    <th>Ngày đăng ký</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(customer => (
                    <tr key={customer.id}>
                      <td>{customer.full_name}</td>
                      <td>{customer.email}</td>
                      <td>{customer.phone}</td>
                      <td>{customer.total_orders}</td>
                      <td>{formatCurrency(customer.total_spent || 0)}</td>
                      <td>{formatDate(customer.created_at)}</td>
                      <td>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteCustomer(customer.id)}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Phân trang khách hàng */}
            {pagination.customers.totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => loadCustomers(pagination.customers.page - 1)}
                  disabled={pagination.customers.page === 1}
                >
                  « Trước
                </button>
                <span>Trang {pagination.customers.page} / {pagination.customers.totalPages}</span>
                <button 
                  onClick={() => loadCustomers(pagination.customers.page + 1)}
                  disabled={pagination.customers.page === pagination.customers.totalPages}
                >
                  Sau »
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal thêm/sửa sản phẩm */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
            <div className="modal-form">
              <div className="form-group">
                <label>Tên sản phẩm</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  placeholder="Nhập tên sản phẩm"
                />
              </div>
              <div className="form-group">
                <label>Danh mục</label>
                <select
                  value={productForm.category_id}
                  onChange={(e) => setProductForm({...productForm, category_id: e.target.value})}
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Giá (đồng)</label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                    placeholder="500"
                  />
                </div>
                <div className="form-group">
                  <label>Kích thước</label>
                  <input
                    type="text"
                    value={productForm.size}
                    onChange={(e) => setProductForm({...productForm, size: e.target.value})}
                    placeholder="3-5cm"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Số lượng tồn kho</label>
                <input
                  type="number"
                  value={productForm.stock_quantity}
                  onChange={(e) => setProductForm({...productForm, stock_quantity: e.target.value})}
                  placeholder="1000"
                />
              </div>
              <div className="form-group">
                <label>URL hình ảnh</label>
                <input
                  type="text"
                  value={productForm.image_url}
                  onChange={(e) => setProductForm({...productForm, image_url: e.target.value})}
                  placeholder="https://..."
                />
              </div>
              <div className="form-group">
                <label>Mô tả ngắn</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  placeholder="Nhập mô tả ngắn"
                  rows="2"
                />
              </div>
              
              <h3 style={{ marginTop: '20px', marginBottom: '10px', color: '#2c3e50' }}>Thông tin chi tiết</h3>
              
              <div className="form-group">
                <label>Tên khoa học</label>
                <input
                  type="text"
                  value={productForm.scientific_name}
                  onChange={(e) => setProductForm({...productForm, scientific_name: e.target.value})}
                  placeholder="Ví dụ: Hypophthalmichthys nobilis"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Mô hình nuôi</label>
                  <input
                    type="text"
                    value={productForm.breeding_model}
                    onChange={(e) => setProductForm({...productForm, breeding_model: e.target.value})}
                    placeholder="Ao đất, bè nổi..."
                  />
                </div>
                <div className="form-group">
                  <label>Độ khó</label>
                  <select
                    value={productForm.difficulty}
                    onChange={(e) => setProductForm({...productForm, difficulty: e.target.value})}
                  >
                    <option value="">Chọn độ khó</option>
                    <option value="Dễ">Dễ</option>
                    <option value="Trung bình">Trung bình</option>
                    <option value="Khó">Khó</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Giá trị kinh tế</label>
                <input
                  type="text"
                  value={productForm.economic_value}
                  onChange={(e) => setProductForm({...productForm, economic_value: e.target.value})}
                  placeholder="Cao, trung bình, thấp"
                />
              </div>
              
              <div className="form-group">
                <label>Đặc điểm nổi bật</label>
                <textarea
                  value={productForm.key_features}
                  onChange={(e) => setProductForm({...productForm, key_features: e.target.value})}
                  placeholder="Các đặc điểm nổi bật của cá"
                  rows="2"
                />
              </div>
              
              <div className="form-group">
                <label>Thức ăn</label>
                <input
                  type="text"
                  value={productForm.food}
                  onChange={(e) => setProductForm({...productForm, food: e.target.value})}
                  placeholder="Thức ăn công nghiệp, tự nhiên..."
                />
              </div>
              
              <div className="form-group">
                <label>Thời gian nuôi</label>
                <input
                  type="text"
                  value={productForm.breeding_time}
                  onChange={(e) => setProductForm({...productForm, breeding_time: e.target.value})}
                  placeholder="6-8 tháng"
                />
              </div>
              
              <div className="form-group">
                <label>Phù hợp với</label>
                <input
                  type="text"
                  value={productForm.suitable_for}
                  onChange={(e) => setProductForm({...productForm, suitable_for: e.target.value})}
                  placeholder="Người mới bắt đầu, chuyên nghiệp..."
                />
              </div>
              
              <div className="form-group">
                <label>Mô tả chi tiết</label>
                <textarea
                  value={productForm.detailed_description}
                  onChange={(e) => setProductForm({...productForm, detailed_description: e.target.value})}
                  placeholder="Mô tả chi tiết về sản phẩm"
                  rows="4"
                />
              </div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowProductModal(false)}>Hủy</button>
                <button className="btn-save" onClick={handleSaveProduct}>Lưu</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal chi tiết đơn hàng */}
      {showOrderDetailModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowOrderDetailModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <h2>Chi tiết đơn hàng #{selectedOrder.id}</h2>
            
            <div className="order-detail-grid">
              <div className="order-info-section">
                <h3>Thông tin khách hàng</h3>
                <p><strong>Tên:</strong> {selectedOrder.customer_name}</p>
                <p><strong>Email:</strong> {selectedOrder.customer_email}</p>
                <p><strong>SĐT:</strong> {selectedOrder.customer_phone || selectedOrder.phone}</p>
                <p><strong>Địa chỉ:</strong> {selectedOrder.shipping_address}</p>
              </div>
              
              <div className="order-info-section">
                <h3>Thông tin đơn hàng</h3>
                <p><strong>Ngày đặt:</strong> {formatDate(selectedOrder.created_at)}</p>
                <p><strong>Phương thức thanh toán:</strong> 
                  <span 
                    className={`payment-method-badge ${selectedOrder.payment_method}`}
                    style={{ marginLeft: '10px' }}
                  >
                    {getPaymentMethodText(selectedOrder.payment_method)}
                  </span>
                </p>
                <p><strong>Trạng thái thanh toán:</strong> 
                  <span 
                    className="status-badge" 
                    style={{ background: getPaymentStatusColor(selectedOrder.payment_status), marginLeft: '10px' }}
                  >
                    {getPaymentStatusText(selectedOrder.payment_status)}
                  </span>
                </p>
                <p><strong>Trạng thái đơn hàng:</strong> 
                  <span 
                    className="status-badge" 
                    style={{ background: getStatusColor(selectedOrder.status), marginLeft: '10px' }}
                  >
                    {getStatusText(selectedOrder.status)}
                  </span>
                </p>
                <p><strong>Tổng tiền:</strong> <span style={{ color: '#28a745', fontSize: '18px', fontWeight: 'bold' }}>{formatCurrency(selectedOrder.total_amount)}</span></p>
                {selectedOrder.notes && <p><strong>Ghi chú:</strong> {selectedOrder.notes}</p>}
              </div>
            </div>
            
            <h3 style={{ marginTop: '20px' }}>Sản phẩm đã đặt</h3>
            <table className="order-items-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Đơn giá</th>
                  <th>Số lượng</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item, index) => (
                  <tr key={index}>
                    <td>{item.product_name}</td>
                    <td>{formatCurrency(item.price)}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowOrderDetailModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
