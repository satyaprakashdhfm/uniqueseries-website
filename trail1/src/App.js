import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
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
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="App">
            <Navbar />
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
            </Routes>
            <ScrollToTop />
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
