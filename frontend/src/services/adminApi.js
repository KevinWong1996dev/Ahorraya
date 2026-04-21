import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const auth = JSON.parse(localStorage.getItem('ahorraya-auth') || '{}');
  const token = auth?.state?.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) { localStorage.removeItem('ahorraya-auth'); window.location.href = '/login'; }
    if (err.response?.status === 403) { window.location.href = '/'; }
    return Promise.reject(err);
  }
);

export const adminAPI = {
  stats: () => api.get('/admin/stats'),
  // Productos
  getProductos: (params) => api.get('/admin/productos', { params }),
  createProducto: (data) => api.post('/admin/productos', data),
  updateProducto: (id, data) => api.put(`/admin/productos/${id}`, data),
  deleteProducto: (id) => api.delete(`/admin/productos/${id}`),
  // Precios
  getPrecios: (productoId) => api.get(`/admin/precios/${productoId}`),
  upsertPrecio: (data) => api.put('/admin/precios', data),
  deletePrecio: (productoId, supermercado) => api.delete(`/admin/precios/${productoId}/${supermercado}`),
  // Usuarios
  getUsuarios: (params) => api.get('/admin/usuarios', { params }),
  createUsuario: (data) => api.post('/admin/usuarios', data),
  updateUsuario: (id, data) => api.put(`/admin/usuarios/${id}`, data),
  deleteUsuario: (id) => api.delete(`/admin/usuarios/${id}`),
  // Contribuciones
  getContribuciones: () => api.get('/admin/contribuciones'),
  deleteContribucion: (id) => api.delete(`/admin/contribuciones/${id}`),
  // Logs
  getLogs: () => api.get('/admin/logs'),
};

export default api;
