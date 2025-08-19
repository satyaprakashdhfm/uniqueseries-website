import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const products = [
    {
      id: 1,
      title: 'Currency Notes',
      shortDescription: 'Special serial number notes for gifting',
      fullDescription: 'Discover currency notes with special serial numbers matching birthdays, anniversaries, or lucky numbers. Perfect for creating meaningful gifts that tell a unique story.',
      features: ['All Indian denominations (₹1 to ₹500)', 'Special date serial numbers', 'Authenticated & genuine', 'Perfect gift for special occasions'],
      link: '/products/currency-notes',
      image: '/assets/Currency_notes/1.jpg', // Use image instead of icon
      bgColor: '#c8b5d6'
    },
    {
      id: 2,
      title: 'Framed Notes',
      shortDescription: 'Beautiful frames with currency notes',
      fullDescription: 'Premium quality frames showcasing your special currency notes in elegant wooden, gold, silver, or vintage styles. Available in small (6x8") and large (8x10") sizes to suit any space.',
      features: ['Multiple frame styles available', 'Small & large size options', 'Premium quality materials', 'Perfect for home & office display'],
      link: '/products/framed-notes',
      image: '/assets/frames/selected1.jpeg',
      bgColor: '#c8b5d6'
    },
    {
      id: 3,
      title: 'Resin Frames',
      shortDescription: 'Premium resin frames for display',
      fullDescription: 'Modern resin frames offering crystal-clear visibility and contemporary aesthetics. Available in various tints and effects including clear, blue, rose gold, and marble patterns.',
      features: ['Crystal clear visibility', 'Modern contemporary design', 'Multiple color options', 'Excellent protection & durability'],
      link: '/products/resin-frames',
      image: '/assets/resin_frames/resin-big.jpg',
      imageClass: 'product-image-resin',
      bgColor: '#c8b5d6'
    },
    {
      id: 4,
      title: 'Zodiac Coins',
      shortDescription: 'Coins with zodiac signs and stamps',
      fullDescription: 'Collectible coins featuring all 12 zodiac signs. Perfect for astrology enthusiasts and those who believe in the power of zodiac signs.',
      features: ['All 12 zodiac signs available', 'Authentic symbols & dates', 'Premium quality coins', 'Perfect for astrology lovers'],
      link: '/products/zodiac-coins',
      image: '/assets/Zodiac/zodiac_coin.jpg',
      imageClass: 'product-image-zodiac',
      bgColor: '#c8b5d6'
    }
  ];

  return (
    <div className="home">
      <div className="container">
        {/* Hero Section */}
        <section className="hero">
  <img src="/assets/website_images/logo.png" alt="uniqueseries logo" className="hero-logo" />
  <p className="hero-subtitle">
    Every note tells a story… discover rare currency notes with meaningful dates, paired with elegant frames, zodiac coins, and premium keepsakes that turn memories into timeless treasures.
  </p>
          <div className="hero-buttons">
            <a href="#products" className="btn btn-primary hero-btn">
              Explore Products
            </a>
            <Link to="/about" className="btn btn-outline hero-btn">
              Our Story
            </Link>
          </div>
        </section>

        {/* Products Section */}
        <section id="products" className="products-section">
          <h2 className="section-title">Our Products</h2>
          <p className="section-subtitle">
            Discover our unique collection of currency notes, frames, and collectibles
          </p>
          
          <div className="products-grid">
            {products.map((product, idx) => (
              <div
                key={product.id}
                className="product-card"
                style={{ background: product.bgColor }}
              >
                {product.image ? (
                  <img src={product.image} alt={product.title} className={product.imageClass} />
                ) : (
                  <div className="product-icon" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                    {product.icon}
                  </div>
                )}
                <h3 className="product-title">{product.title}</h3>
                <p className="product-description">{product.fullDescription}</p>
                <div className="product-features">
                  <h4>Key Features:</h4>
                  <ul>
                    {product.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
                <Link to={product.link} className="btn btn-primary product-btn">
                  Shop {product.title}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* About Summary Section */}
        <section className="about-summary">
          <div className="summary-content">
            <div className="summary-text">
              <h2>About uniqueseries</h2>
              <p>
                Founded with a passion for preserving special moments, uniqueseries specializes in 
                currency notes with meaningful serial numbers and premium frames. We believe every date 
                has a story, and every story deserves to be beautifully preserved.
              </p>
              <p>
                What started as a hobby of collecting currency notes with birthdate serial numbers 
                has evolved into India's premier destination for meaningful gifts that create lasting memories.
              </p>
              <Link to="/about" className="btn btn-secondary">
                Read Our Full Story
              </Link>
            </div>
            <div className="summary-image">
              <div className="image-placeholder">
                <span className="placeholder-icon">📖</span>
                <p>Our Journey</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Summary Section */}
        <section className="contact-summary">
          <h2>Get In Touch</h2>
          <p>Have questions or need help finding a specific serial number? We're here to help!</p>
          
          <div className="contact-grid">
            <div className="contact-item">
              <div className="contact-icon">📍</div>
              <div>
                <h3>Visit Us</h3>
                <p>Vijayawada, Andhra Pradesh, India</p>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon">📞</div>
              <div>
                <h3>Call Us</h3>
                <p>+91 9392464563</p>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon">✉️</div>
              <div>
                <h3>Email Us</h3>
                <p>uniqueseries500@gmail.com</p>
              </div>
            </div>
          </div>
          
          <Link to="/contact" className="btn btn-primary contact-btn">
            Contact Us & View Full Details
          </Link>
        </section>

        {/* Features Section */}
        <section className="features">
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon">🎁</div>
              <h3>Perfect Gifts</h3>
              <p>Unique serial number notes for special occasions</p>
            </div>
            <div className="feature">
              <div className="feature-icon">🏆</div>
              <h3>Premium Quality</h3>
              <p>High-quality frames and materials</p>
            </div>
            <div className="feature">
              <div className="feature-icon">🚚</div>
              <h3>Fast Delivery</h3>
              <p>Quick and secure shipping nationwide</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
