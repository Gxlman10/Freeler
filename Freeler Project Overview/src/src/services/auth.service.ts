import api from '../lib/api';

export interface AuthTokenResponse {
  access_token: string;
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
  loginEmpresa: async (email: string, password: string): Promise<AuthTokenResponse> => {
    const response = await api.post<AuthTokenResponse>('/auth/empresa/login', {
      email,
      password,
    });
    return response.data;
  },

  loginFreeler: async (email: string, password: string): Promise<AuthTokenResponse> => {
    const response = await api.post<AuthTokenResponse>('/auth/freeler/login', {
      email,
      password,
    });
    return response.data;
  },

  // Registra una empresa y devuelve token
  registerEmpresa: async (data: RegisterEmpresaData): Promise<AuthTokenResponse> => {
    const response = await api.post<AuthTokenResponse>('/auth/empresa/register', data);
    return response.data;
  },

  // Registra un usuario freeler (no requiere JWT)
  // Mapea a los nombres de campos que espera el backend
  registerFreeler: async (data: RegisterFreelerData): Promise<AuthTokenResponse> => {
    const payload: Record<string, unknown> = {
      nombres: data.nombre,
      apellidos: data.apellido,
      email: data.email,
      password: data.password,
      dni: data.dni,
    };
    if (data.telefono) payload.telefono = data.telefono;
    const response = await api.post<AuthTokenResponse>('/usuarios-freeler/register', payload);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
  },
};
