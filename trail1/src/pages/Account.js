import React, { useEffect, useState } from 'react';
import api, { authAPI, orderAPI } from '../services/api';
import './Account.css';

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
      const isHttp = (s) => typeof s === 'string' && /^https?:\/\//i.test(s);
      const tasks = [];
      orders.forEach((ord) => {
        if (!Array.isArray(ord.items)) return;
        ord.items.forEach((it, idx) => {
          const val = it.custom_photo_url;
          if (val && !isHttp(val)) {
            const key = `${ord.order_number}:${idx}`;
            tasks.push(
              api.get('/upload/list', { params: { folder: val } })
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
                    <div className="order-product">{ord.items && ord.items.length > 0 ? `${ord.items.length} item(s)` : 'No items'}</div>
                  </div>
                  <div className="order-meta">
                    <div><strong>Total:</strong> ₹{Number(ord.order_amount || 0).toFixed(2)}</div>
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
                        <div key={idx} className="order-item-line">
                          <span className="item-name">{it.product_name}</span>
                          <span className="item-qty">Qty: {it.quantity}</span>
                          <span className="item-unit">Unit: ₹{Number(it.unit_price || 0).toFixed(2)}</span>
                          <span className="item-subtotal">Subtotal: ₹{(Number(it.unit_price || 0) * Number(it.quantity || 0)).toFixed(2)}</span>
                          {it.price_breakdown && (
                            <div style={{ marginTop: 6, padding: 8, background: '#fafafa', borderRadius: 6, border: '1px solid #eee' }}>
                              <div style={{ fontWeight: 600, marginBottom: 4 }}>Pricing</div>
                              <div>Base: ₹{it.price_breakdown.base}</div>
                              {Array.isArray(it.price_breakdown.extras) && it.price_breakdown.extras.map((ex, i) => {
                                const hasL = typeof ex.letters === 'number' && !isNaN(ex.letters);
                                return (
                                  <div key={i}>{ex.label}{hasL ? `: ${ex.letters} letters` : ''} — ₹{ex.cost}</div>
                                );
                              })}
                              <div>Total Extras: ₹{it.price_breakdown.totalExtras}</div>
                              <div style={{ marginTop: 4 }}><strong>Final Price:</strong> ₹{Number(it.unit_price || 0).toFixed(2)}</div>
                            </div>
                          )}
                          {(() => {
                            const raw = it.datewith_instructions || '';
                            if (!raw) return null;
                            const parts = String(raw).split(' | ').map(s => s.trim()).filter(Boolean);
                            return (
                              <div className="item-instructions" style={{ marginTop: 6, fontSize: '0.9rem', color: '#333' }}>
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
                            const isHttp = (s) => typeof s === 'string' && /^https?:\/\//i.test(s);
                            if (!val) return null;
                            if (isHttp(val)) {
                              return (
                                <img
                                  src={val}
                                  alt="custom"
                                  style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4, marginLeft: 8, cursor: 'pointer', border: '1px solid #eee' }}
                                  onClick={() => setPreviewUrl(val)}
                                />
                              );
                            }
                            const key = `${ord.order_number}:${idx}`;
                            const urls = imagesMap[key] || [];
                            if (urls.length === 0) return null;
                            return (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))', gap: 6, marginLeft: 8 }}>
                                {urls.map((u, i) => (
                                  <img
                                    key={i}
                                    src={u}
                                    alt={`custom ${i+1}`}
                                    style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4, cursor: 'pointer', border: '1px solid #eee' }}
                                    onClick={() => setPreviewUrl(u)}
                                  />
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      ))}
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
