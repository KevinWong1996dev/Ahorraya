import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: API_URL });

// Adjuntar token JWT automáticamente
api.interceptors.request.use((config) => {
  const auth = JSON.parse(localStorage.getItem('ahorraya-auth') || '{}');
  const token = auth?.state?.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Manejo global de errores
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ahorraya-auth');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Productos
export const productsAPI = {
  search: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  categorias: () => api.get('/products/meta/categorias'),
  autocomplete: (q) => api.get('/products/search/autocomplete', { params: { q } })
};

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me')
};

// Carrito inteligente
export const cartAPI = {
  optimize: (items) => api.post('/cart/optimize', { items })
};

// Precios
export const pricesAPI = {
  history: (productoId, params) => api.get(`/prices/${productoId}/history`, { params }),
  ofertas: () => api.get('/prices/destacadas/ofertas')
};

// Contribuciones
export const contributionsAPI = {
  create: (data) => api.post('/contributions', data),
  votar: (id, voto) => api.post(`/contributions/${id}/votar`, { voto }),
  ranking: () => api.get('/contributions/ranking')
};

// Alertas
export const alertsAPI = {
  getAll: () => api.get('/alerts'),
  create: (data) => api.post('/alerts', data),
  delete: (id) => api.delete(`/alerts/${id}`),
  getNotificaciones: () => api.get('/alerts/notificaciones'),
  marcarLeidas: () => api.put('/alerts/notificaciones/leer'),
};

export const supermercadosAPI = {
  getAll: () => api.get('/supermercados')
};

export default api;
