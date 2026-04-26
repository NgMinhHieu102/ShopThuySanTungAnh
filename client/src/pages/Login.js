import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Kiểm tra xem có phải admin login không (nếu nhập username thay vì email)
      const isAdminLogin = !formData.email.includes('@');
      
      let response;
      if (isAdminLogin) {
        // Đăng nhập admin
        response = await axios.post('/api/auth/login', {
          username: formData.email,
          password: formData.password
        });
      } else {
        // Đăng nhập khách hàng
        response = await axios.post('/api/auth/customer/login', formData);
      }
      
      // Lưu token và thông tin user vào localStorage
      if (isAdminLogin && response.data.user.role === 'admin') {
        // Lưu token admin riêng
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminUser', JSON.stringify(response.data.user));
      } else {
        // Lưu token user thông thường
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      // Dispatch custom event to notify Header component
      window.dispatchEvent(new Event('authChange'));
      
      toast.success('Đăng nhập thành công!');
      setLoading(false);
      
      // Chuyển hướng dựa vào role
      setTimeout(() => {
        if (response.data.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/');
        }
      }, 500);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || 'Đăng nhập thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Đăng Nhập</h1>
            <p>Chào mừng bạn trở lại!</p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email hoặc Username</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Nhập email hoặc username"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Mật khẩu</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu"
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">
                Quên mật khẩu?
              </Link>
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
