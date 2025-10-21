import api from '../lib/api';

export interface UsuarioEmpresa {
  id: string;
  nombre_empresa: string;
  ruc: string;
  email: string;
  telefono?: string;
  direccion?: string;
  activo?: boolean;
  fecha_creacion?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export const usuariosEmpresaService = {
  // Ping del recurso
  ping: async () => {
    const res = await api.get('/usuarios-empresa/ping');
    return res.data;
  },

  // Crear usuario de empresa
  create: async (data: Omit<UsuarioEmpresa, 'id'> & { password: string }) => {
    const res = await api.post<UsuarioEmpresa>('/usuarios-empresa', data);
    return res.data;
  },

  // Listado
  list: async (params?: { page?: number; limit?: number; search?: string }) => {
    const res = await api.get<PaginatedResponse<UsuarioEmpresa>>('/usuarios-empresa', { params });
    return res.data;
  },

  // Detalle
  getById: async (id: string) => {
    const res = await api.get<UsuarioEmpresa>(`/usuarios-empresa/${id}`);
    return res.data;
  },

  // Actualizar
  update: async (id: string, data: Partial<UsuarioEmpresa>) => {
    const res = await api.patch<UsuarioEmpresa>(`/usuarios-empresa/${id}`, data);
    return res.data;
  },

  // Soft delete
  remove: async (id: string) => {
    const res = await api.delete(`/usuarios-empresa/${id}`);
    return res.data;
  },
};

