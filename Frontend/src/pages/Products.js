import React from 'react';
import { Link } from 'react-router-dom';
import './Products.css';

const Products = () => {
  const productCategories = [
    {
      id: 1,
      title: 'Currency Notes',
      description: 'Special serial number currency notes perfect for gifting on birthdays, anniversaries, and special occasions',
      image: '💵',
      link: '/products/currency-notes',
      items: ['₹1 Notes', '₹5 Notes', '₹10 Notes', '₹20 Notes', '₹50 Notes', '₹100 Notes', '₹200 Notes', '₹500 Notes']
    },
    {
      id: 2,
      title: 'Framed Notes',
      description: 'Beautiful frames showcasing currency notes with special serial numbers',
      image: '🖼️',
      link: '/products/framed-notes',
      items: ['Small Frames (6x8 inch)', 'Large Frames (8x10 inch)']
    },
    {
      id: 3,
      title: 'Resin Frames',
      description: 'Premium resin frames for elegant display of your special currency notes',
      image: '✨',
      link: '/products/resin-frames',
      items: ['Small Resin Frames', 'Large Resin Frames']
    },
    {
      id: 4,
      title: 'Zodiac Coins',
      description: 'Zodiac Coin and Zodiac Stamp with your chosen sign',
      image: '/assets/Zodiac/zodiac_coin.jpg',
      link: '/products/zodiac-coins',
      items: ['Zodiac Coin', 'Zodiac Stamp']
    }
  ];

  return (
    <div className="products-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Our Products</h1>
          <p className="page-subtitle">
            Discover our unique collection of currency notes, frames, and collectibles
          </p>
        </div>

        <div className="products-grid">
          {productCategories.map(category => (
            <div key={category.id} className="product-category-card">
              <div className="category-image">
                {typeof category.image === 'string' && category.image.startsWith('/') ? (
                  <img src={category.image} alt={category.title} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8 }} />
                ) : (
                  <span className="category-icon">{category.image}</span>
                )}
              </div>
              
              <div className="category-content">
                <h3 className="category-title">{category.title}</h3>
                <p className="category-description">{category.description}</p>
                
                <div className="category-items">
                  <h4>Available Items:</h4>
                  <ul className="items-list">
                    {category.items.slice(0, 4).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                    {category.items.length > 4 && (
                      <li>...and {category.items.length - 4} more</li>
                    )}
                  </ul>
                </div>
                
                <Link to={category.link} className="btn btn-primary category-btn">
                  View Products
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="why-choose-us">
          <h2>Why Choose Frames & More?</h2>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">🎯</div>
              <h3>Unique Serial Numbers</h3>
              <p>We specialize in finding currency notes with special dates and serial numbers</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🏆</div>
              <h3>Premium Quality</h3>
              <p>All our frames and products are made with high-quality materials</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🎁</div>
              <h3>Perfect Gifts</h3>
              <p>Ideal for birthdays, anniversaries, and special occasions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
