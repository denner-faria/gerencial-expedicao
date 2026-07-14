import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api', 
  withCredentials: true,
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Se recebermos 401 (Não autorizado), o cookie expirou ou é inválido
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
