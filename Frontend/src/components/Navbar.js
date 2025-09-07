import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [hideNav, setHideNav] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuth();
  const { getCartItemsCount } = useCart();

  // Prevent background scroll when mobile nav is open
  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  React.useEffect(() => {
    let lastScroll = window.scrollY;
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      // Only hide navbar on desktop, keep it fixed on mobile
      if (window.innerWidth > 768) {
        if (currentScroll > lastScroll && currentScroll > 60) {
          setHideNav(true);
        } else {
          setHideNav(false);
        }
      } else {
        // Always show navbar on mobile
        setHideNav(false);
      }
      lastScroll = currentScroll;
      setIsProductsOpen(false); // Also close dropdown on scroll
    };

    const handleResize = () => {
      // Reset navbar visibility on resize
      if (window.innerWidth <= 768) {
        setHideNav(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const productCategories = [
    { name: 'Currency Notes', path: '/products/currency-notes', icon: '/assets/Currency_notes/1.jpg' },
    { name: 'Framed Notes', path: '/products/framed-notes', icon: '/assets/frames/small.jpeg' },
    { name: 'Resin Frames', path: '/products/resin-frames', icon: '/assets/resin_frames/resin-small.jpg' },
    { name: 'Zodiac Coins', path: '/products/zodiac-coins', icon: '/assets/Zodiac/zodiac_coin.jpg' }
  ];

  return (
    <nav className={`navbar${hideNav ? ' hide' : ''}`}>
      <div className="container">
        <div className="nav-content">
          <Link to="/" className="nav-logo">
            <img src="/assets/website_images/logo.png" alt="uniqueseries logo" style={{height: '48px', width: 'auto', display: 'block'}} />
          </Link>

          {/* Mobile actions - only cart when logged in */}
          <div className="mobile-persistent-actions">
            {isLoggedIn && (
              <Link to="/cart" className="cart-link mobile-cart">
                <div className="cart-icon" style={{fontSize: '1.4rem', lineHeight: 1}}>
                  🛍️
                  {getCartItemsCount() > 0 && (
                    <span className="cart-count">{getCartItemsCount()}</span>
                  )}
                </div>
              </Link>
            )}
          </div>
          
          {/* Hamburger for mobile */}
          <button
            className={`hamburger${mobileMenuOpen ? ' open' : ''}`}
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>

          {/* Desktop nav links */}
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <div className="products-dropdown">
              <span
                className="nav-link products-trigger"
                onClick={() => setIsProductsOpen((prev) => !prev)}
                tabIndex={0}
                aria-haspopup="true"
                aria-expanded={isProductsOpen}
                role="button"
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                Products
                <span className={`chevron${isProductsOpen ? ' open' : ''}`} style={{ display: 'inline-block', transition: 'transform 0.3s', transform: isProductsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 8L10 12L14 8" stroke="#555" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </span>
              {isProductsOpen && (
                <div 
                  className="dropdown-menu"
                  onClick={() => setIsProductsOpen(false)}
                >
                  {productCategories.map((category, index) => (
                    <Link
                      key={index}
                      to={category.path}
                      className="dropdown-item"
                      onClick={() => setIsProductsOpen(false)}
                    >
                      <img
                        className="dropdown-icon"
                        src={category.icon}
                        alt={category.name + ' icon'}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        style={{width: '28px', height: '28px', marginRight: '0.5rem', borderRadius: '5px', objectFit: 'cover'}}
                      />
                      <span>{category.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link to="/about" className="nav-link">About</Link>
            <Link to="/contact" className="nav-link">Contact</Link>
          </div>

          {/* Desktop nav actions */}
          <div className="nav-actions">
            {isLoggedIn ? (
              <>
                <Link to="/account" className="desktop-auth-link" title="Account" aria-label="Account">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="auth-icon">
                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" fill="#ffffff" />
                    <path d="M12 13C8.13401 13 5 16.134 5 20V21H19V20C19 16.134 15.866 13 12 13Z" fill="#ffffff" />
                  </svg>
                </Link>
                <button onClick={handleLogout} className="nav-link logout-btn">
                  Logout
                </button>
                <Link to="/cart" className="cart-link">
                  <div className="cart-icon" style={{fontSize: '1.5rem', lineHeight: 1}}>
                    🛍️
                    {getCartItemsCount() > 0 && (
                      <span className="cart-count">{getCartItemsCount()}</span>
                    )}
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-btn">Login</Link>
                <Link to="/signup" className="nav-btn">Signup</Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile nav overlay */}
        <div
          id="mobile-nav-menu"
          className={`mobile-nav-overlay${mobileMenuOpen ? ' open' : ''}`}
          aria-hidden={!mobileMenuOpen}
          onClick={e => {
            if (e.target.classList.contains('mobile-nav-overlay')) setMobileMenuOpen(false);
          }}
        >
          <button
            className="mobile-nav-close"
            aria-label="Close navigation menu"
            onClick={() => setMobileMenuOpen(false)}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="16" fill="rgba(196,181,253,0.18)" />
              <path d="M10 10L22 22M22 10L10 22" stroke="#d63384" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="mobile-nav-links">
            <Link to="/" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <div className="products-dropdown">
              <span
                className="nav-link products-trigger"
                onClick={() => setIsProductsOpen((prev) => !prev)}
                tabIndex={0}
                aria-haspopup="true"
                aria-expanded={isProductsOpen}
                role="button"
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                Products
                <span className={`chevron${isProductsOpen ? ' open' : ''}`} style={{ display: 'inline-block', transition: 'transform 0.3s', transform: isProductsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 8L10 12L14 8" stroke="#555" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </span>
              {isProductsOpen && (
                <div className="dropdown-menu">
                  {productCategories.map((category, index) => (
                    <Link
                      key={index}
                      to={category.path}
                      className="dropdown-item"
                      onClick={() => {
                        setIsProductsOpen(false);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <img
                        className="dropdown-icon"
                        src={category.icon}
                        alt={category.name + ' icon'}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        style={{width: '28px', height: '28px', marginRight: '0.5rem', borderRadius: '5px', objectFit: 'cover'}}
                      />
                      <span>{category.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link to="/about" className="nav-link" onClick={() => setMobileMenuOpen(false)}>About</Link>
            <Link to="/contact" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
            <div className="nav-actions-mobile">
              {isLoggedIn ? (
                <>
                  <Link to="/account" className="nav-link mobile-account-link" onClick={() => setMobileMenuOpen(false)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '0.5rem'}}>
                      <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" fill="#2c3e50" />
                      <path d="M12 13C8.13401 13 5 16.134 5 20V21H19V20C19 16.134 15.866 13 12 13Z" fill="#2c3e50" />
                    </svg>
                    Account
                  </Link>
                  <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="nav-link logout-btn">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="nav-link mobile-login-link" onClick={() => setMobileMenuOpen(false)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '0.5rem'}}>
                      <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" fill="#2c3e50" />
                      <path d="M12 13C8.13401 13 5 16.134 5 20V21H19V20C19 16.134 15.866 13 12 13Z" fill="#2c3e50" />
                    </svg>
                    Login
                  </Link>
                  <Link to="/signup" className="nav-link mobile-signup-link" onClick={() => setMobileMenuOpen(false)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '0.5rem'}}>
                      <path d="M12 2C13.1046 2 14 2.89543 14 4V10C14 11.1046 13.1046 12 12 12C10.8954 12 10 11.1046 10 10V4C10 2.89543 10.8954 2 12 2Z" fill="#2c3e50"/>
                      <path d="M12 14C8.13401 14 5 17.134 5 21V22H19V21C19 17.134 15.866 14 12 14Z" fill="#2c3e50"/>
                      <path d="M16 8H20V10H16V8Z" fill="#2c3e50"/>
                      <path d="M18 6V12H20V6H18Z" fill="#2c3e50"/>
                    </svg>
                    Signup
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
