import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Cart.css';

const Cart = () => {
  const { cartItems, removeFromCart, cartTotals } = useCart();
  const maxDeliveryDays = Math.max(0, ...cartItems.map(i => (i.w_days ?? 5)));
  const { isLoggedIn } = useAuth();
  const [previewUrl, setPreviewUrl] = useState(null);

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
                      const c = item.customization || {};
                      const imgs = Array.isArray(c.imageUrls) ? c.imageUrls : (c.imageUrl ? [c.imageUrl] : []);
                      const imageNames = (Array.isArray(c.imageNames) && c.imageNames.length > 0)
                        ? c.imageNames
                        : imgs.map((u) => {
                            try {
                              const last = (u || '').split('/').pop() || '';
                              return decodeURIComponent((last.split('?')[0]) || last);
                            } catch { return u; }
                          }).filter(Boolean);

                      const cat = (item.category || item.type || '').toLowerCase();
                      const isResin = cat.includes('resin');
                      const isFrame = cat.includes('frame') && !cat.includes('resin');
                      const isSmallResin = isResin && (item.name || '').toLowerCase().includes('small');

                      const hasAnyText = isResin
                        ? (isSmallResin
                            ? ((c.resinName1 || c.names) || (c.resinEventDate || c.specialData))
                            : ((c.resinName1 || c.resinDate1) || (c.resinName2 || c.resinDate2)))
                        : (isFrame
                            ? (c.frameName1 || c.frameDate1 || c.frameName2 || c.frameDate2 || c.frameEvent || c.event || c.customEvent || c.frameEventDate || c.specialData || c.description)
                            : (c.specialData || c.description));

                      if (!hasAnyText && imageNames.length === 0 && imgs.length === 0) return null;

                      return (
                        <div className="item-customization" style={{marginTop:'6px', fontSize:'0.9rem', color:'#333'}}>
                          {isResin ? (
                            <>
                              {isSmallResin ? (
                                <>
                                  <div><strong>Name:</strong> {c.resinName1 || c.names || 'Not given'}</div>
                                  <div><strong>Event:</strong> {c.resinEvent || 'Not given'}</div>
                                  <div><strong>Event Date:</strong> {c.resinEventDate || c.specialData || 'Not given'}</div>
                                </>
                              ) : (
                                <>
                                  <div><strong>Person 1:</strong> {[c.resinName1 || 'Not given', c.resinDate1 || 'Not given'].join(' - ')}</div>
                                  <div><strong>Person 2:</strong> {[c.resinName2 || 'Not given', c.resinDate2 || 'Not given'].join(' - ')}</div>
                                  <div><strong>Event:</strong> {c.resinEvent || 'Not given'}</div>
                                  <div><strong>Event Date:</strong> {c.resinEventDate || 'Not given'}</div>
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              {isFrame ? (
                                <>
                                  {/* Frame names/dates if provided */}
                                  {(c.frameName1 || c.frameDate1) && (
                                    <div><strong>Person 1:</strong> {[c.frameName1 || 'Not given', c.frameDate1 || 'Not given'].join(' - ')}</div>
                                  )}
                                  {(c.frameName2 || c.frameDate2) && (
                                    <div><strong>Person 2:</strong> {[c.frameName2 || 'Not given', c.frameDate2 || 'Not given'].join(' - ')}</div>
                                  )}
                                  {/* Frame event and date */}
                                  {(c.event || c.frameEvent || c.customEvent) && (
                                    <div><strong>Event:</strong> {c.event || c.frameEvent || c.customEvent}</div>
                                  )}
                                  {(c.frameEventDate || c.specialData) && (
                                    <div><strong>Event Date:</strong> {c.frameEventDate || c.specialData}</div>
                                  )}
                                  {/* Custom frames: list Names and Notes with details */}
                                  {Array.isArray(c.customNames) && c.customNames.length > 0 && (
                                    <div style={{ marginTop: '4px' }}>
                                      <strong>Names:</strong>
                                      <div style={{ marginTop: '2px' }}>
                                        {c.customNames.map((nm, i) => {
                                          const letters = Math.min(50, String(nm || '').replace(/\s+/g, '').length);
                                          return (
                                            <div key={`cname-${i}`}>Name {i + 1}: {nm || 'Not given'}{letters ? ` — ${letters} letters` : ''}</div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  {Array.isArray(c.customNotes) && c.customNotes.length > 0 && (
                                    <div style={{ marginTop: '4px' }}>
                                      <strong>Notes:</strong>
                                      <div style={{ marginTop: '2px' }}>
                                        {c.customNotes.map((n, i) => (
                                          <div key={`cnote-${i}`}>
                                            Note {i + 1}: Date: {n?.date || 'Not given'} • Currency: {n?.currency ? `₹${n.currency}` : 'Not given'}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {/* Keep concise description (may include variant/size) */}
                                  {c.description && <div><strong>Description:</strong> {c.description}</div>}
                                </>
                              ) : (
                                <>
                                  {c.specialData && <div><strong>Special Date:</strong> {c.specialData}</div>}
                                  {c.description && <div><strong>Description:</strong> {c.description}</div>}
                                </>
                              )}
                            </>
                          )}

                          {imageNames.length > 0 && (
                            <div style={{marginTop:'4px'}}><strong>Images:</strong> {imageNames.join(', ')}</div>
                          )}
                          {imgs.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))', gap: '6px', marginTop: '6px' }}>
                              {imgs.map((src, idx) => (
                                <img
                                  key={idx}
                                  src={src}
                                  alt={`Img ${idx+1}`}
                                  style={{ width: '100%', height: '50px', objectFit: 'cover', borderRadius: '4px', border:'1px solid #eee', cursor: 'pointer' }}
                                  onClick={() => setPreviewUrl(src)}
                                />
                              ))}
                            </div>
                          )}
                          {c.priceBreakdown && (
                            <div className="price-breakdown" style={{marginTop:'8px', padding:'8px', background:'#f8f9fa', borderRadius:'6px', border:'1px solid #eee'}}>
                              <div style={{fontWeight:600, marginBottom:4}}>Pricing</div>
                              <div>Base: ₹{c.priceBreakdown.base}</div>
                              {Array.isArray(c.priceBreakdown.extras) && c.priceBreakdown.extras.map((ex, i) => {
                                const hasLetters = typeof ex.letters === 'number' && !isNaN(ex.letters);
                                return (
                                  <div key={i}>
                                    {ex.label}{hasLetters ? `: ${ex.letters} letters` : ''} — ₹{ex.cost}
                                  </div>
                                );
                              })}
                              <div>Total Extras: ₹{c.priceBreakdown.totalExtras}</div>
                              <div style={{marginTop:4}}><strong>Final Price:</strong> ₹{item.price}</div>
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
                      🗑️
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
