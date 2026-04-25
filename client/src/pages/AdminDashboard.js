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
  const [topProducts, setTopProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, revenueRes, topProductsRes, recentOrdersRes] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/revenue-by-month'),
        axios.get('/api/admin/top-products'),
        axios.get('/api/admin/recent-orders?limit=5')
      ]);

      setStats(statsRes.data);
      setRevenueData(revenueRes.data);
      setTopProducts(topProductsRes.data);
      setRecentOrders(recentOrdersRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await axios.get('/api/admin/orders');
      setOrders(res.data.orders);
    } catch (error) {
      console.error('Lỗi tải đơn hàng:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await axios.get('/api/admin/products');
      setProducts(res.data.products);
    } catch (error) {
      console.error('Lỗi tải sản phẩm:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await axios.get('/api/admin/customers');
      setCustomers(res.data.customers);
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
      await axios.put(`/api/admin/orders/${orderId}/status`, { status: newStatus });
      alert('Cập nhật trạng thái thành công!');
      loadOrders();
    } catch (error) {
      console.error('Lỗi cập nhật:', error);
      alert('Có lỗi xảy ra!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
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
                <h3>Doanh thu theo tháng</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#4CAF50" name="Doanh thu" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>Số đơn hàng theo tháng</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="orders" fill="#2196F3" name="Đơn hàng" />
                  </BarChart>
                </ResponsiveContainer>
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
                          onClick={() => navigate(`/orders/${order.id}`)}
                        >
                          <FaEye /> Xem
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'products' && (
          <>
            <h1>Quản lý sản phẩm</h1>
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
                        <button className="btn-edit">Sửa</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
