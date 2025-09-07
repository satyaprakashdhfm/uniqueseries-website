import React from 'react';
import api, { adminOrdersAPI } from '../services/api';

// Helpers copied to mirror Account page logic
const isHttp = (s) => typeof s === 'string' && /^https?:\/\//i.test(s);
const isCloudinaryFolderUrl = (u) => isHttp(u) && /\/image\/upload\//.test(u) && /\/$/.test(u);
const folderFromCloudinaryUrl = (u) => {
  const m = u.match(/image\/upload\/(.*)$/);
  return m ? m[1] : '';
};

const OrdersTab = () => {
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
    return map[st] || 'badge--status--unknown';
  };

  const formatPrice = (p) => `₹${p || 0}`;

  const toggleExpand = async (orderNumber) => {
    const isExp = !!expanded[orderNumber];
    setExpanded(prev => ({ ...prev, [orderNumber]: !isExp }));
    if (!isExp && !details[orderNumber]) {
      await fetchDetail(orderNumber);
    }
  };

  const fetchDetail = async (orderNumber) => {
    try {
      const d = await adminOrdersAPI.detail(orderNumber);
      setDetails(prev => ({ ...prev, [orderNumber]: d }));
      if (Array.isArray(d.items)) await fetchFolderImagesFor(orderNumber, d.items);
    } catch (e) {
      // swallow detail error to avoid breaking list
      console.error('Error fetching order details:', e);
    }
  };

  const fetchFolderImagesFor = async (orderNumber, items) => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const url = item.custom_photo_url;
      if (url) {
        let folder = '';
        // Check if it's a folder path (not a direct HTTP URL)
        if (!isHttp(url)) {
          folder = url;
        } else if (isCloudinaryFolderUrl(url)) {
          folder = folderFromCloudinaryUrl(url);
        }
        
        if (folder) {
          try {
            const imgs = await api.get('/upload/list', { params: { folder } });
            const key = `${orderNumber}:${i}`;
            setImagesMap(prev => ({ ...prev, [key]: imgs.data?.images?.map(x => x.imageUrl).filter(Boolean) || [] }));
          } catch (e) {
            console.warn('failed to load folder images for folder:', folder, e);
          }
        }
      }
    }
  };

  return (
    <div className="orders-tab" style={{ padding: '20px' }}>
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
                  <th>Order#</th>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <React.Fragment key={o.order_number}>
                    <tr className="admin-table-row">
                      <td className="admin-table-cell"><strong>{o.order_number}</strong></td>
                      <td className="admin-table-cell">{o.customer_name}</td>
                      <td className="admin-table-cell">{o.customer_email}</td>
                      <td className="admin-table-cell">{o.customer_phone}</td>
                      <td className="admin-table-cell">{formatPrice(o.total_amount)}</td>
                      <td className="admin-table-cell">
                        <span className={`badge ${statusBadge(o)}`}>
                          {(o.order_status || o.status || 'unknown').toUpperCase()}
                        </span>
                      </td>
                      <td className="admin-table-cell">{new Date(o.created_at).toLocaleDateString()}</td>
                      <td className="admin-table-cell">
                        <div className="admin-actions">
                          <button className="btn btn-outline btn-small" onClick={()=>toggleExpand(o.order_number)}>
                            {expanded[o.order_number] ? 'Hide' : 'View'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expanded[o.order_number] && details[o.order_number] && (
                      <tr className="admin-detail-row">
                        <td colSpan="8" className="admin-detail-cell">
                          <div className="admin-order-detail">
                            <div className="admin-detail-grid">
                              <div className="admin-detail-section">
                                <h4>Customer Info</h4>
                                <p><strong>Name:</strong> {details[o.order_number].customer_name}</p>
                                <p><strong>Email:</strong> {details[o.order_number].customer_email}</p>
                                <p><strong>Phone:</strong> {details[o.order_number].customer_phone}</p>
                                <p><strong>Address:</strong> {details[o.order_number].shipping_address}</p>
                              </div>
                              <div className="admin-detail-section">
                                <h4>Order Info</h4>
                                <p><strong>Order #:</strong> {details[o.order_number].order_number}</p>
                                <p><strong>Total:</strong> {formatPrice(details[o.order_number].total_amount)}</p>
                                <p><strong>Status:</strong> {details[o.order_number].order_status}</p>
                                <p><strong>Payment ID:</strong> {details[o.order_number].payment_id}</p>
                                <p><strong>Created:</strong> {new Date(details[o.order_number].created_at).toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="admin-detail-section">
                              <h4>Items</h4>
                              <div className="admin-items-grid">
                                {(details[o.order_number].items || []).map((item, idx) => (
                                  <div key={idx} className="admin-item-card">
                                    <h5>{item.product_name}</h5>
                                    <p><strong>Quantity:</strong> {item.quantity}</p>
                                    <p><strong>Unit Price:</strong> {formatPrice(item.unit_price)}</p>
                                    <p><strong>Total:</strong> {formatPrice(item.total_price)}</p>
                                    {item.datewith_instructions && (
                                      <p><strong>Instructions:</strong> {item.datewith_instructions}</p>
                                    )}
                                    {item.custom_photo_url && (
                                      <div className="admin-custom-photos">
                                        <p><strong>Custom Photos:</strong></p>
                                        {(() => {
                                          const val = item.custom_photo_url;
                                          let directImgs = [];
                                          let folderKey = '';
                                          
                                          if (!isHttp(val)) {
                                            // It's a folder path like "currency-gift/users/..."
                                            folderKey = `${o.order_number}:${idx}`;
                                          } else if (isCloudinaryFolderUrl(val)) {
                                            // It's a Cloudinary folder URL
                                            folderKey = `${o.order_number}:${idx}`;
                                          } else {
                                            // It's a direct image URL
                                            directImgs = [val];
                                          }
                                          
                                          const imgsFromFolder = folderKey ? (imagesMap[folderKey] || []) : [];
                                          const allImgs = [...directImgs, ...imgsFromFolder];
                                          
                                          if (allImgs.length === 0) return null;
                                          
                                          return (
                                            <div className="admin-photo-grid">
                                              {allImgs.map((imgUrl, imgIdx) => (
                                                <img key={imgIdx} src={imgUrl} alt={`Custom ${imgIdx+1}`} className="admin-custom-photo" />
                                              ))}
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {count > limit && (
            <div className="admin-pagination">
              <span>Page {page} of {totalPages} ({count} total)</span>
              <button className="btn btn-outline btn-small" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
              <button className="btn btn-outline btn-small" disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrdersTab;
