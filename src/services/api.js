import axios from 'axios';

const API_BASE_URL = 'http://localhost:5006/api/public';
const EMAIL_VERIFY_BASE_URL = 'http://localhost:5007/api/verify';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Service Methods
export const apiService = {
  // Authentication
  auth: {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),
    verifyOtp: (data) => api.post('/auth/verify-otp', data),
    googleLogin: (token) => api.post('/auth/google', { token }),
    logout: () => api.post('/auth/logout'),
  },

  // States (Masters)
  states: {
    getAll: () => api.get('/states'),
    getById: (id) => api.get(`/states/${id}`),
  },

  // Cities (Masters)
  cities: {
    getAll: () => api.get('/districts'),
    getByState: (stateId) => api.get(`/districts?stateId=${stateId}`),
    getById: (id) => api.get(`/districts/${id}`),
  },

  // Categories
  categories: {
    getAll: () => api.get('/categories'),
    getById: (id) => api.get(`/categories/${id}`),
    getByParent: (parentId) => api.get(`/categories?parentId=${parentId}`),
    search: (query) => api.get(`/categories/search?q=${query}`),
  },

  // Subcategories
  subcategories: {
    getAll: () => api.get('/subcategories'),
    getByCategory: (categoryId) => api.get(`/subcategories?categoryId=${categoryId}`),
    getById: (id) => api.get(`/subcategories/${id}`),
  },

  // Businesses (Public endpoint - for business-specific details, hours, categories)
  businesses: {
    getAll: () => api.get('/businesses'),
    getById: (id) => api.get(`/businesses/${id}`),
  },

  // Public Companies (for company details and search functionality)
  publicCompanies: {
    getAll: () => api.get('/companies'),
    getById: (id) => api.get(`/companies/${id}`),
    getByCategory: (categoryId, params = {}) => api.get(`/companies/category/${categoryId}`, { params }),
    getByCity: (cityId, params = {}) => api.get(`/companies/city/${cityId}`, { params }),
    search: (query, params = {}) => api.get(`/companies/search?q=${query}`, { params }),
    create: (data) => api.post('/companies', data),
    update: (id, data) => api.put(`/companies/${id}`, data),
    delete: (id) => api.delete(`/companies/${id}`),
  },

  // Public Businesses (for business-specific details like hours)
  publicBusinesses: {
    getAll: () => api.get('/businesses'),
    getById: (id) => api.get(`/businesses/${id}`),
  },

  // Products
  products: {
    getAll: (params = {}) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    getByBusiness: (businessId, params = {}) => api.get(`/products/company/${businessId}`, { params }),
    getByCategory: (categoryId, params = {}) => api.get(`/products/category/${categoryId}`, { params }),
    search: (query, params = {}) => api.get(`/products/search?q=${query}`, { params }),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
  },

  // Reviews
  reviews: {
    getAll: (params = {}) => api.get('/reviews', { params }),
    getById: (id) => api.get(`/reviews/${id}`),
    getByBusiness: (businessId) => api.get(`/reviews/company/${businessId}`),
    getByProduct: (productId) => api.get(`/reviews/product/${productId}`),
    create: (data) => api.post('/reviews', data),
    update: (id, data) => api.put(`/reviews/${id}`, data),
    delete: (id) => api.delete(`/reviews/${id}`),
  },

  // Users
  users: {
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data) => api.put('/users/profile', data),
  },

  // Banners/Ads
  banners: {
    getAll: () => api.get('/banners'),
    getByCategory: (categoryId) => api.get(`/banners/category/${categoryId}`),
  },

  // Trending/Popular
  trending: {
    getSearches: () => api.get('/trending/searches'),
    getCategories: () => api.get('/trending/categories'),
  },

  // Leads/Enquiries
  leads: {
    create: (data) => api.post('/leads', data),
  },

  // Email Verification (magic-link, local server on :5007)
  emailVerification: {
    /**
     * Send a magic-link verification email.
     * @param {{ email: string, returnUrl: string }} data
     */
    sendLink: (data) =>
      axios.post(`${EMAIL_VERIFY_BASE_URL}/send`, data, {
        headers: { 'Content-Type': 'application/json' },
      }),
  },
};

export default api;
