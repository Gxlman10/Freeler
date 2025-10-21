import axios from 'axios';
import { toast } from 'sonner@2.0.3';

const API_BASE_URL = typeof import.meta.env !== 'undefined' && import.meta.env.VITE_API_BASE_URL 
  ? import.meta.env.VITE_API_BASE_URL 
  : 'http://localhost:3000';

// Crear instancia de axios
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de request: agregar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Mapeo de errores backend a mensajes amigables
const errorMessages: Record<string, string> = {
  INVALID_CREDENTIALS: 'Credenciales inválidas',
  ROL_NO_AUTORIZADO: 'No tienes permisos para esta acción',
  EMAIL_ALREADY_EXISTS: 'Ya existe un usuario con ese email',
  DNI_ALREADY_EXISTS: 'Ya existe un usuario con ese DNI',
  RUC_ALREADY_EXISTS: 'Ya existe una empresa con ese RUC',
  NOT_FOUND: 'Recurso no encontrado',
  LEAD_NOT_FOUND: 'Lead no encontrado',
  CAMPANIA_NOT_FOUND: 'Campaña no encontrada',
  COMISION_NOT_FOUND: 'Comisión no encontrada',
  USUARIO_NOT_FOUND: 'Usuario no encontrado',
  EMPRESA_NOT_FOUND: 'Empresa no encontrada',
};

// Interceptor de response: manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      // 401: limpiar token y redirigir
      if (status === 401) {
        localStorage.removeItem('access_token');
        window.location.href = '/';
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        return Promise.reject(error);
      }

      // Mapear mensaje de error
      const errorCode = data?.code || data?.message;
      const message = errorMessages[errorCode] || data?.message || 'Error en la operación';
      
      toast.error(message);
    } else if (error.request) {
      toast.error('No se pudo conectar con el servidor');
    } else {
      toast.error('Error inesperado');
    }
    
    return Promise.reject(error);
  }
);

export default api;
