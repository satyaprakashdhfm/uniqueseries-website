import axios from 'axios';

// Create axios instance with base configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || (
  process.env.NODE_ENV === 'production'
    ? 'https://your-production-domain.com/api'
    : 'http://localhost:3001/api'
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

export default api;
