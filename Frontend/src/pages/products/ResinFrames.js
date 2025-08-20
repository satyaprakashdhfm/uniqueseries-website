import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { productAPI } from '../../services/api';
import CustomizationModal from '../../components/CustomizationModal';
import './ProductPages.css';

const ResinFrames = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const { addToCart } = useCart();

  // Fallback data with real database IDs and asset paths
  const fallbackFrames = [
    {
      id: 'abbe4419-9f67-4ff9-b5bf-d9f2bbc1cb6c',
      name: 'Small Resin Frame',
      description: 'Crystal clear resin frame with currency note (small)',
      price: 599,
      image: '/assets/resin_frames/resin-small.jpg',
      type: 'resin_frame',
      is_available: true
    },
    {
      id: 'afd2cada-2b03-44ea-b8d5-5fa53bf682cf',
      name: 'Large Resin Frame',
      description: 'Crystal clear resin frame with currency note (large)',
      price: 799,
      image: '/assets/resin_frames/resin-big.jpg',
      type: 'resin_frame',
      is_available: true
    }
  ];

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getByType('resin_frame');
      console.log('Resin Frame API Response:', response); // Debug log
      
      // API returns array directly, not wrapped in products object
      const apiProducts = Array.isArray(response) ? response : [];
      
      // Map API products to include missing fields
      const mappedProducts = apiProducts.map(product => {
        const productMap = {
          'small_resin_frame': {
            display: 'Small Resin Frame',
            description: 'Crystal clear resin frame with currency note (small)',
            image: '/assets/resin_frames/resin-small.jpg'
          },
          'large_resin_frame': {
            display: 'Large Resin Frame',
            description: 'Crystal clear resin frame with currency note (large)',
            image: '/assets/resin_frames/resin-big.jpg'
          }
        };
        
        const mapped = productMap[product.name] || {
          display: product.name,
          description: 'Premium resin frame with currency note',
          image: '/assets/resin_frames/resin-small.jpg'
        };
        
        return {
          id: product.name, // Use name as ID since it's the primary key
          name: mapped.display,
          price: Number(product.price),
          description: mapped.description,
          image: mapped.image,
          type: product.type,
          is_available: product.is_available,
          w_days: product.w_days ?? 5
        };
      });
      
      // Ensure Small appears first
      const sorted = [...mappedProducts].sort((a, b) => {
        const aSmall = (a.id || a.name || '').toLowerCase().includes('small');
        const bSmall = (b.id || b.name || '').toLowerCase().includes('small');
        if (aSmall === bSmall) return 0;
        return aSmall ? -1 : 1;
      });
      setProducts(sorted);
    } catch (error) {
      console.error('Error fetching resin frames:', error);
      // Use fallback data if API fails
      const sorted = [...fallbackFrames].sort((a, b) => {
        const aSmall = (a.id || a.name || '').toLowerCase().includes('small') || (a.name || '').toLowerCase().includes('small');
        const bSmall = (b.id || b.name || '').toLowerCase().includes('small') || (b.name || '').toLowerCase().includes('small');
        if (aSmall === bSmall) return 0;
        return aSmall ? -1 : 1;
      });
      setProducts(sorted);
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
          <div className="loading-spinner">Loading resin frames...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Resin Frames</h1>
          <p className="page-subtitle">
            Premium resin frames for elegant display of your special currency notes with modern aesthetics
          </p>
        </div>

        <div className="products-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                <img 
                  src={product.image || product.imageUrl || '/assets/resin_frames/resin-small.jpg'} 
                  alt={product.name} 
                  style={{height: '120px', width: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}} 
                  onError={(e) => {
                    e.target.src = '/assets/resin_frames/resin-small.jpg'; // fallback image
                  }}
                />
              </div>
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-description">{product.description}</p>
                {(() => {
                  const isSmall = (product.id || product.name || '').toLowerCase().includes('small');
                  const sizeText = isSmall ? '7x12 inches' : '9x14 inches';
                  return <div style={{ color: '#6c757d', marginBottom: '0.5rem' }}>Size: {sizeText}</div>;
                })()}
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
          <h2>About Our Resin Frames</h2>
          <div className="info-grid">
            <div className="info-item">
              <h3>💎 Premium Resin</h3>
              <p>Made from high-quality resin materials that provide crystal-clear visibility and durability.</p>
            </div>
            <div className="info-item">
              <h3>🎨 Modern Design</h3>
              <p>Contemporary aesthetic that complements any home or office decor.</p>
            </div>
            <div className="info-item">
              <h3>🛡️ Protection</h3>
              <p>Excellent protection for your currency notes while maintaining perfect visibility.</p>
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

export default ResinFrames;
