import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { productAPI } from '../../services/api';
import CustomizationModal from '../../components/CustomizationModal';
import './ProductPages.css';

const CurrencyNotes = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const { addToCart } = useCart();

  // Fallback data with real database IDs and asset paths
  const fallbackNotes = [
    { 
      id: '0ca261c4-14d4-4597-9b3e-40be63f7dd29', 
      name: '₹1 Currency Note', 
      price: 50, 
      description: 'Special serial number ₹1 note', 
      image: '/assets/Currency_notes/1.jpg', 
      type: 'currency_note', 
      is_available: true 
    },
    { 
      id: 'cdb80966-d622-4c43-9dd9-0b159382213c', 
      name: '₹5 Currency Note', 
      price: 75, 
      description: 'Special serial number ₹5 note', 
      image: '/assets/Currency_notes/5.jpeg', 
      type: 'currency_note', 
      is_available: true 
    },
    { 
      id: '99932890-7e9b-4dbd-95f7-d7d0088f4755', 
      name: '₹10 Currency Note', 
      price: 100, 
      description: 'Special serial number ₹10 note', 
      image: '/assets/Currency_notes/10.jpg', 
      type: 'currency_note', 
      is_available: true 
    },
    { 
      id: '3496298c-da2f-41d2-b598-06e952fe4d71', 
      name: '₹20 Currency Note', 
      price: 150, 
      description: 'Special serial number ₹20 note', 
      image: '/assets/Currency_notes/20.jpg', 
      type: 'currency_note', 
      is_available: true 
    },
    { 
      id: 'd32ef6b1-8c01-4013-919a-730b8c27fe51', 
      name: '₹50 Currency Note', 
      price: 200, 
      description: 'Special serial number ₹50 note', 
      image: '/assets/Currency_notes/50.jpg', 
      type: 'currency_note', 
      is_available: true 
    },
    { 
      id: 'faace211-46a7-41e9-b332-850033a950c4', 
      name: '₹100 Currency Note', 
      price: 300, 
      description: 'Special serial number ₹100 note', 
      image: '/assets/Currency_notes/100.jpg', 
      type: 'currency_note', 
      is_available: true 
    },
    { 
      id: '59b0aa0c-7a5f-41ac-b32d-88d1ba87f3b2', 
      name: '₹200 Currency Note', 
      price: 500, 
      description: 'Special serial number ₹200 note', 
      image: '/assets/Currency_notes/200.jpg', 
      type: 'currency_note', 
      is_available: true 
    },
    { 
      id: 'aef883d5-06c1-4412-b642-6797cc22231b', 
      name: '₹500 Currency Note', 
      price: 800, 
      description: 'Special serial number ₹500 note', 
      image: '/assets/Currency_notes/500.jpg', 
      type: 'currency_note', 
      is_available: true 
    }
  ];

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getByType('currency_note');
      
      // API returns array directly, not wrapped in products object
      const apiProducts = Array.isArray(response) ? response : [];
      
      // Map API products to include missing fields
      const mappedProducts = apiProducts.map(product => {
        // Map database names to display names; price comes from DB
        const productMap = {
          '1_rupees_note': { display: '₹1 Currency Note', price: 50, image: '/assets/Currency_notes/1.jpg' },
          '2_rupees_note': { display: '₹2 Currency Note', image: '/assets/Currency_notes/2.jpg' },
          '5_rupees_note': { display: '₹5 Currency Note', price: 75, image: '/assets/Currency_notes/5.jpeg' },
          '10_rupees_note': { display: '₹10 Currency Note', price: 100, image: '/assets/Currency_notes/10.jpg' },
          '20_rupees_note': { display: '₹20 Currency Note', price: 150, image: '/assets/Currency_notes/20.jpg' },
          '50_rupees_note': { display: '₹50 Currency Note', price: 200, image: '/assets/Currency_notes/50.jpg' },
          '100_rupees_note': { display: '₹100 Currency Note', price: 300, image: '/assets/Currency_notes/100.jpg' },
          '200_rupees_note': { display: '₹200 Currency Note', price: 500, image: '/assets/Currency_notes/200.jpg' },
          '500_rupees_note': { display: '₹500 Currency Note', price: 800, image: '/assets/Currency_notes/500.jpg' }
        };
        
        const mapped = productMap[product.name] || { display: product.name, image: '/assets/Currency_notes/1.jpg' };
        
        return {
          id: product.name, // Use name as ID since it's the primary key
          name: mapped.display,
          price: Number(product.price),
          description: `Special serial number ${mapped.display.split(' ')[0]} note`,
          image: product.image_url || product.imageUrl || product.image || mapped.image,
          type: product.type,
          is_available: product.is_available,
          w_days: product.w_days ?? 5
        };
      });
      
      // Sort by denomination ascending using backend product name as key
      const denomRank = {
        '1_rupees_note': 1,
        '2_rupees_note': 2,
        '5_rupees_note': 5,
        '10_rupees_note': 10,
        '20_rupees_note': 20,
        '50_rupees_note': 50,
        '100_rupees_note': 100,
        '200_rupees_note': 200,
        '500_rupees_note': 500
      };
      mappedProducts.sort((a, b) => (denomRank[a.id] || 9999) - (denomRank[b.id] || 9999));

      setProducts(mappedProducts);
    } catch (error) {
      console.error('Error fetching currency notes:', error);
      // Use fallback data if API fails
      setProducts(fallbackNotes);
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
          <div className="loading-spinner">Loading currency notes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Currency Notes</h1>
          <p className="page-subtitle">
            Special serial number currency notes perfect for gifting on birthdays, anniversaries, and special occasions
          </p>
        </div>

        <div className="products-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                <img 
                  src={product.image || product.imageUrl || '/assets/Currency_notes/default.jpg'} 
                  alt={product.name} 
                  style={{height: '100px', width: 'auto', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}} 
                  onError={(e) => {
                    e.target.src = '/assets/Currency_notes/1.jpg'; // fallback image
                  }}
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
          <h2>About Our Currency Notes</h2>
          <div className="info-grid">
            <div className="info-item">
              <h3>🎯 Special Serial Numbers</h3>
              <p>We carefully select currency notes with serial numbers matching special dates like birthdays, anniversaries, or lucky numbers.</p>
            </div>
            <div className="info-item">
              <h3>✨ Authentic & Genuine</h3>
              <p>All our currency notes are authentic and in excellent condition, perfect for gifting and collecting.</p>
            </div>
            <div className="info-item">
              <h3>🎁 Perfect Gifts</h3>
              <p>Unique and meaningful gifts that create lasting memories for your loved ones.</p>
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

export default CurrencyNotes;
