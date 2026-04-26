import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Header from './components/Header';
import MobileHeader from './components/MobileHeader';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Commitment from './pages/Commitment';
import PriceList from './pages/PriceList';
import TechniquesList from './pages/TechniquesList';
import TechniquesOnly from './pages/TechniquesOnly';
import Techniques from './pages/Techniques';
import BuyingGuide from './pages/BuyingGuide';
import DeliveryPolicy from './pages/DeliveryPolicy';
import WarrantyPolicy from './pages/WarrantyPolicy';
import PaymentSupport from './pages/PaymentSupport';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';

import './App.css';
import './responsive.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Admin routes - không có Header/Footer */}
          <Route 
            path="/admin/dashboard" 
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            } 
          />
          
          {/* Public routes - có Header/Footer */}
          <Route path="/*" element={
            <>
              <Header />
              <MobileHeader />
              <Routes>
                <Route path="/" element={
                  <main className="main-content home-content">
                    <Home />
                  </main>
                } />
                <Route path="/*" element={
                  <main className="main-content">
                    <Routes>
                      <Route path="/products" element={<Products />} />
                      <Route path="/products/:id" element={<ProductDetail />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/projects" element={<Projects />} />
                      <Route path="/projects/:id" element={<ProjectDetail />} />
                      <Route path="/commitment" element={<Commitment />} />
                      <Route path="/price" element={<PriceList />} />
                      <Route path="/techniques" element={<TechniquesOnly />} />
                      <Route path="/techniques-list" element={<TechniquesList />} />
                      <Route path="/techniques/:id" element={<Techniques />} />
                      <Route path="/support/buying-guide" element={<BuyingGuide />} />
                      <Route path="/support/delivery-policy" element={<DeliveryPolicy />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/orders" element={<Orders />} />
                      <Route path="/orders/:id" element={<OrderDetail />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/payment/success" element={<PaymentSuccess />} />
                      <Route path="/payment/cancel" element={<PaymentCancel />} />
                      <Route path="/support/warranty-policy" element={<WarrantyPolicy />} />
                      <Route path="/support/payment" element={<PaymentSupport />} />
                    </Routes>
                  </main>
                } />
              </Routes>
              <Footer />
              <Chatbot />
            </>
          } />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </Router>
  );
}

export default App;