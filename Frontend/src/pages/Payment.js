import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../services/api';
import api from '../services/api';
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

  const [imagesMap, setImagesMap] = useState({}); // key: item.id -> urls

  const isHttp = (s) => typeof s === 'string' && /^https?:\/\//i.test(s);

  // Fetch folder images for cart items
  useEffect(() => {
    const fetchImgs = async () => {
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
      const res = await Promise.all(tasks);
      setImagesMap((prev) => {
        const next = { ...prev };
        res.forEach(({ key, urls }) => { next[key] = urls; });
        return next;
      });
    };
    fetchImgs();
  }, [cartItems]);

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
    const validPercentCodes = ['yash10', 'satya11', 'jaya10', 'festive20'];

    if (codeUpper === 'SAVE10') {
      setAppliedCoupon({ code: codeUpper, type: 'percent', value: 10 });
      setCouponError('');
    } else if (codeUpper === 'FREESHIP') {
      setAppliedCoupon({ code: codeUpper, type: 'freeship', value: 0 });
      setCouponError('');
    } else if (codeUpper === 'FESTIVE20') {
      setAppliedCoupon({ code: codeUpper, type: 'percent', value: 20 });
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
        const priceBreakdown = item.priceBreakdown || item.customization?.priceBreakdown;

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
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    id="coupon"
                    type="text"
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value); setCouponError(''); }}
                    placeholder=""
                    className="form-input"
                    style={{ flex: 1 }}
                    aria-invalid={Boolean(couponError)}
                    aria-describedby={couponError ? 'coupon-error' : undefined}
                  />
                  <button type="button" className="btn btn-outline" onClick={applyCoupon}>
                    {appliedCoupon ? 'Update' : 'Apply'}
                  </button>
                </div>
                {appliedCoupon && (
                  <div style={{ marginTop: 4, fontSize: '0.9rem', color: '#2e7d32' }}>
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
                        const rawInstr = item.datewith_instructions || '';
                        const folderOrUrl = item.custom_photo_url;
                        const parts = rawInstr ? rawInstr.split(' | ').map(p => p.trim()).filter(Boolean) : [];

                        const folderImgs = imagesMap[item.id] || [];
                        const directImgs = (folderOrUrl && isHttp(folderOrUrl)) ? [folderOrUrl] : [];
                        const allImgs = [...directImgs, ...folderImgs];

                        const price = item.priceBreakdown || item.customization?.priceBreakdown;

                        if (parts.length === 0 && allImgs.length === 0 && !price) return null;

                        return (
                          <div style={{ marginTop: '6px', fontSize: '0.9rem', color: '#333' }}>
                            {parts.length > 0 && (
                              <>
                                <strong>Details:</strong>
                                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                                  {parts.map((p, i) => (<li key={i} style={{ listStyle: 'disc' }}>{p}</li>))}
                                </ul>
                              </>
                            )}

                            {allImgs.length > 0 && (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(50px,1fr))', gap: 6, marginTop: 6 }}>
                                {allImgs.map((src, idx) => (
                                  <img key={idx} src={src} alt={`img-${idx}`} style={{ width: '100%', height: 50, objectFit: 'cover', borderRadius: 4, border: '1px solid #eee' }} />
                                ))}
                              </div>
                            )}

                            {price && (
                              <div style={{ marginTop: '8px', padding: '8px', background: '#f8f9fa', borderRadius: '6px', border: '1px solid #eee' }}>
                                <div style={{ fontWeight: 600, marginBottom: 4 }}>Pricing</div>
                                <div>Base: ₹{price.base}</div>
                                {Array.isArray(price.extras) && price.extras.map((ex, i) => {
                                  const hasL = typeof ex.letters === 'number' && !isNaN(ex.letters);
                                  return <div key={i}>{ex.label}{hasL ? `: ${ex.letters} letters` : ''} — ₹{ex.cost}</div>;
                                })}
                                <div>Total Extras: ₹{price.totalExtras}</div>
                                <div style={{ marginTop: 4 }}><strong>Final Price:</strong> ₹{item.price}</div>
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
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                      <option value="Assam">Assam</option>
                      <option value="Bihar">Bihar</option>
                      <option value="Chhattisgarh">Chhattisgarh</option>
                      <option value="Goa">Goa</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Haryana">Haryana</option>
                      <option value="Himachal Pradesh">Himachal Pradesh</option>
                      <option value="Jharkhand">Jharkhand</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Kerala">Kerala</option>
                      <option value="Madhya Pradesh">Madhya Pradesh</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Manipur">Manipur</option>
                      <option value="Meghalaya">Meghalaya</option>
                      <option value="Mizoram">Mizoram</option>
                      <option value="Nagaland">Nagaland</option>
                      <option value="Odisha">Odisha</option>
                      <option value="Punjab">Punjab</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="Sikkim">Sikkim</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Telangana">Telangana</option>
                      <option value="Tripura">Tripura</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="Uttarakhand">Uttarakhand</option>
                      <option value="West Bengal">West Bengal</option>
                      <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                      <option value="Chandigarh">Chandigarh</option>
                      <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                      <option value="Ladakh">Ladakh</option>
                      <option value="Lakshadweep">Lakshadweep</option>
                      <option value="Puducherry">Puducherry</option>
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
