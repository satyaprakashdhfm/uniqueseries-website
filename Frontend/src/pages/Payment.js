import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../services/api';
import api from '../services/api';
import QRCode from 'qrcode.react';
import './Payment.css';

const Payment = () => {
  const { cartItems, cartTotals, clearCart } = useCart();
  const { user } = useAuth();
  const [isPlacing, setIsPlacing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, type: 'percent'|'freeship', value }
  const [couponError, setCouponError] = useState('');
  const [showUpiPayment, setShowUpiPayment] = useState(false);
  const [upiLink, setUpiLink] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [formData, setFormData] = useState({
    // Billing Info (pre-filled from user if available)
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  const navigate = useNavigate();
  const maxDeliveryDays = Math.max(0, ...cartItems.map(i => (i.w_days ?? 5)));

  // Detect if mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /mobile|android|iphone|ipad|phone/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };
    checkMobile();
  }, []);

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

  // Generate UPI deep link
  const generateUpiLink = (merchantVpa, merchantName, amount, refId, description) => {
    const encodedName = encodeURIComponent(merchantName);
    const encodedDesc = encodeURIComponent(description);
    return `upi://pay?pa=${merchantVpa}&pn=${encodedName}&am=${amount}&tr=${refId}&tn=${encodedDesc}&cu=INR`;
  };

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
    
    // Validate required fields
    if (!formData.fullName || !formData.email || !formData.phone || !formData.address || !formData.city || !formData.state || !formData.pincode) {
      alert('Please fill all required fields');
      return;
    }

    setIsPlacing(true);
    try {
      const orderData = {
        customer_name: formData.fullName,
        customer_email: formData.email,
        customer_phone: formData.phone,
        shipping_address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
        coupon_code: couponCode?.trim() || undefined
      };

      const order = await orderAPI.create(orderData);

      // Instead of navigating, show UPI payment UI
      if (order && order.order_number) {
        console.log('✅ Order created:', order);
        console.log('📱 Device is mobile:', isMobile);
        
        // Generate UPI deep link using the merchant VPA
        const upiDeepLink = generateUpiLink(
          'satyaprakashreddy6789-1@oksbi', // Merchant VPA
          'Currency Gift Store',
          Math.round(finalTotal), // Amount
          order.upi_reference_id || ('UPI' + Date.now()),
          `Payment for Order ${order.order_number}`
        );
        
        console.log('🔗 UPI Link generated:', upiDeepLink);
        
        setUpiLink(upiDeepLink);
        setShowUpiPayment(true);
        
        console.log('✅ UPI Payment state updated');
        
        // Clear cart after successful order creation
        clearCart();
        
        // If mobile, open the deep link immediately
        if (isMobile) {
          console.log('📱 Opening UPI link on mobile...');
          setTimeout(() => {
            window.location.href = upiDeepLink;
          }, 500);
        }
      }

    } catch (error) {
      console.error('Order creation failed:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMsg = error.message;
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        errorMsg = error.response.data.errors.map(e => e.msg || e.message || String(e)).join(', ');
      } else if (error.response?.data) {
        errorMsg = JSON.stringify(error.response.data);
      }
      
      console.error('Final error message:', errorMsg);
      alert(`Order failed: ${errorMsg}`);
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

              {/* Payment Method - UPI Only */}
              <div className="form-section">
                <h2>Payment Method</h2>
                <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
                  <span className="method-icon" style={{ fontSize: '2rem' }}>📱</span>
                  <p style={{ margin: '10px 0 0 0', fontSize: '0.9rem', color: '#666' }}>
                    Pay with UPI using Google Pay, PhonePe, or any UPI app
                  </p>
                </div>
              </div>

              <button type="submit" className="btn btn-primary place-order-btn" disabled={isPlacing} aria-busy={isPlacing}>
                {isPlacing ? 'Placing Order…' : `Pay with UPI - ₹${finalTotal}`}
              </button>
            </form>

            {/* UPI Payment Display */}
            {showUpiPayment && (
              <div style={{ marginTop: '40px', padding: '30px', background: '#fff', border: '2px solid #007bff', borderRadius: '8px', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '15px', color: '#007bff' }}>💳 Payment Required</h2>
                
                {!isMobile && upiLink && (
                  <>
                    <h3 style={{ marginBottom: '15px' }}>Scan QR Code to Pay</h3>
                    <p style={{ marginBottom: '20px', color: '#666', fontSize: '0.95rem' }}>
                      Scan this QR code with Google Pay, PhonePe, or any UPI app on your phone to complete payment
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
                      <div>
                        <QRCode 
                          value={upiLink} 
                          size={300}
                          level="H"
                          includeMargin={true}
                          fgColor="#000000"
                          bgColor="#ffffff"
                        />
                        <p style={{ marginTop: '10px', fontSize: '0.85rem', color: '#999' }}>
                          Amount: ₹{finalTotal}
                        </p>
                      </div>
                    </div>
                    <div style={{ padding: '15px', background: '#e7f3ff', borderRadius: '6px', marginBottom: '20px' }}>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#0066cc' }}>
                        ℹ️ After payment is confirmed, your order will be saved in your account.
                      </p>
                    </div>
                    <button 
                      onClick={() => navigate('/account')}
                      style={{
                        padding: '12px 24px',
                        background: '#28a745',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.95rem'
                      }}
                    >
                      View Order History
                    </button>
                  </>
                )}
                
                {isMobile && upiLink && (
                  <>
                    <h3 style={{ marginBottom: '15px' }}>Tap to Open UPI App</h3>
                    <p style={{ marginBottom: '20px', color: '#666', fontSize: '0.95rem' }}>
                      Tap the button below to open your UPI payment app
                    </p>
                    <a 
                      href={upiLink}
                      style={{
                        display: 'inline-block',
                        padding: '15px 40px',
                        background: '#007bff',
                        color: '#fff',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: '1rem',
                        marginBottom: '20px'
                      }}
                    >
                      📱 Open Payment App
                    </a>
                    <div style={{ padding: '15px', background: '#e7f3ff', borderRadius: '6px', marginBottom: '20px' }}>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#0066cc' }}>
                        ℹ️ Amount to pay: ₹{finalTotal}
                      </p>
                      <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#0066cc' }}>
                        Your order will be confirmed after successful payment.
                      </p>
                    </div>
                    <button 
                      onClick={() => navigate('/account')}
                      style={{
                        padding: '12px 24px',
                        background: '#28a745',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.95rem'
                      }}
                    >
                      View Order History
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Order Summary moved above; removed duplicate block here */}
        </div>
      </div>
    </div>
  );
};

export default Payment;
