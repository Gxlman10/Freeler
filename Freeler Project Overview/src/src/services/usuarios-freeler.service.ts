import api from '../lib/api';

export interface UsuarioFreeler {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  telefono?: string;
  activo?: boolean;
  fecha_creacion?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export const usuariosFreelerService = {
  // Salud del recurso
  ping: async () => {
    const res = await api.get('/usuarios-freeler/ping');
    return res.data;
  },

  // Verifica conexión/metadata de BD
  dbCheck: async () => {
    const res = await api.get('/usuarios-freeler/db-check');
    return res.data;
  },

  // Registro (sin JWT)
  register: async (data: Omit<UsuarioFreeler, 'id'> & { password: string }) => {
    const res = await api.post('/usuarios-freeler/register', data);
    return res.data;
  },

  // CRUD básico
  getById: async (id: string) => {
    const res = await api.get<UsuarioFreeler>(`/usuarios-freeler/${id}`);
    return res.data;
  },

  update: async (id: string, data: Partial<UsuarioFreeler>) => {
    const res = await api.patch<UsuarioFreeler>(`/usuarios-freeler/${id}`, data);
    return res.data;
  },

  list: async (params?: { page?: number; limit?: number; search?: string }) => {
    const res = await api.get<PaginatedResponse<UsuarioFreeler>>('/usuarios-freeler', { params });
    return res.data;
  },

  remove: async (id: string) => {
    const res = await api.delete(`/usuarios-freeler/${id}`);
    return res.data;
  },

  stats: async (id: string) => {
    const res = await api.get(`/usuarios-freeler/${id}/stats`);
    return res.data;
  },
};

