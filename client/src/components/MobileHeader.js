import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaUser, FaShoppingCart, FaSignInAlt, FaUserPlus, FaSignOutAlt } from 'react-icons/fa';
import './MobileHeader.css';

const MobileHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      if (token && userData) {
        setUser(JSON.parse(userData));
      } else {
        setUser(null);
      }
    };

    // Update cart count
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(totalItems);
    };

    checkAuth();
    updateCartCount();

    // Listen for auth changes
    window.addEventListener('authChange', checkAuth);
    window.addEventListener('cartChange', updateCartCount);

    return () => {
      window.removeEventListener('authChange', checkAuth);
      window.removeEventListener('cartChange', updateCartCount);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsMenuOpen(false);
    window.dispatchEvent(new Event('authChange'));
    navigate('/');
  };

  return (
    <div className="mobile-header">
      {/* Mobile Header Bar */}
      <div className="mobile-header-bar">
        <Link to="/" className="mobile-logo">
          <img src="/logo.png" alt="Thuỷ sản Tùng Anh" />
        </Link>
        
        <div className="mobile-header-actions">
          <Link to="/cart" className="mobile-cart-btn">
            <FaShoppingCart />
            {cartCount > 0 && <span className="mobile-cart-badge">{cartCount}</span>}
          </Link>
          <button className="mobile-menu-btn" onClick={toggleMenu}>
            <FaBars />
            <span>MENU</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <>
          <div className="mobile-menu-backdrop" onClick={() => setIsMenuOpen(false)}></div>
          <div className="mobile-menu">
            <div className="mobile-menu-header">
              <span>MENU</span>
              <button onClick={() => setIsMenuOpen(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="mobile-menu-content">
              {/* User Section */}
              {user ? (
                <div className="mobile-user-section">
                  <div className="mobile-user-info">
                    <FaUser />
                    <div>
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </div>
                  </div>
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="mobile-menu-link">
                    <FaUser /> Tài khoản của tôi
                  </Link>
                  <Link to="/orders" onClick={() => setIsMenuOpen(false)} className="mobile-menu-link">
                    <FaShoppingCart /> Đơn hàng của tôi
                  </Link>
                  <button onClick={handleLogout} className="mobile-menu-link mobile-logout-btn">
                    <FaSignOutAlt /> Đăng xuất
                  </button>
                </div>
              ) : (
                <div className="mobile-auth-section">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="mobile-auth-btn login">
                    <FaSignInAlt /> Đăng nhập
                  </Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)} className="mobile-auth-btn register">
                    <FaUserPlus /> Đăng ký
                  </Link>
                </div>
              )}

              {/* Divider */}
              <div className="mobile-menu-divider"></div>

              {/* Navigation Links */}
              <Link to="/" onClick={() => setIsMenuOpen(false)}>Trang chủ</Link>
              <Link to="/about" onClick={() => setIsMenuOpen(false)}>Về chúng tôi</Link>
              <Link to="/products" onClick={() => setIsMenuOpen(false)}>Sản phẩm cá giống</Link>
              <Link to="/price" onClick={() => setIsMenuOpen(false)}>Bảng giá</Link>
              <Link to="/techniques" onClick={() => setIsMenuOpen(false)}>Kỹ thuật nuôi</Link>
              <Link to="/contact" onClick={() => setIsMenuOpen(false)}>Liên hệ</Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MobileHeader;