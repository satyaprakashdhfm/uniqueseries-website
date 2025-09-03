import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { productAPI } from '../../services/api';
import CustomizationModal from '../../components/CustomizationModal';
import './ProductPages.css';

const ZodiacCoins = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const { addToCart } = useCart();

  // Fallback two products
  const fallbackProducts = [
    { id: 'zodiac_coin', name: 'Zodiac Coin', description: 'Collectible coin featuring your selected zodiac sign', price: 199, type: 'zodiac_coin', is_available: true, w_days: 5, image: '/assets/Zodiac/zodiac_coin.jpg' },
    { id: 'zodiac_stamp', name: 'Zodiac Stamp', description: 'Special stamp featuring your selected zodiac sign', price: 149, type: 'zodiac_stamp', is_available: true, w_days: 5, image: '/assets/Zodiac/zodiac_stamp.jpg' }
  ];

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = async () => {
    try {
      const [coins, stamps] = await Promise.all([
        productAPI.getByType('zodiac_coin').catch(() => []),
        productAPI.getByType('zodiac_stamp').catch(() => [])
      ]);

      const coinFromApi = Array.isArray(coins) && coins.length > 0 ? coins[0] : null;
      const stampFromApi = Array.isArray(stamps) && stamps.length > 0 ? stamps[0] : null;

      const twoProducts = [
        {
          id: 'zodiac_coin',
          name: 'Zodiac Coin',
          description: 'Collectible coin featuring your selected zodiac sign',
          price: coinFromApi ? Number(coinFromApi.price) : 199,
          type: 'zodiac_coin',
          is_available: coinFromApi ? !!coinFromApi.is_available : true,
          w_days: coinFromApi?.w_days ?? 5,
          image: '/assets/Zodiac/zodiac_coin.jpg'
        },
        {
          id: 'zodiac_stamp',
          name: 'Zodiac Stamp',
          description: 'Special stamp featuring your selected zodiac sign',
          price: stampFromApi ? Number(stampFromApi.price) : 149,
          type: 'zodiac_stamp',
          is_available: stampFromApi ? !!stampFromApi.is_available : true,
          w_days: stampFromApi?.w_days ?? 5,
          image: '/assets/Zodiac/zodiac_stamp.jpg'
        }
      ];

      setProducts(twoProducts);
    } catch (error) {
      console.error('Error fetching zodiac products:', error);
      setProducts(fallbackProducts);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    setSelectedProduct(product);
    setShowCustomizationModal(true);
  };

  const handleCustomizedAddToCart = (product, quantity, customization) => {
    addToCart(product, quantity, customization);
    setShowCustomizationModal(false);
    setSelectedProduct(null);
  };

  const handleCloseModal = () => {
    setShowCustomizationModal(false);
    setSelectedProduct(null);
  };

  if (loading) {
    return (
      <div className="product-page">
        <div className="container">
          <div className="loading-spinner">Loading zodiac coins...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Zodiac Collection</h1>
          <p className="page-subtitle">Choose between Coin and Stamp, then pick your zodiac sign during checkout</p>
        </div>

        <div className="products-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                <img
                  src={product.image}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }}
                />
              </div>
              
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-description">{product.description}</p>
                <div className="product-price">₹{product.price} <span style={{fontSize:'0.85rem', color:'#666'}}>• Delivery in {product.w_days ?? 5} days</span></div>
                
                {product.is_available ? (
                  <button 
                    onClick={() => handleAddToCart(product)}
                    className="btn btn-primary add-to-cart-btn"
                  >
                    Add to Cart
                  </button>
                ) : (
                  <button 
                    className="btn btn-secondary add-to-cart-btn" 
                    disabled
                  >
                    Out of Stock
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="product-info-section">
          <h2>About Our Zodiac Collection</h2>
          <div className="info-grid">
            <div className="info-item">
              <h3>⭐ Your Sign</h3>
              <p>Select your zodiac sign during checkout and we prepare the item accordingly.</p>
            </div>
            <div className="info-item">
              <h3>🪙 Premium Quality</h3>
              <p>High-quality coins and stamps with detailed finishing.</p>
            </div>
            <div className="info-item">
              <h3>🎁 Perfect Gifts</h3>
              <p>Ideal gifts for astrology lovers and those who believe in zodiac signs.</p>
            </div>
          </div>
        </div>
      </div>

      <CustomizationModal
        isOpen={showCustomizationModal}
        onClose={handleCloseModal}
        product={selectedProduct}
        onAddToCart={handleCustomizedAddToCart}
      />
    </div>
  );
};

export default ZodiacCoins;
