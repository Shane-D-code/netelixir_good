import api from '../../../services/api.service';

export const authApi = {
  register: (email: string, password: string, name?: string) =>
    api.post('/auth/register', { email, password, name }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  getMe: () =>
    api.get('/auth/me'),
};

// Token management
export const tokenManager = {
  getToken: (): string | null => localStorage.getItem('forecastai_token'),
  setToken: (token: string): void => localStorage.setItem('forecastai_token', token),
  removeToken: (): void => localStorage.removeItem('forecastai_token'),
  isAuthenticated: (): boolean => !!localStorage.getItem('forecastai_token'),
};

// Add auth interceptor to api instance
api.interceptors.request.use((config) => {
  const token = tokenManager.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
