import React, { useEffect, useState } from 'react';
import api, { authAPI, orderAPI } from '../services/api';
import './Account.css';

// Helper utils (component-level scope so ESLint sees them everywhere)
const isHttp = (s) => typeof s === 'string' && /^https?:\/\//i.test(s);
const isCloudinaryFolderUrl = (u) => isHttp(u) && /\/image\/upload\//.test(u) && /\/$/.test(u);
const folderFromCloudinaryUrl = (u) => {
  const m = u.match(/image\/upload\/(.*)$/);
  return m ? m[1] : '';
};

const Account = () => {
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imagesMap, setImagesMap] = useState({}); // key: `${order_number}:${itemIndex}` -> [urls]

  useEffect(() => {
    const load = async () => {
      try {
        const [p, o] = await Promise.all([
          authAPI.getProfile(),
          orderAPI.getUserOrders()
        ]);
        setProfile(p);
        setOrders(o || []);
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load account');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // When orders load, fetch images for any items whose custom_photo_url is a folder path
  useEffect(() => {
    const fetchFolderImages = async () => {
      if (!Array.isArray(orders) || orders.length === 0) return;
      const tasks = [];
      orders.forEach((ord) => {
        if (!Array.isArray(ord.items)) return;
        ord.items.forEach((it, idx) => {
          const val = it.custom_photo_url;
          if (!val) return;
          let folder = '';
          if (!isHttp(val)) {
            folder = val;
          } else if (isCloudinaryFolderUrl(val)) {
            folder = folderFromCloudinaryUrl(val);
          }
          if (folder) {
            const key = `${ord.order_number}:${idx}`;
            tasks.push(
              api.get('/upload/list', { params: { folder } })
                .then((resp) => ({ key, urls: (resp.data?.images || []).map((x) => x.imageUrl).filter(Boolean) }))
                .catch(() => ({ key, urls: [] }))
            );
          }
        });
      });
      if (tasks.length === 0) return;
      const results = await Promise.all(tasks);
      setImagesMap((prev) => {
        const next = { ...prev };
        results.forEach(({ key, urls }) => { next[key] = urls; });
        return next;
      });
    };
    fetchFolderImages();
  }, [orders]);

  if (loading) return <div className="account-page"><div className="account-card">Loading...</div></div>;
  if (error) return <div className="account-page"><div className="account-card error">{error}</div></div>;

  return (
    <div className="account-page">
      <div className="account-grid">
        <div className="account-card">
          <h2>Your Profile</h2>
          {profile ? (
            <div className="profile-info">
              <div><strong>Name:</strong> {profile.name}</div>
              <div><strong>Email:</strong> {profile.email}</div>
              {profile.phone && <div><strong>Phone:</strong> {profile.phone}</div>}
              {profile.address && <div><strong>Address:</strong> {profile.address}</div>}
              {(() => {
                const created = profile.createdAt || profile.created_at;
                return created ? (
                  <div><strong>Joined:</strong> {new Date(created).toLocaleString()}</div>
                ) : null;
              })()}
              {(() => {
                const updated = profile.updatedAt || profile.updated_at;
                return updated ? (
                  <div><strong>Last Updated:</strong> {new Date(updated).toLocaleString()}</div>
                ) : null;
              })()}
            </div>
          ) : (
            <div>No profile data</div>
          )}
        </div>

        <div className="account-card">
          <h2>Your Orders</h2>
          {orders.length === 0 ? (
            <div>No orders yet</div>
          ) : (
            <div className="orders-list">
              {orders.map((ord) => (
                <div className="order-row" key={ord.order_number}>
                  <div className="order-main">
                    <div className="order-id">#{ord.order_number}</div>
                    <div className="order-product">{ord.items?.length ?? 0} item(s)</div>
                  </div>
                  <div className="order-meta">
                    <div><strong>Total:</strong> ₹{Number(ord.total_amount || ord.order_amount || 0).toFixed(2)}</div>
                    {(() => {
                      const status = (ord.payment_status || ord.status || '').toLowerCase();
                      const cls = status === 'completed' ? 'status-badge status-completed' : status === 'pending' ? 'status-badge status-pending' : status === 'failed' ? 'status-badge status-failed' : 'status-badge';
                      const label = ord.payment_status || ord.status || '—';
                      return <span className={cls}>{label}</span>;
                    })()}
                  </div>
                  <div className="order-time">{ord.created_at ? new Date(ord.created_at).toLocaleString() : ''}</div>

                  {/* Items list */}
                  {Array.isArray(ord.items) && ord.items.length > 0 && (
                    <div className="order-items">
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="order-item-line" style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.7fr 1fr 1fr', gap: 10, padding: '10px 12px', alignItems: 'center', border: '1px dashed var(--border)' }}>
                          <span className="item-name">{it.product_name}</span>
                          <span className="item-qty">Qty: {it.quantity}</span>
                          <span className="item-unit">Unit: ₹{Number(it.unit_price || 0).toFixed(2)}</span>
                          <span className="item-subtotal">Subtotal: ₹{(Number(it.unit_price || 0) * Number(it.quantity || 0)).toFixed(2)}</span>
                          {(() => {
                            const raw = it.datewith_instructions || '';
                            if (!raw) return null;
                            const parts = String(raw).split(' | ').map(s => s.trim()).filter(Boolean);
                            return (
                              <div className="item-instructions details-box" style={{ marginTop: 6, fontSize: '0.9rem', color: '#333', background: '#f9fafb', borderRadius: 8, padding: '8px 12px' }}>
                                <strong>Details:</strong>
                                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                                  {parts.map((p, i) => (
                                    <li key={i} style={{ listStyle: 'disc' }}>{p}</li>
                                  ))}
                                </ul>
                              </div>
                            );
                          })()}
                          {(() => {
                            const val = it.custom_photo_url;
                            if (!val) return null;
                            let directImgs = [];
                            let folderKey = '';
                            if (!isHttp(val)) {
                              folderKey = `${ord.order_number}:${idx}`;
                            } else if (isCloudinaryFolderUrl(val)) {
                              folderKey = `${ord.order_number}:${idx}`;
                            } else {
                              directImgs = [val];
                            }
                            const imgsFromFolder = folderKey ? (imagesMap[folderKey] || []) : [];
                            const allImgs = [...directImgs, ...imgsFromFolder];
                            if (allImgs.length === 0) return null;
                            if (allImgs.length === 1) {
                              const first = allImgs[0];
                              return (
                                <img
                                  src={first}
                                  alt="custom"
                                  style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4, marginLeft: 8, cursor: 'pointer', border: '1px solid #eee' }}
                                  onClick={() => setPreviewUrl(first)}
                                />
                              );
                            }
                            // multiple
                            return (
                              <div className="images-grid" style={{ marginLeft: 8 }}>
                                {allImgs.map((u, i) => (
                                  <img key={i} src={u} alt={`custom ${i+1}`} onClick={() => setPreviewUrl(u)} />
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      ))}

                      {/* Price Summary: all pricing in one place (Base, Extras, Coupon, Shipping, Total) */}
                      {(() => {
                        const items = Array.isArray(ord.items) ? ord.items : [];
                        const itemsSubtotal = items.reduce((sum, it) => sum + (Number(it.unit_price || 0) * Number(it.quantity || 0)), 0);
                        const extrasTotal = items.reduce((sum, it) => sum + (Number(it.price_breakdown?.totalExtras || 0) * Number(it.quantity || 0)), 0);
                        const baseSubtotal = Math.max(0, itemsSubtotal - extrasTotal);
                        const discount = Number(ord.discount_amount || 0);
                        const total = Number(ord.total_amount || 0);
                        const shippingRaw = total - (itemsSubtotal - discount);
                        const shipping = shippingRaw > 0 ? Number(shippingRaw.toFixed(2)) : 0;
                        return (
                          <div className="order-price-breakup" style={{ marginTop: 12, background: '#ffffff', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>Price Summary</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Items (Base)</span>
                              <span>₹{baseSubtotal.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Extras</span>
                              <span>₹{extrasTotal.toFixed(2)}</span>
                            </div>
                            {discount > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0b6b0b' }}>
                                <span>Coupon Applied{ord.coupon_code ? ` (${ord.coupon_code})` : ''}</span>
                                <span>-₹{discount.toFixed(2)}</span>
                              </div>
                            )}
                            {shipping > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Shipping</span>
                                <span>₹{shipping.toFixed(2)}</span>
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontWeight: 600 }}>
                              <span>Total Paid</span>
                              <span>₹{total.toFixed(2)}</span>
                            </div>
                            {discount > 0 && (
                              <div style={{ marginTop: 4, fontSize: 12, color: '#0b6b0b' }}>You saved ₹{discount.toFixed(2)}{ord.coupon_code ? ` with ${ord.coupon_code}` : ''}</div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewUrl && (
        <div
          onClick={() => setPreviewUrl(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}
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

export default Account;
