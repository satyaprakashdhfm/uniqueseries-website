import axios from 'axios';

// Create axios instance with base configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || (
  process.env.NODE_ENV === 'production'
    ? '/api' // Use relative path instead of hardcoded domain
    : '/api'
);

// Different timeouts for different request types
const TIMEOUTS = {
  DEFAULT: 15000,  // 15 seconds for most operations
  UPLOAD: 60000,   // 60 seconds for uploads
  DOWNLOAD: 30000  // 30 seconds for downloads
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest' // Helps identify AJAX requests
  },
  // Prevent indefinite hanging requests
  timeout: TIMEOUTS.DEFAULT
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
    // Handle canceled requests gracefully
    if (axios.isCancel(error)) {
      console.log('Request canceled:', error.message);
      return Promise.reject(error);
    }
    
    // Handle unauthorized errors (expired token or invalid token)
    if (error.response?.status === 401) {
      // Check if this is a token expiration
      const errorCode = error.response?.data?.code;
      
      if (errorCode === 'token_expired') {
        // Could implement token refresh here
        console.log('Token expired, should refresh');
      }
      
      // Clear auth data and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Only redirect if not already on login page to prevent redirect loops
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?session=expired';
      }
    }
    
    // Enhance error object with additional info for better handling
    if (error.response) {
      error.isServerError = error.response.status >= 500;
      error.isClientError = error.response.status >= 400 && error.response.status < 500;
      error.errorCode = error.response.data?.code;
      error.errorMessage = error.response.data?.message || error.message;
    } else if (error.request) {
      // Request made but no response received (network error)
      error.isNetworkError = true;
      error.errorMessage = 'Network error - please check your connection';
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
