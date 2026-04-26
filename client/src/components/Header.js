import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaFish, FaBars, FaTimes, FaUser, FaSearch, FaPhone, FaShoppingCart } from 'react-icons/fa';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [activeCategory, setActiveCategory] = useState('ca-de-nuoi');
  const [products, setProducts] = useState([]);
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();

  // Check if user is logged in
  React.useEffect(() => {
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

    // Check on mount
    checkAuth();
    updateCartCount();

    // Listen for storage changes (when user logs in/out in another tab)
    window.addEventListener('storage', checkAuth);

    // Listen for custom event (when user logs in/out in same tab)
    window.addEventListener('authChange', checkAuth);

    // Listen for cart changes
    window.addEventListener('cartChange', updateCartCount);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('authChange', checkAuth);
      window.removeEventListener('cartChange', updateCartCount);
    };
  }, []);

  // Fetch products for mega menu
  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Lỗi khi tải sản phẩm:', error);
      }
    };
    fetchProducts();
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('authChange'));
    
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
      setShowSearchDropdown(false);
    }
  };

  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim().length > 0) {
      try {
        const response = await fetch(`/api/products?search=${encodeURIComponent(value)}`);
        const data = await response.json();
        console.log('Search results:', data);
        setSearchResults(data.slice(0, 5)); // Chỉ hiển thị 5 kết quả
        setShowSearchDropdown(true);
      } catch (error) {
        console.error('Lỗi tìm kiếm:', error);
      }
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  };

  const handleSelectProduct = (productId) => {
    navigate(`/products/${productId}`);
    setSearchTerm('');
    setShowSearchDropdown(false);
  };

  // Get products by category ID
  const getProductsByCategory = (categoryId) => {
    return products.filter(p => p.category_id === categoryId).slice(0, 12);
  };

  // Render product items for mega menu
  const renderMegaMenuProducts = (categoryId) => {
    const categoryProducts = getProductsByCategory(categoryId);
    return categoryProducts.map(product => (
      <Link key={product.id} to={`/products/${product.id}`} className="product-item-mega">
        <img src={product.image_url || 'https://traicatandung.vn/wp-content/uploads/2025/06/92-300x200.png'} alt={product.name} />
        <span>{product.name}</span>
      </Link>
    ));
  };

  return (
    <header className="header">
      {/* Top Header */}
      <div className="top-header">
        <div className="container">
          <div className="top-header-content">
            <div className="company-logo">
              <img src="/logo.png" alt="Thuỷ sản Tùng Anh" className="logo-img" />
            </div>

            <div className="header-search">
              <form onSubmit={handleSearch} className="search-form">
                <div className="search-wrapper">
                  <input
                    type="text"
                    placeholder="Nhập tên loại cá cần tìm ?"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                    className="search-input"
                  />
                  {showSearchDropdown && searchResults.length > 0 && (
                    <div className="search-dropdown">
                      {searchResults.map(product => (
                        <div
                          key={product.id}
                          className="search-dropdown-item"
                          onClick={() => handleSelectProduct(product.id)}
                        >
                          <img 
                            src={product.image_url || '/logo.png'} 
                            alt={product.name}
                            className="search-item-image"
                          />
                          <div className="search-item-info">
                            <div className="search-item-name">{product.name}</div>
                            <div className="search-item-price">
                              {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND'
                              }).format(product.price)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="header-contact">
              <div className="hotline">
                <FaPhone className="phone-icon" />
                <div className="contact-info">
                  <span className="hotline-label">Hotline</span>
                  <span className="hotline-number">076 999 9295</span>
                </div>
              </div>
              <button className="order-btn">ĐẶT HÀNG NHANH</button>
            </div>

            {/* Mobile Menu Toggle - Only show on mobile */}
            <button className="menu-toggle" onClick={toggleMenu}>
              <FaBars />
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="main-nav">
        <div className="container">
          <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
            {isMenuOpen && (
              <div className="mobile-menu-backdrop" onClick={() => setIsMenuOpen(false)}></div>
            )}
            <ul className="nav-list">
              <li><Link to="/" onClick={() => setIsMenuOpen(false)}>TRANG CHỦ</Link></li>
              
              <li 
                className="nav-item-dropdown"
                onMouseEnter={() => setActiveDropdown('about')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link to="/about" className="nav-link-dropdown">
                  VỀ CHÚNG TÔI
                  <span className="dropdown-icon">▼</span>
                </Link>
                <div className={`dropdown-menu ${activeDropdown === 'about' ? 'active' : ''}`}>
                  <Link to="/about" className="dropdown-item">Giới thiệu</Link>
                  <Link to="/projects" className="dropdown-item">Dự án đã thả</Link>
                  <Link to="/commitment" className="dropdown-item">Cam kết chất lượng giống cá</Link>
                </div>
              </li>
              
              <li 
                className="nav-item-dropdown nav-item-mega"
                onMouseEnter={() => setActiveDropdown('products')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link to="/products" className="nav-link-dropdown">
                  SẢN PHẨM CÁ GIỐNG
                  <span className="dropdown-icon">▼</span>
                </Link>
                <div className={`mega-menu ${activeDropdown === 'products' ? 'active' : ''}`}>
                  <div className="mega-menu-content">
                    <div className="mega-menu-sidebar">
                      <div 
                        className={`mega-menu-category ${activeCategory === 'ca-de-nuoi' ? 'active' : ''}`}
                        onMouseEnter={() => setActiveCategory('ca-de-nuoi')}
                      >
                        Cá Dễ Nuôi
                      </div>
                      <div 
                        className={`mega-menu-category ${activeCategory === 'ca-thuong-pham' ? 'active' : ''}`}
                        onMouseEnter={() => setActiveCategory('ca-thuong-pham')}
                      >
                        Cá Nuôi Thương Phẩm
                      </div>
                      <div 
                        className={`mega-menu-category ${activeCategory === 'ca-dac-san' ? 'active' : ''}`}
                        onMouseEnter={() => setActiveCategory('ca-dac-san')}
                      >
                        Cá Nuôi Đặc Sản
                      </div>
                      <div 
                        className={`mega-menu-category ${activeCategory === 'ca-ket-hop' ? 'active' : ''}`}
                        onMouseEnter={() => setActiveCategory('ca-ket-hop')}
                      >
                        Cá Nuôi Kết Hợp
                      </div>
                      <div 
                        className={`mega-menu-category ${activeCategory === 'ca-canh' ? 'active' : ''}`}
                        onMouseEnter={() => setActiveCategory('ca-canh')}
                      >
                        Cá Nuôi Cảnh
                      </div>
                    </div>
                    <div className="mega-menu-products">
                      <div className="product-grid-mega">
                        {activeCategory === 'ca-de-nuoi' && renderMegaMenuProducts(1)}
                        {activeCategory === 'ca-thuong-pham' && renderMegaMenuProducts(2)}
                        {activeCategory === 'ca-dac-san' && renderMegaMenuProducts(3)}
                        {activeCategory === 'ca-ket-hop' && renderMegaMenuProducts(4)}
                        {activeCategory === 'ca-canh' && renderMegaMenuProducts(5)}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
              <li><Link to="/price" onClick={() => setIsMenuOpen(false)}>BẢNG GIÁ</Link></li>
              <li><Link to="/techniques" onClick={() => setIsMenuOpen(false)}>KỸ THUẬT NUÔI</Link></li>
              <li><Link to="/techniques-list" onClick={() => setIsMenuOpen(false)}>TÀI LIỆU KỸ THUẬT</Link></li>
              
              <li 
                className="nav-item-dropdown"
                onMouseEnter={() => setActiveDropdown('support')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <span className="nav-link-dropdown">
                  HỖ TRỢ
                  <span className="dropdown-icon">▼</span>
                </span>
                <div className={`dropdown-menu ${activeDropdown === 'support' ? 'active' : ''}`}>
                  <Link to="/support/buying-guide" className="dropdown-item">Hướng dẫn kiểm tra cá khi nhận</Link>
                  <Link to="/support/delivery-policy" className="dropdown-item">Chính sách giao hàng</Link>
                  <Link to="/support/warranty-policy" className="dropdown-item">Chính sách bảo hành – đổi trả</Link>
                  <Link to="/support/payment" className="dropdown-item">Thanh toán & hỗ trợ kỹ thuật</Link>
                </div>
              </li>
              
              <li><Link to="/contact" onClick={() => setIsMenuOpen(false)}>LIÊN HỆ</Link></li>
              
              <li 
                className="nav-icon-item nav-item-dropdown"
                onMouseEnter={() => setActiveDropdown('user')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <span className="nav-icon-link" title={user ? user.fullName : 'Tài khoản'}>
                  <FaUser />
                </span>
                <div className={`dropdown-menu ${activeDropdown === 'user' ? 'active' : ''}`}>
                  {user ? (
                    <>
                      <div className="dropdown-item user-info">
                        <strong>{user.fullName}</strong>
                        <small>{user.email}</small>
                      </div>
                      <Link to="/profile" className="dropdown-item">Thông tin tài khoản</Link>
                      <Link to="/orders" className="dropdown-item">Đơn hàng của tôi</Link>
                      <button onClick={handleLogout} className="dropdown-item logout-item">Đăng xuất</button>
                    </>
                  ) : (
                    <>
                      <Link to="/register" className="dropdown-item">Đăng ký</Link>
                      <Link to="/login" className="dropdown-item">Đăng nhập</Link>
                    </>
                  )}
                </div>
              </li>
              
              <li className="nav-icon-item">
                <Link to="/cart" className="nav-icon-link" title="Giỏ hàng">
                  <FaShoppingCart />
                  {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;