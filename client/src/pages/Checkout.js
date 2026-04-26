import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaUser, FaPhone, FaMapMarkerAlt, FaMoneyBillWave } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Checkout.css';

const Checkout = () => {
  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    notes: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' or 'payos'
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      toast.error('Vui lòng đăng nhập để đặt hàng');
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    
    // Pre-fill form with user data
    setFormData({
      fullName: parsedUser.fullName || '',
      phone: parsedUser.phone || '',
      address: parsedUser.address || '',
      notes: ''
    });

    // Load cart
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (cart.length === 0) {
      toast.error('Giỏ hàng trống');
      navigate('/cart');
      return;
    }
    setCartItems(cart);
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.phone || !formData.address) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Prepare order data
      const orderData = {
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        shipping_address: formData.address,
        phone: formData.phone,
        notes: formData.notes,
        payment_method: paymentMethod
      };

      // Tạo đơn hàng
      const response = await axios.post('/api/orders', orderData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const orderId = response.data.orderId;

      // Nếu chọn thanh toán PayOS
      if (paymentMethod === 'payos') {
        try {
          const paymentResponse = await axios.post('/api/payment/create-payment-link', {
            orderId: orderId,
            amount: calculateTotal(),
            description: `Thanh toán đơn hàng #${orderId} - ${formData.fullName}`,
            returnUrl: `${window.location.origin}/payment/success?orderId=${orderId}`,
            cancelUrl: `${window.location.origin}/payment/cancel?orderId=${orderId}`
          }, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          // Chuyển đến trang thanh toán PayOS
          window.location.href = paymentResponse.data.checkoutUrl;
          return;
        } catch (paymentError) {
          console.error('Lỗi tạo link thanh toán:', paymentError);
          toast.error('Không thể tạo link thanh toán. Vui lòng thử lại.');
          setLoading(false);
          return;
        }
      }

      // Thanh toán COD - xóa giỏ hàng và chuyển đến trang đơn hàng
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartChange'));

      toast.success('Đặt hàng thành công! Chúng tôi sẽ liên hệ với bạn sớm.');
      setLoading(false);
      
      setTimeout(() => {
        navigate('/orders');
      }, 1500);
    } catch (err) {
      setLoading(false);
      toast.error(err.response?.data?.error || 'Đặt hàng thất bại. Vui lòng thử lại.');
    }
  };

  if (!user || cartItems.length === 0) {
    return <div className="checkout-loading">Đang tải...</div>;
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-header">
          <h1>Thanh Toán</h1>
          <p>Vui lòng kiểm tra thông tin đơn hàng</p>
        </div>

        <div className="checkout-content">
          <div className="checkout-form-section">
            <div className="section-card">
              <h2>
                <FaUser /> Thông tin người nhận
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Họ và tên *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Nhập họ và tên"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Số điện thoại *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Địa chỉ giao hàng *</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Nhập địa chỉ chi tiết"
                    rows="3"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Ghi chú đơn hàng</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Ghi chú về đơn hàng (tùy chọn)"
                    rows="3"
                  />
                </div>
              </form>
            </div>

            <div className="section-card">
              <h2>
                <FaMoneyBillWave /> Phương thức thanh toán
              </h2>
              <div className="payment-method">
                <label className="payment-option">
                  <input 
                    type="radio" 
                    name="payment" 
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-info">
                    <strong>Thanh toán khi nhận hàng (COD)</strong>
                    <p>Thanh toán bằng tiền mặt khi nhận hàng</p>
                  </div>
                </label>

                <label className="payment-option">
                  <input 
                    type="radio" 
                    name="payment" 
                    value="payos"
                    checked={paymentMethod === 'payos'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-info">
                    <strong>Thanh toán online qua PayOS</strong>
                    <p>Thanh toán qua QR Code, Ví điện tử, Thẻ ATM</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="checkout-summary">
            <div className="summary-card">
              <h2>
                <FaShoppingCart /> Đơn hàng của bạn
              </h2>

              <div className="summary-items">
                {cartItems.map(item => (
                  <div key={item.id} className="summary-item">
                    <img 
                      src={item.image_url || '/logo.png'} 
                      alt={item.name}
                      className="summary-item-image"
                    />
                    <div className="summary-item-info">
                      <h4>{item.name}</h4>
                      <p>Số lượng: {item.quantity}</p>
                    </div>
                    <div className="summary-item-price">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="summary-divider"></div>

              <div className="summary-row">
                <span>Tạm tính:</span>
                <strong>{formatPrice(calculateTotal())}</strong>
              </div>

              <div className="summary-row">
                <span>Phí vận chuyển:</span>
                <strong>Liên hệ</strong>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-total">
                <span>Tổng cộng:</span>
                <strong>{formatPrice(calculateTotal())}</strong>
              </div>

              <button 
                onClick={handleSubmit}
                className="btn-place-order"
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : 'Đặt hàng'}
              </button>

              <div className="checkout-note">
                <p>☎ Hotline: <strong>076 999 9295</strong></p>
                <p>✓ Cam kết cá giống chất lượng cao</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
