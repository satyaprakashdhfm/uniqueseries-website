import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../services/api';
import './Payment.css';

const Payment = () => {
  const { cartItems, cartTotals, clearCart } = useCart();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isPlacing, setIsPlacing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, type: 'percent'|'freeship', value }
  const [couponError, setCouponError] = useState('');
  const [formData, setFormData] = useState({
    // Billing Info (pre-filled from user if available)
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    
    // Card Info
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    
    // UPI Info
    upiId: ''
  });

  const navigate = useNavigate();
  const maxDeliveryDays = Math.max(0, ...cartItems.map(i => (i.w_days ?? 5)));

  // Derive shipping and discount with coupon preview
  const baseShipping = cartTotals.shipping || 0;
  const subtotal = cartTotals.subtotal || 0;
  const freeshipBySubtotal = subtotal > 999;
  const freeshipByCoupon = appliedCoupon?.type === 'freeship' && !freeshipBySubtotal;
  const shippingDisplay = (freeshipBySubtotal || freeshipByCoupon) ? 0 : baseShipping;
  const percentDiscount = appliedCoupon?.type === 'percent' ? Math.round((appliedCoupon.value / 100) * subtotal) : 0;
  const discount = Math.max(0, percentDiscount);
  const finalTotal = Math.max(0, (subtotal + shippingDisplay) - discount);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const applyCoupon = () => {
    const raw = (couponCode || '').trim();
    const codeUpper = raw.toUpperCase();
    const codeLower = raw.toLowerCase();
    if (!raw) {
      setAppliedCoupon(null);
      setCouponError('');
      return;
    }
    // Simple client-side validation rules (adjust as needed)
    const now = new Date();
    const expiry = new Date('2025-08-30T23:59:59');
    const validPercentCodes = ['yash10', 'satya11', 'jaya10'];

    if (codeUpper === 'SAVE10') {
      setAppliedCoupon({ code: codeUpper, type: 'percent', value: 10 });
      setCouponError('');
    } else if (codeUpper === 'FREESHIP') {
      setAppliedCoupon({ code: codeUpper, type: 'freeship', value: 0 });
      setCouponError('');
    } else if (validPercentCodes.includes(codeLower) && now <= expiry) {
      setAppliedCoupon({ code: codeUpper, type: 'percent', value: 10 });
      setCouponError('');
    } else {
      setAppliedCoupon(null);
      setCouponError('Coupon is invalid or expired');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsPlacing(true);
    try {
      const cart_items = cartItems.map(item => {
        let datewith_instructions = '';
        const c = item.customization || {};
        const typeStr = (item.type || item.category || '').toLowerCase();
        const isResin = typeStr.includes('resin');
        if (isResin) {
          const isSmall = (item.id || item.name || '').toLowerCase().includes('small');
          if (isSmall) {
            // Small Resin: include Event and Event Date with fallback
            const name = c.resinName1 || c.names || 'Not given';
            const event = c.resinEvent || 'Not given';
            const eventDate = c.resinEventDate || 'Not given';
            datewith_instructions = `Small Resin 8x15 inches | Name: ${name} | Event: ${event} | Event Date: ${eventDate}`.trim();
          } else {
            // Large Resin: include Event and Event Date with fallback
            const p1 = `${c.resinName1 || 'Not given'} - ${c.resinDate1 || 'Not given'}`.trim();
            const p2 = `${c.resinName2 || 'Not given'} - ${c.resinDate2 || 'Not given'}`.trim();
            const event = c.resinEvent || 'Not given';
            const eventDate = c.resinEventDate || 'Not given';
            datewith_instructions = `Large Resin 13x19 inches | Person 1: ${p1} | Person 2: ${p2} | Event: ${event} | Event Date: ${eventDate}`.trim();
          }
        } else if (item.customization) {
          const customizationParts = [];
          if (c.specialData) customizationParts.push(`Special Date: ${c.specialData}`);
          if (c.names) customizationParts.push(`Names: ${c.names}`);
          const catNonResin = (item.category || item.type || '').toLowerCase();
          const isFrameNonResin = catNonResin.includes('frame') && !catNonResin.includes('resin');
          if (isFrameNonResin) {
            // Include frame person details if available
            if (c.frameName1 || c.frameDate1) customizationParts.push(`Person 1: ${(c.frameName1 || 'Not given')} - ${(c.frameDate1 || 'Not given')}`);
            if (c.frameName2 || c.frameDate2) customizationParts.push(`Person 2: ${(c.frameName2 || 'Not given')} - ${(c.frameDate2 || 'Not given')}`);
            // Event and Event Date
            const evt = c.event || c.frameEvent || c.customEvent;
            if (evt) customizationParts.push(`Event: ${evt}`);
            const evtDate = c.frameEventDate || '';
            if (evtDate) customizationParts.push(`Event Date: ${evtDate}`);
            // Custom Names array
            if (Array.isArray(c.customNames) && c.customNames.filter(Boolean).length > 0) {
              const namesList = c.customNames.filter(Boolean).join(', ');
              customizationParts.push(`Names: ${namesList}`);
            }
            // Custom Notes array (date + currency)
            if (Array.isArray(c.customNotes) && c.customNotes.length > 0) {
              const notesList = c.customNotes
                .map((n, i) => {
                  const d = (n && n.date) ? n.date : '—';
                  const cur = (n && (n.currency || n.denomination)) ? (n.currency || n.denomination) : '—';
                  return `${d}-${cur}`;
                })
                .join(', ');
              customizationParts.push(`Notes: ${notesList}`);
            }
            // Include frame set type if present
            if (c.frameSetType) customizationParts.push(`Set: ${c.frameSetType}`);
          }
          if (c.description) customizationParts.push(`Description: ${c.description}`);
          if (customizationParts.length > 0) datewith_instructions = customizationParts.join(' | ');
        }

        // Ensure datewith_instructions is never null
        if (datewith_instructions === null || datewith_instructions === undefined) {
          datewith_instructions = '';
        }

        const imgs = Array.isArray(item.customization?.imageUrls)
          ? item.customization.imageUrls.filter(Boolean)
          : (item.customization?.imageUrl ? [item.customization.imageUrl] : []);
        const folder = item.customization?.folder || '';
        const priceBreakdown = c.priceBreakdown || null;

        // If we have a price breakdown, append a concise summary into instructions
        if (priceBreakdown) {
          const baseStr = `Base ₹${priceBreakdown.base}`;
          const extrasStr = Array.isArray(priceBreakdown.extras) && priceBreakdown.extras.length > 0
            ? priceBreakdown.extras.map((ex) => {
                const hasLetters = ex.letters !== undefined && ex.letters !== null && ex.letters !== '';
                const lettersPart = hasLetters ? ` (${ex.letters} letters)` : '';
                return `${ex.label}${lettersPart} ₹${ex.cost}`;
              }).join(', ')
            : 'No extras';
          const totalExtrasStr = `Extras Total ₹${priceBreakdown.totalExtras}`;
          const pricingLine = `Pricing: ${baseStr}; ${extrasStr}; ${totalExtrasStr}`;
          datewith_instructions = [datewith_instructions, pricingLine].filter(Boolean).join(' | ');
        }

        return {
          product_name: item.id, // Corresponds to product's primary key
          quantity: item.quantity || 1,
          // Save the first image URL for display in orders (DB unchanged)
          custom_photo_url: (imgs.length > 0 ? imgs[0] : null),
          // Also include all image URLs (backend will ignore if unsupported)
          custom_photo_urls: imgs,
          // Provide the pending folder so backend can move assets and save final folder path
          custom_photo_folder: folder || null,
          datewith_instructions,
          // Include structured price breakdown for server logs/tracing
          price_breakdown: priceBreakdown
        };
      });

      const orderData = {
        customer_name: formData.fullName,
        customer_email: formData.email,
        customer_phone: formData.phone,
        shipping_address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
        cart_items,
        coupon_code: couponCode?.trim() || undefined
      };

      const order = await orderAPI.create(orderData);

      clearCart();
      const nums = order.order_numbers || (order.order_number ? [order.order_number] : []);
      const msg = `Payment successful! Orders ${nums.join(', ')} placed. Ref: ${order.upi_reference_id}`;
      alert(msg);
      navigate('/account');

    } catch (error) {
      console.error('Order creation failed:', error);
      alert(`Order failed: ${error.message}`);
    } finally {
      setIsPlacing(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="payment-page">
        <div className="container">
          <div className="empty-cart">
            <h2>No Items to Checkout</h2>
            <p>Your cart is empty. Please add items before proceeding to payment.</p>
            <button onClick={() => navigate('/')} className="btn btn-primary">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Checkout</h1>
          <p className="page-subtitle">Complete your purchase</p>
        </div>

        <div className="payment-content">
          {/* Order Summary FIRST */}
          <div className="order-summary">
            <div className="summary-card">
              <h2>Order Summary</h2>
              {/* Coupon */}
              <div className="form-group" style={{ marginTop: 8 }}>
                <label htmlFor="coupon" style={{ fontWeight: 600 }}>Coupon Code</label>
                <div style={{ display:'flex', gap:8 }}>
                  <input
                    id="coupon"
                    type="text"
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value); setCouponError(''); }}
                    placeholder="e.g., yash10, satya11, jaya10 or FREESHIP"
                    className="form-input"
                    style={{ flex:1 }}
                    aria-invalid={Boolean(couponError)}
                    aria-describedby={couponError ? 'coupon-error' : undefined}
                  />
                  <button type="button" className="btn btn-outline" onClick={applyCoupon}>
                    {appliedCoupon ? 'Update' : 'Apply'}
                  </button>
                </div>
                {appliedCoupon && (
                  <div style={{ marginTop:4, fontSize:'0.9rem', color:'#2e7d32' }}>
                    Applied: <strong>{appliedCoupon.code}</strong>{appliedCoupon.type === 'percent' ? ` — ${appliedCoupon.value}% off` : ' — Free Shipping'}
                  </div>
                )}
                {couponError && (
                  <div id="coupon-error" className="coupon-error">{couponError}</div>
                )}
              </div>

              <div className="order-items">
                {cartItems.map((item) => (
                  <div key={item.id} className="order-item">
                    <div className="item-details">
                      <h4>{item.name}</h4>
                      <p>{item.category}</p>
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
                                    {(c.frameName1 || c.frameDate1) && (
                                      <div><strong>Person 1:</strong> {[c.frameName1 || 'Not given', c.frameDate1 || 'Not given'].join(' - ')}</div>
                                    )}
                                    {(c.frameName2 || c.frameDate2) && (
                                      <div><strong>Person 2:</strong> {[c.frameName2 || 'Not given', c.frameDate2 || 'Not given'].join(' - ')}</div>
                                    )}
                                    {(c.event || c.frameEvent || c.customEvent) && (
                                      <div><strong>Event:</strong> {c.event || c.frameEvent || c.customEvent}</div>
                                    )}
                                    {(c.frameEventDate || c.specialData) && (
                                      <div><strong>Event Date:</strong> {c.frameEventDate || c.specialData}</div>
                                    )}
                                    {/* Custom frame arrays */}
                                    {Array.isArray(c.customNames) && c.customNames.filter(Boolean).length > 0 && (
                                      <div><strong>Names:</strong> {c.customNames.filter(Boolean).join(', ')}</div>
                                    )}
                                    {Array.isArray(c.customNotes) && c.customNotes.length > 0 && (
                                      <div>
                                        <strong>Notes:</strong>{' '}
                                        {c.customNotes.map((n, i) => {
                                          const d = (n && n.date) ? n.date : '—';
                                          const cur = (n && (n.currency || n.denomination)) ? (n.currency || n.denomination) : '—';
                                          return `${d}-${cur}`;
                                        }).join(', ')}
                                      </div>
                                    )}
                                    {c.frameSetType && <div><strong>Set:</strong> {c.frameSetType}</div>}
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
                                  <img key={idx} src={src} alt={`Img ${idx+1}`} style={{ width: '100%', height: '50px', objectFit: 'cover', borderRadius: '4px', border:'1px solid #eee' }} />
                                ))}
                              </div>
                            )}
                            {c.priceBreakdown && (
                              <div className="price-breakdown" style={{marginTop:'8px', padding:'8px', background:'#f8f9fa', borderRadius:'6px', border:'1px solid #eee'}}>
                                <div style={{fontWeight:600, marginBottom:4}}>Pricing</div>
                                <div>Base: ₹{c.priceBreakdown.base}</div>
                                {Array.isArray(c.priceBreakdown.extras) && c.priceBreakdown.extras.map((ex, i) => (
                                  <div key={i}>
                                    {ex.label}
                                    {ex.letters !== undefined && ex.letters !== null && ex.letters !== '' ? ` (${ex.letters} letters)` : ''}
                                    {`: ₹${ex.cost}`}
                                  </div>
                                ))}
                                <div>Total Extras: ₹{c.priceBreakdown.totalExtras}</div>
                                <div style={{marginTop:4}}><strong>Final Price:</strong> ₹{item.price}</div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="item-price">₹{item.price}</div>
                  </div>
                ))}
              </div>
              
              <hr className="summary-divider" />
              
              <div className="summary-row">
                <span>Subtotal ({cartItems.length} items)</span>
                <span>₹{cartTotals.subtotal}</span>
              </div>
              
              <div className="summary-row">
                <span>Shipping</span>
                <span>
                  {(freeshipBySubtotal || freeshipByCoupon) ? (
                    <>
                      <span style={{ textDecoration: 'line-through', color: '#888' }}>₹{baseShipping || 68}</span>
                      <span style={{ color: '#2e7d32', fontWeight: 600, marginLeft: 6 }}>Free</span>
                    </>
                  ) : (
                    `₹${shippingDisplay}`
                  )}
                </span>
              </div>
              
              {discount > 0 && (
                <div className="summary-row">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span style={{ color: '#2e7d32' }}>-₹{discount}</span>
                </div>
              )}

              <hr className="summary-divider" />
              
              <div className="summary-row total-row">
                <span>Total</span>
                <span>₹{finalTotal}</span>
              </div>
              <div className="summary-note">Estimated delivery in <strong>{maxDeliveryDays}</strong> days</div>
            </div>
          </div>

          {/* Payment form SECOND */}
          <div className="payment-form-section">
            <form onSubmit={handleSubmit} className="payment-form">
              {/* Billing Information */}
              <div className="form-section">
                <h2>Billing Information</h2>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="fullName">Full Name *</label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group full-width">
                    <label htmlFor="address">Address *</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="city">City *</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="state">State *</label>
                    <select
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                      className="form-input"
                    >
                      <option value="">Select State</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="West Bengal">West Bengal</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="pincode">PIN Code *</label>
                    <input
                      type="text"
                      id="pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      required
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="form-section">
                <h2>Payment Method</h2>
                <div className="payment-methods">
                  <label className={`payment-method ${paymentMethod === 'card' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span className="method-icon">💳</span>
                    <span>Credit/Debit Card</span>
                  </label>
                  
                  <label className={`payment-method ${paymentMethod === 'upi' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="upi"
                      checked={paymentMethod === 'upi'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span className="method-icon">📱</span>
                    <span>UPI</span>
                  </label>
                </div>

                {/* Card Payment Form */}
                {paymentMethod === 'card' && (
                  <div className="card-form">
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <label htmlFor="cardNumber">Card Number *</label>
                        <input
                          type="text"
                          id="cardNumber"
                          name="cardNumber"
                          value={formData.cardNumber}
                          onChange={handleChange}
                          placeholder="1234 5678 9012 3456"
                          required
                          className="form-input"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="expiryDate">Expiry Date *</label>
                        <input
                          type="text"
                          id="expiryDate"
                          name="expiryDate"
                          value={formData.expiryDate}
                          onChange={handleChange}
                          placeholder="MM/YY"
                          required
                          className="form-input"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="cvv">CVV *</label>
                        <input
                          type="text"
                          id="cvv"
                          name="cvv"
                          value={formData.cvv}
                          onChange={handleChange}
                          placeholder="123"
                          required
                          className="form-input"
                        />
                      </div>
                      
                      <div className="form-group full-width">
                        <label htmlFor="cardName">Name on Card *</label>
                        <input
                          type="text"
                          id="cardName"
                          name="cardName"
                          value={formData.cardName}
                          onChange={handleChange}
                          required
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* UPI Payment Form */}
                {paymentMethod === 'upi' && (
                  <div className="upi-form">
                    <div className="form-group">
                      <label htmlFor="upiId">UPI ID *</label>
                      <input
                        type="text"
                        id="upiId"
                        name="upiId"
                        value={formData.upiId}
                        onChange={handleChange}
                        placeholder="yourname@paytm"
                        required
                        className="form-input"
                      />
                    </div>
                  </div>
                )}

                
              </div>

              <button type="submit" className="btn btn-primary place-order-btn" disabled={isPlacing} aria-busy={isPlacing}>
                {isPlacing ? 'Placing Order…' : `Place Order - ₹${finalTotal}`}
              </button>
            </form>
          </div>

          {/* Order Summary moved above; removed duplicate block here */}
        </div>
      </div>
    </div>
  );
};

export default Payment;
