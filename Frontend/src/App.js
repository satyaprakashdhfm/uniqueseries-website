import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Cart from './pages/Cart';
import Payment from './pages/Payment';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Account from './pages/Account';
import CurrencyNotes from './pages/products/CurrencyNotes';
import FramedNotes from './pages/products/FramedNotes';
import ResinFrames from './pages/products/ResinFrames';
import ZodiacCoins from './pages/products/ZodiacCoins';
import AdminRequireGuard from './pages/admin/AdminRequire';
import Terms from './pages/Terms';
import PrivacyPolicy from './pages/PrivacyPolicy';
import RefundPolicy from './pages/RefundPolicy';
import ShippingPolicy from './pages/ShippingPolicy';
import AdminLoginPage from './pages/admin/AdminLogin';
import AdminSignupPage from './pages/admin/AdminSignup';
import AdminDashboardPage from './pages/admin/AdminDashboard';
import './App.css';

function App() {
  const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="App">
            {!isAdminRoute && <Navbar />}
            <div className="content-wrapper">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products/currency-notes" element={<CurrencyNotes />} />
                <Route path="/products/framed-notes" element={<FramedNotes />} />
                <Route path="/products/resin-frames" element={<ResinFrames />} />
                <Route path="/products/zodiac-coins" element={<ZodiacCoins />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/account" element={<Account />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/refund-policy" element={<RefundPolicy />} />
                <Route path="/shipping-policy" element={<ShippingPolicy />} />
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/admin/signup" element={<AdminSignupPage />} />
                <Route path="/admin" element={<AdminRequireGuard><AdminDashboardPage /></AdminRequireGuard>} />
              </Routes>
            </div>
            {!isAdminRoute && <ScrollToTop />}
            {!isAdminRoute && <Footer />}
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
