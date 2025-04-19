import axios from 'axios';

// Define API URLs from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_URL = import.meta.env.VITE_API_URL || `${API_BASE_URL}/api`;

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Only add authorization header for protected routes
    const protectedRoutes = [
      '/users/',
      '/orders/',
      '/products/create/',
      '/products/delete/',
      '/products/update/',
      '/blog/',
    ];

    // Check if the current request path matches any protected route
    const isProtectedRoute = protectedRoutes.some(route => 
      config.url.startsWith(route)
    );

    // Get token from localStorage if it exists and route is protected
    if (isProtectedRoute) {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const { token } = JSON.parse(userInfo);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      console.error('CORS error:', error);
    }
    return Promise.reject(error);
  }
);

// Export both the axios instance and the API URLs for reuse
export default axiosInstance;
export { API_BASE_URL, API_URL };