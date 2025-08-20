import React from 'react';
import { useNavigate } from 'react-router-dom';
import api, { adminOrdersAPI } from '../../services/api';

// Helpers copied to mirror Account page logic
const isHttp = (s) => typeof s === 'string' && /^https?:\/\//i.test(s);
const isCloudinaryFolderUrl = (u) => isHttp(u) && /\/image\/upload\//.test(u) && /\/$/.test(u);
const folderFromCloudinaryUrl = (u) => {
  const m = u.match(/image\/upload\/(.*)$/);
  return m ? m[1] : '';
};

const AdminDashboard = () => {
  const nav = useNavigate();
  const [orders, setOrders] = React.useState([]);
  const [count, setCount] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(20);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [expanded, setExpanded] = React.useState({}); // order_number -> bool
  const [details, setDetails] = React.useState({}); // order_number -> detail payload
  const [imagesMap, setImagesMap] = React.useState({}); // `${order}:${idx}` -> [urls]

  const load = React.useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await adminOrdersAPI.list({ page, limit, search, status, sort: 'created_at:desc' });
      setOrders(res?.rows || []);
      setCount(res?.count || 0);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load orders');
    } finally { setLoading(false); }
  }, [page, limit, search, status]);

  React.useEffect(() => { load(); }, [load]);

  const logout = () => { localStorage.removeItem('adminToken'); nav('/admin/login', { replace: true }); };
  const totalPages = Math.max(1, Math.ceil(count / limit));

  const statusBadge = (ord) => {
    const st = (ord.order_status || ord.status || '').toLowerCase();
    const map = {
      pending: 'badge--status--pending',
      confirmed: 'badge--status--confirmed',
      shipped: 'badge--status--shipped',
      delivered: 'badge--status--delivered',
      cancelled: 'badge--status--cancelled'
    };
    const cls = map[st] || '';
    const label = ord.order_status || ord.status || '—';
    return <span className={`badge ${cls}`}>{label}</span>;
  };

  const paymentBadge = (ord) => {
    const pay = (ord.payment_status || ord.payment?.payment_status || '').toLowerCase();
    const map = {
      completed: 'badge--payment--completed',
      success: 'badge--payment--completed',
      paid: 'badge--payment--completed',
      pending: 'badge--payment--pending',
      failed: 'badge--payment--failed'
    };
    const cls = map[pay] || 'badge--payment--pending';
    const label = ord.payment_status || ord.payment?.payment_status || 'Pending';
    return <span className={`badge ${cls}`}>{label}</span>;
  };

  const fetchFolderImagesFor = async (orderNumber, items) => {
    const tasks = [];
    items.forEach((it, idx) => {
      const val = it.custom_photo_url;
      if (!val) return;
      let folder = '';
      if (!isHttp(val)) folder = val; else if (isCloudinaryFolderUrl(val)) folder = folderFromCloudinaryUrl(val);
      if (folder) {
        const key = `${orderNumber}:${idx}`;
        tasks.push(
          api.get('/upload/list', { params: { folder } })
            .then((resp) => ({ key, urls: (resp.data?.images || []).map((x) => x.imageUrl).filter(Boolean) }))
            .catch(() => ({ key, urls: [] }))
        );
      }
    });
    if (tasks.length === 0) return;
    const results = await Promise.all(tasks);
    setImagesMap((prev) => {
      const next = { ...prev }; results.forEach(({ key, urls }) => { next[key] = urls; }); return next;
    });
  };

  const toggleExpand = async (orderNumber) => {
    setExpanded((prev) => ({ ...prev, [orderNumber]: !prev[orderNumber] }));
    if (!details[orderNumber]) {
      try {
        const d = await adminOrdersAPI.detail(orderNumber);
        setDetails((prev) => ({ ...prev, [orderNumber]: d }));
        if (Array.isArray(d.items)) await fetchFolderImagesFor(orderNumber, d.items);
      } catch (e) {
        // swallow detail error to avoid breaking list
      }
    }
  };

  return (
    <div className="admin-page container">
      <div className="admin-header">
        <h2 className="admin-title">Admin Dashboard</h2>
        <button className="btn btn-outline" onClick={logout}>Logout</button>
      </div>

      <div className="admin-toolbar card">
        <input className="input" placeholder="Search email/order#" value={search} onChange={(e)=>setSearch(e.target.value)} />
        <select className="select" value={status} onChange={(e)=>setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button className="btn btn-secondary" onClick={()=>{ setPage(1); load(); }}>Apply</button>
      </div>

      {loading ? <div className="admin-loading">Loading…</div> : error ? <div className="admin-error">{error}</div> : (
        <div className="admin-card card">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Created</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Coupon</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const d = details[o.order_number];
                  const isOpen = !!expanded[o.order_number];
                  return (
                    <React.Fragment key={o.order_number}>
                      <tr>
                        <td>#{o.order_number}</td>
                        <td>{o.created_at ? new Date(o.created_at).toLocaleString() : ''}</td>
                        <td>
                          {o.customer_name}
                          <div className="subtle-text">{o.customer_email}</div>
                        </td>
                        <td>{o.items?.length ?? o.itemsCount ?? 0}</td>
                        <td>₹{Number(o.total_amount||0).toFixed(2)}</td>
                        <td>{paymentBadge(o)}</td>
                        <td>{statusBadge(o)}</td>
                        <td>{o.coupon_code ? `${o.coupon_code} (−₹${Number(o.discount_amount||0).toFixed(2)})` : '—'}</td>
                        <td>
                          <button className="btn btn-outline btn-small" onClick={()=>toggleExpand(o.order_number)}>
                            {isOpen ? 'Hide' : 'View'}
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="admin-expand-row">
                          <td colSpan={9}>
                            {!d ? (
                              <div className="admin-loading">Loading details…</div>
                            ) : (
                              <div className="admin-expand">
                                <div className="admin-expand-meta">
                                  <div><strong>Phone:</strong> {d.customer_phone || '—'}</div>
                                  <div><strong>Shipping:</strong> {d.shipping_address || '—'}</div>
                                </div>
                                {Array.isArray(d.items) && d.items.length > 0 && (
                                  <div className="admin-item-list">
                                    {d.items.map((it, idx) => {
                                      const raw = it.datewith_instructions || '';
                                      const parts = String(raw).split(' | ').map(s => s.trim()).filter(Boolean);
                                      const val = it.custom_photo_url;
                                      let directImgs = [];
                                      let folderKey = '';
                                      if (val) {
                                        if (!isHttp(val)) folderKey = `${d.order_number}:${idx}`;
                                        else if (isCloudinaryFolderUrl(val)) folderKey = `${d.order_number}:${idx}`;
                                        else directImgs = [val];
                                      }
                                      const imgsFromFolder = folderKey ? (imagesMap[folderKey] || []) : [];
                                      const allImgs = [...directImgs, ...imgsFromFolder];
                                      return (
                                        <div key={idx} className="admin-item-line">
                                          <span className="name">{it.product_name}</span>
                                          <span className="qty">Qty: {it.quantity}</span>
                                          <span className="unit">Unit: ₹{Number(it.unit_price || 0).toFixed(2)}</span>
                                          <span className="subtotal">Subtotal: ₹{(Number(it.unit_price || 0) * Number(it.quantity || 0)).toFixed(2)}</span>
                                          {parts.length > 0 && (
                                            <div className="details-box">
                                              <strong>Details:</strong>
                                              <ul>
                                                {parts.map((p, i) => (<li key={i}>{p}</li>))}
                                              </ul>
                                            </div>
                                          )}
                                          {allImgs.length > 0 && (
                                            allImgs.length === 1 ? (
                                              <img src={allImgs[0]} alt="custom" className="thumb" />
                                            ) : (
                                              <div className="images-grid">
                                                {allImgs.map((u,i)=> (<img key={i} src={u} alt={`custom ${i+1}`} />))}
                                              </div>
                                            )
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                {/* Price Summary */}
                                {(() => {
                                  const items = Array.isArray(d.items) ? d.items : [];
                                  const itemsSubtotal = items.reduce((sum, it) => sum + (Number(it.unit_price || 0) * Number(it.quantity || 0)), 0);
                                  const extrasTotal = items.reduce((sum, it) => sum + (Number(it.price_breakdown?.totalExtras || 0) * Number(it.quantity || 0)), 0);
                                  const baseSubtotal = Math.max(0, itemsSubtotal - extrasTotal);
                                  const discount = Number(d.discount_amount || 0);
                                  const total = Number(d.total_amount || 0);
                                  const shippingRaw = total - (itemsSubtotal - discount);
                                  const shipping = shippingRaw > 0 ? Number(shippingRaw.toFixed(2)) : 0;
                                  return (
                                    <div className="pricing-box">
                                      <div className="row"><span>Items (Base)</span><span>₹{baseSubtotal.toFixed(2)}</span></div>
                                      <div className="row"><span>Extras</span><span>₹{extrasTotal.toFixed(2)}</span></div>
                                      {discount > 0 && (<div className="row save"><span>Coupon{d.coupon_code ? ` (${d.coupon_code})` : ''}</span><span>-₹{discount.toFixed(2)}</span></div>)}
                                      {shipping > 0 && (<div className="row"><span>Shipping</span><span>₹{shipping.toFixed(2)}</span></div>)}
                                      <div className="row total"><span>Total Paid</span><span>₹{total.toFixed(2)}</span></div>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="admin-pagination">
            <div>Showing page {page} of {totalPages} ({count} orders)</div>
            <div className="actions">
              <button className="btn btn-outline btn-small" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
              <button className="btn btn-outline btn-small" disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
