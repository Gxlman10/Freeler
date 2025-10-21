import api from '../lib/api';

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    type: 'empresa' | 'freeler';
    role?: string;
  };
}

export interface RegisterEmpresaData {
  nombre_empresa: string;
  ruc: string;
  email: string;
  password: string;
  telefono?: string;
  direccion?: string;
}

export interface RegisterFreelerData {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  dni: string;
  telefono?: string;
}

export const authService = {
  loginEmpresa: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/empresa/login', {
      email,
      password,
    });
    return response.data;
  },

  loginFreeler: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/freeler/login', {
      email,
      password,
    });
    return response.data;
  },

  // Registra una empresa mediante endpoint de usuarios-empresa (sin prefijo auth)
  registerEmpresa: async (data: RegisterEmpresaData): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/usuarios-empresa', data);
    return response.data;
  },

  // Registra un usuario freeler (no requiere JWT)
  // Mapea a los nombres de campos que espera el backend
  registerFreeler: async (data: RegisterFreelerData): Promise<LoginResponse> => {
    const payload: Record<string, unknown> = {
      nombres: data.nombre,
      apellidos: data.apellido,
      email: data.email,
      password: data.password,
      dni: data.dni,
    };
    if (data.telefono) payload.telefono = data.telefono;
    const response = await api.post<LoginResponse>('/usuarios-freeler/register', payload);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
  },
};
