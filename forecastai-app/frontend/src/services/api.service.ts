import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
});

const MAX_RETRIES = 3;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest || originalRequest._retryCount >= MAX_RETRIES) {
      return Promise.reject(error);
    }

    originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

    const shouldRetry =
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      error.response?.status === 429 ||
      error.response?.status >= 500;

    if (shouldRetry) {
      const delay = Math.min(1000 * Math.pow(2, originalRequest._retryCount - 1), 10000);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return api(originalRequest);
    }

    if (error.response?.status === 413) {
      throw new Error('File too large. Maximum size is 10MB.');
    }

    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again.');
    }

    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }

    throw new Error('An unexpected error occurred. Please try again.');
  }
);

export default api;
