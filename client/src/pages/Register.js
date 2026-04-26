import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);

    try {
      await axios.post('/api/auth/register', {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });
      
      setLoading(false);
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      
      // Chuyển đến trang đăng nhập sau 1 giây
      setTimeout(() => {
        navigate('/login');
      }, 1000);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || 'Đăng ký thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container auth-container-wide">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Đăng Ký</h1>
            <p>Tạo tài khoản mới để bắt đầu</p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form register-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fullName">Họ và tên</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Nhập họ và tên"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Nhập email của bạn"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Số điện thoại</label>
                <div className="input-wrapper">
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại"
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
                    placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
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
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
              <div className="input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Nhập lại mật khẩu"
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" required />
                <span>Tôi đồng ý với <Link to="/terms">Điều khoản dịch vụ</Link></span>
              </label>
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Đang đăng ký...' : 'Đăng Ký'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
