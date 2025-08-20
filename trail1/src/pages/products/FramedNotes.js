import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { productAPI } from '../../services/api';
import CustomizationModal from '../../components/CustomizationModal';
import './ProductPages.css';

const FramedNotes = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const { addToCart } = useCart();

  // Fallback data with real database IDs and asset paths
  const fallbackFrames = [
    {
      id: '34323d5b-0c6e-4774-876a-013fb862a91f',
      name: 'Small Photo Frame',
      description: 'Premium small frame with currency note (8x15 inches)',
      price: 299,
      image: '/assets/frames/small.jpeg',
      type: 'photo_frame',
      is_available: true
    },
    {
      id: '40c123e9-f80f-4782-985f-5865daf0a61c',
      name: 'Large Photo Frame',
      description: 'Premium large frame with currency note (13x19 inches)',
      price: 399,
      image: '/assets/frames/large.jpeg',
      type: 'photo_frame',
      is_available: true
    }
  ];

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getByType('photo_frame');
      
      // API returns array directly, not wrapped in products object
      const apiProducts = Array.isArray(response) ? response : [];
      
      // Map API products to include missing fields
      const mappedProducts = apiProducts.map(product => {
        const productMap = {
          // Legacy names
          'small_photo_frame_with_currency': {
            display: 'Small Photo Frame',
            description: 'Premium small frame with currency note (8x15 inches)',
            image: '/assets/frames/small.jpeg'
          },
          'large_photo_frame_with_currency': {
            display: 'Large Photo Frame',
            description: 'Premium large frame with currency note (13x19 inches)',
            image: '/assets/frames/large.jpeg'
          },
          // Variant keys → Friendly labels
          'small1_1note_1name': {
            display: 'Small (Type 1)',
            description: 'Premium photo frame with currency note',
            image: '/assets/frames/small.jpeg'
          },
          'small2_2notes_2names': {
            display: 'Small (Type 2)',
            description: 'Premium photo frame with currency note',
            image: '/assets/frames/small.jpeg'
          },
          'custom': {
            display: 'Custom',
            description: 'Premium photo frame with currency note',
            image: '/assets/frames/small.jpeg'
          },
          'big1_1-200set_2notes_2names': {
            display: 'Big (Type 1)',
            description: 'Premium photo frame with currency note',
            image: '/assets/frames/large.jpeg'
          },
          'big1_1-500set_2notes_2names': {
            display: 'Big (Type 2)',
            description: 'Premium photo frame with currency note',
            image: '/assets/frames/large.jpeg'
          },
          'big2_1-500set_2notes_2names': {
            display: 'Big (Type 2)',
            description: 'Premium photo frame with currency note',
            image: '/assets/frames/large.jpeg'
          }
        };
        
        const mapped = productMap[product.name] || {
          display: product.name,
          description: 'Premium photo frame with currency note',
          image: (product.name || '').toLowerCase().startsWith('big') ? '/assets/frames/large.jpeg' : '/assets/frames/small.jpeg'
        };
        
        return {
          id: product.name, // Use name as ID since it's the primary key
          name: mapped.display,
          price: Number(product.price),
          description: mapped.description,
          image: product.image_url || product.imageUrl || product.image || mapped.image,
          type: product.type,
          is_available: product.is_available,
          w_days: product.w_days ?? 5
        };
      });
      // Expand variants client-side ONLY when API returns just base items (small/large)
      const lower = (s) => String(s || '').toLowerCase();
      const hasSmallBase = mappedProducts.some(p => lower(p.id).includes('small') || lower(p.name).includes('small'));
      const hasLargeBase = mappedProducts.some(p => lower(p.id).includes('large') || lower(p.name).includes('large') || lower(p.id).startsWith('big') || lower(p.name).startsWith('big'));

      if (mappedProducts.length <= 2 && hasSmallBase && hasLargeBase) {
        const smallBase = mappedProducts.find(p => lower(p.id).includes('small') || lower(p.name).includes('small')) || mappedProducts[0];
        const largeBase = mappedProducts.find(p => lower(p.id).includes('large') || lower(p.name).includes('large') || lower(p.id).startsWith('big') || lower(p.name).startsWith('big')) || mappedProducts[1];

        const variants = [
          // Small variants
          { id: 'small1_1note_1name', name: 'Small (Type 1)', description: 'Premium photo frame with currency note', image: '/assets/frames/small.jpeg', price: smallBase.price, type: 'photo_frame', is_available: smallBase.is_available, w_days: smallBase.w_days ?? 5 },
          { id: 'small2_2notes_2names', name: 'Small (Type 2)', description: 'Premium photo frame with currency note', image: '/assets/frames/small.jpeg', price: smallBase.price, type: 'photo_frame', is_available: smallBase.is_available, w_days: smallBase.w_days ?? 5 },
          { id: 'custom', name: 'Custom', description: 'Premium photo frame with currency note', image: '/assets/frames/small.jpeg', price: smallBase.price, type: 'photo_frame', is_available: true, w_days: smallBase.w_days ?? 5 },
          // Big variants
          { id: 'big1_1-500set_2notes_2names', name: 'Big (Type 1)', description: 'Premium photo frame with currency note', image: '/assets/frames/large.jpeg', price: largeBase.price, type: 'photo_frame', is_available: largeBase.is_available, w_days: largeBase.w_days ?? 5 },
          { id: 'big2_1-500set_2notes_2names', name: 'Big (Type 2)', description: 'Premium photo frame with currency note', image: '/assets/frames/large.jpeg', price: largeBase.price, type: 'photo_frame', is_available: largeBase.is_available, w_days: largeBase.w_days ?? 5 }
        ];

        // Avoid duplicates if backend already has some variants
        const existingIds = new Set(mappedProducts.map(p => p.id));
        const expanded = mappedProducts.concat(variants.filter(v => !existingIds.has(v.id)));
        setProducts(expanded);
      } else {
        setProducts(mappedProducts);
      }
    } catch (error) {
      console.error('Error fetching framed notes:', error);
      // Use fallback data if API fails, but include common variants
      const fbSmall = fallbackFrames.find(f => (f.name || '').toLowerCase().includes('small'));
      const fbLarge = fallbackFrames.find(f => (f.name || '').toLowerCase().includes('large'));
      const expandedFallback = [...fallbackFrames];
      if (fbSmall) {
        expandedFallback.push(
          { id: 'small1_1note_1name', name: 'Small (Type 1)', description: 'Premium photo frame with currency note', image: '/assets/frames/small.jpeg', price: fbSmall.price, type: 'photo_frame', is_available: fbSmall.is_available, w_days: fbSmall.w_days ?? 5 },
          { id: 'small2_2notes_2names', name: 'Small (Type 2)', description: 'Premium photo frame with currency note', image: '/assets/frames/small.jpeg', price: fbSmall.price, type: 'photo_frame', is_available: fbSmall.is_available, w_days: fbSmall.w_days ?? 5 },
          { id: 'custom', name: 'Custom', description: 'Premium photo frame with currency note', image: '/assets/frames/small.jpeg', price: fbSmall.price, type: 'photo_frame', is_available: true, w_days: fbSmall.w_days ?? 5 }
        );
      }
      if (fbLarge) {
        expandedFallback.push(
          { id: 'big1_1-500set_2notes_2names', name: 'Big (Type 1)', description: 'Premium photo frame with currency note', image: '/assets/frames/large.jpeg', price: fbLarge.price, type: 'photo_frame', is_available: fbLarge.is_available, w_days: fbLarge.w_days ?? 5 },
          { id: 'big2_1-500set_2notes_2names', name: 'Big (Type 2)', description: 'Premium photo frame with currency note', image: '/assets/frames/large.jpeg', price: fbLarge.price, type: 'photo_frame', is_available: fbLarge.is_available, w_days: fbLarge.w_days ?? 5 }
        );
      }
      setProducts(expandedFallback);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    const isCustom = ((product?.name || '') + ' ' + (product?.id || ''))
      .toLowerCase()
      .includes('custom');
    const withVariant = isCustom ? { ...product, variant: 'custom' } : product;
    setSelectedProduct(withVariant);
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
          <div className="loading-spinner">Loading framed notes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Framed Notes</h1>
          <p className="page-subtitle">
            Premium frames for your special currency notes. Choose your preferred size!
          </p>
        </div>

        <div className="products-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                <img 
                  src={product.image || product.imageUrl || '/assets/frames/small.jpeg'} 
                  alt={product.name} 
                  style={{height: '120px', width: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}} 
                  onError={(e) => {
                    e.target.src = '/assets/frames/small.jpeg'; // fallback image
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

        <div className="product-info-section" style={{marginTop: '1rem', padding: '0.75rem 1rem', background: '#f8f9fa', border: '1.5px dashed #d63384', color: '#d63384', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto'}}>
          <h3 style={{fontSize: '1.1rem', marginBottom: '0.5rem'}}>Customize Your Frame <span style={{fontSize: '1rem'}}>(Coming Soon)</span></h3>
          <p style={{fontSize: '0.95rem', margin: 0}}>Want a unique frame style, color, or custom engraving? Our custom frame builder will launch soon!</p>
        </div>

        <div className="product-info-section">
          <h2>About Our Framed Notes</h2>
          <div className="info-grid">
            <div className="info-item">
              <h3>🎨 Premium Frames</h3>
              <p>High-quality frames made from durable materials with elegant finishes.</p>
            </div>
            <div className="info-item">
              <h3>💎 Special Notes</h3>
              <p>Each frame includes a carefully selected currency note with meaningful serial numbers.</p>
            </div>
            <div className="info-item">
              <h3>🏠 Perfect Display</h3>
              <p>Ideal for home, office, or as a unique gift that tells a story.</p>
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

export default FramedNotes;
