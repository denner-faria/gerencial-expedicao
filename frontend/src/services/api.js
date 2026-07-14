import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api', 
  withCredentials: true,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('@Expedicao:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Se recebermos 401 (Não autorizado), o token expirou ou é inválido
      localStorage.removeItem('@Expedicao:token');
      localStorage.removeItem('@Expedicao:user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
