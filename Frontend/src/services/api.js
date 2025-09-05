import axios from 'axios';

// Create axios instance with base configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || (
  process.env.NODE_ENV === 'production'
    ? 'https://your-production-domain.com/api'
    : '/api'
);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // Prevent indefinite hanging requests
  timeout: 30000
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Admin axios instance (separate token & redirects)
const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000
});

// Admin auth axios instance (for login/register - no token required)
const adminAuthApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000
});

adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

adminApi.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.put('/auth/profile', userData);
    return response.data;
  }
};

// Product API calls
export const productAPI = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const response = await api.get(`/products?${params}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  getByType: async (type) => {
    const response = await api.get(`/products/type/${type}`);
    return response.data;
  }
};

// Cart API calls
export const cartAPI = {
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },
  addToCart: async (item) => {
    const response = await api.post('/cart', item);
    return response.data;
  },
  updateCartItem: async (id, quantity) => {
    const response = await api.put(`/cart/${id}`, { quantity });
    return response.data;
  },
  removeFromCart: async (id) => {
    const response = await api.delete(`/cart/${id}`);
    return response.data;
  },
  clearCart: async () => {
    const response = await api.delete('/cart');
    return response.data;
  }
};

// Order API calls
export const orderAPI = {
  create: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  getUserOrders: async () => {
    const response = await api.get('/orders/user');
    return response.data;
  },

  getPaymentDetails: async (orderNumber) => {
    const response = await api.get(`/orders/${orderNumber}/payment`);
    return response.data;
  },

  verifyPayment: async (paymentData) => {
    const response = await api.post('/orders/verify-payment', paymentData);
    return response.data;
  }
};

// Review API calls
export const reviewAPI = {
  listByProduct: async (productName) => {
    const res = await api.get(`/reviews/product/${productName}`);
    return res.data;
  },
  listByUser: async () => {
    const res = await api.get('/reviews/user');
    return res.data;
  },
  create: async (payload) => {
    const res = await api.post('/reviews', payload);
    return res.data;
  },
  update: async (id, payload) => {
    const res = await api.put(`/reviews/${id}`, payload);
    return res.data;
  },
  remove: async (id) => {
    const res = await api.delete(`/reviews/${id}`);
    return res.data;
  }
};

// Wishlist API calls
export const wishlistAPI = {
  get: async () => {
    const res = await api.get('/wishlist');
    return res.data;
  },
  add: async (productName) => {
    const res = await api.post('/wishlist', { productName });
    return res.data;
  },
  remove: async (productName) => {
    const res = await api.delete(`/wishlist/${productName}`);
    return res.data;
  }
};

// Contact Support API
export const contactAPI = {
  create: async (payload) => {
    const res = await api.post('/contact', payload);
    return res.data;
  },
  getUserTickets: async () => {
    const res = await api.get('/contact/user');
    return res.data;
  }
};

// Admin API (auth only)
export const adminAPI = {
  login: async (email, password) => {
    // Use adminAuthApi for login (no token needed, no redirect on 401)
    const res = await adminAuthApi.post('/admin/login', { email, password });
    return res.data;
  },
  register: async (email, name, password) => {
    // Use adminAuthApi for registration (no token needed, no redirect on 401)
    const res = await adminAuthApi.post('/admin/register', { email, name, password });
    return res.data;
  }
};

// Admin Orders/Reports API (protected)
export const adminOrdersAPI = {
  list: async ({ page = 1, limit = 20, from, to, status, search, sort = 'created_at:desc' } = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    if (sort) params.append('sort', sort);
    const res = await adminApi.get(`/admin/orders?${params.toString()}`);
    return res.data; // { rows, count }
  },
  detail: async (orderNumber) => {
    const res = await adminApi.get(`/admin/orders/${orderNumber}`);
    return res.data;
  },
  summary: async ({ period = 'today', from, to } = {}) => {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const res = await adminApi.get(`/admin/summary?${params.toString()}`);
    return res.data;
  }
};

export default api;
