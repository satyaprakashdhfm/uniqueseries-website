import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Cart.css';

const Cart = () => {
  const { cartItems, removeFromCart, cartTotals } = useCart();
  const maxDeliveryDays = Math.max(0, ...cartItems.map(i => (i.w_days ?? 5)));
  const { isLoggedIn } = useAuth();
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imagesMap, setImagesMap] = useState({}); // key: item.id -> [urls]

  // Helper to detect direct http(s)
  const isHttp = (s) => typeof s === 'string' && /^https?:\/\//i.test(s);

  // Fetch images for folder-based uploads whenever cartItems change
  useEffect(() => {
    const fetchImages = async () => {
      const tasks = [];
      cartItems.forEach((it) => {
        const val = it.custom_photo_url;
        if (val && !isHttp(val)) {
          tasks.push(
            api.get('/upload/list', { params: { folder: val } })
              .then((resp) => ({ key: it.id, urls: (resp.data?.images || []).map((x) => x.imageUrl).filter(Boolean) }))
              .catch(() => ({ key: it.id, urls: [] }))
          );
        }
      });
      if (tasks.length === 0) return;
      const results = await Promise.all(tasks);
      setImagesMap((prev) => {
        const next = { ...prev };
        results.forEach(({ key, urls }) => { next[key] = urls; });
        return next;
      });
    };
    fetchImages();
  }, [cartItems]);

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <h2>Your Cart is Empty</h2>
            <p>Looks like you haven't added any items to your cart yet.</p>
            <Link to="/" className="btn btn-primary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Shopping Cart</h1>
          <p className="page-subtitle">
            Review your items before checkout
          </p>
        </div>

        <div className="cart-content">
          <div className="unified-cart-section">
            <h2>Shopping Cart ({cartItems.length} items)</h2>
            
            <div className="cart-items-list">
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="item-info">
                    <h3 className="item-name">{item.name}</h3>
                    <p className="item-description">{item.description}</p>
                    <p className="item-delivery" style={{marginTop:'4px', color:'#555', fontSize:'0.9rem'}}>Delivery in {item.w_days ?? 5} days</p>

                    {/* Customization details */}
                    {(() => {
                      const rawInstr   = item.datewith_instructions || '';
                      const parts      = rawInstr ? rawInstr.split(' | ').map(p => p.trim()).filter(Boolean) : [];

                      const folderImgs = imagesMap[item.id] || [];
                      const directImgs = item.custom_photo_url && isHttp(item.custom_photo_url) ? [item.custom_photo_url] : [];
                      const allImgs    = [...directImgs, ...folderImgs];

                      const showPrice  = item.priceBreakdown || item.customization?.priceBreakdown;

                      return (
                        <div style={{ marginTop: 6, fontSize: '0.9rem', color: '#333' }}>
                          {parts.length > 0 && (
                            <>
                              <strong>Details:</strong>
                              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                                {parts.map((p, i) => (
                                  <li key={i} style={{ listStyle: 'disc' }}>{p}</li>
                                ))}
                              </ul>
                            </>
                          )}

                          {allImgs.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))', gap: 6, marginTop: 6 }}>
                              {allImgs.map((src, idx) => (
                                <img
                                  key={idx}
                                  src={src}
                                  alt={`img-${idx}`}
                                  style={{ width: '100%', height: 50, objectFit: 'cover', borderRadius: 4, border: '1px solid #eee', cursor: 'pointer' }}
                                  onClick={() => setPreviewUrl(src)}
                                />
                              ))}
                            </div>
                          )}

                          {showPrice && (
                            <div style={{ marginTop: 8, padding: 8, background: '#f8f9fa', borderRadius: 6, border: '1px solid #eee' }}>
                              <div style={{ fontWeight: 600, marginBottom: 4 }}>Pricing</div>
                              <div>Base: ₹{showPrice.base}</div>

                              {Array.isArray(showPrice.extras) && showPrice.extras.map((ex, i) => {
                                const hasLetters = typeof ex.letters === 'number' && !isNaN(ex.letters);
                                return (
                                  <div key={i}>
                                    {ex.label}{hasLetters ? `: ${ex.letters} letters` : ''} — ₹{ex.cost}
                                  </div>
                                );
                              })}

                              <div>Total Extras: ₹{showPrice.totalExtras}</div>
                              <div style={{ marginTop: 4 }}><strong>Final Price:</strong> ₹{item.price}</div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  
                  <div className="item-actions">
                    <div className="item-price">₹{item.price}</div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="remove-btn"
                      title="Remove from cart"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 6H5H21" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 11V17" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 11V17" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <hr className="cart-divider" />

            <div className="order-summary-section">
              <h3>Order Summary</h3>
              
              <div className="summary-row">
                <span>Subtotal ({cartItems.length} items)</span>
                <span>₹{cartTotals.subtotal}</span>
              </div>
              
              <div className="summary-row">
                <span>Shipping</span>
                <span>
                  {cartTotals.shipping === 0 && cartTotals.subtotal > 999 ? (
                    <>
                      <span style={{ textDecoration: 'line-through', color: '#888' }}>₹68</span>
                      <span style={{ color: '#2e7d32', fontWeight: 600, marginLeft: 6 }}>Free</span>
                    </>
                  ) : (
                    `₹${cartTotals.shipping}`
                  )}
                </span>
              </div>
              
              <hr className="summary-divider" />
              
              <div className="summary-row total-row">
                <span>Total</span>
                <span>₹{cartTotals.total}</span>
              </div>
              
              <div className="checkout-actions">
                <div style={{marginBottom:'8px', color:'#444'}}>Estimated delivery in <strong>{maxDeliveryDays}</strong> days</div>
                <Link 
                  to={isLoggedIn ? '/payment' : '/login'}
                  className="btn btn-primary checkout-btn"
                  style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}
                >
                  {isLoggedIn ? 'Proceed to Checkout' : 'Login to Checkout'}
                </Link>
                
                <Link 
                  to="/" 
                  className="btn btn-outline continue-shopping-btn"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="cart-features">
          <div className="feature-grid">
            <div className="feature-item">
              <div className="feature-icon">🔒</div>
              <h3>Secure Checkout</h3>
              <p>Your payment information is protected with industry-standard encryption</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🚚</div>
              <h3>Fast Delivery</h3>
              <p>Get your items delivered within 3-7 business days across India</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><img src="/assets/website_images/image.png" alt="No Returns" style={{height:'1.8em',width:'auto',display:'inline-block',verticalAlign:'middle',borderRadius:'5px'}} /></div>
              <h3>No Returns</h3>
              <p style={{color:'#d63384',fontWeight:'bold'}}>No returns or exchanges. All sales are final.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewUrl && (
        <div
          onClick={() => setPreviewUrl(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        >
          <img
            src={previewUrl}
            alt="preview"
            style={{ maxWidth: '90vw', maxHeight: '90vh', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', borderRadius: 8 }}
          />
        </div>
      )}
    </div>
  );
};

export default Cart;
