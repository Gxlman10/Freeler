import api from '../lib/api';

export interface UsuarioEmpresa {
  id_usuario_empresa: number;
  id_empresa?: number | null;
  id_rol?: number | null;
  nombres: string;
  apellidos: string;
  email: string;
  estado: number;
  fecha_creacion: string;
}

export interface CreateUsuarioEmpresaPayload {
  id_empresa: number;
  id_rol: number;
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  estado?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export const usuariosEmpresaService = {
  ping: async () => {
    const res = await api.get('/usuarios-empresa/ping');
    return res.data;
  },

  create: async (data: CreateUsuarioEmpresaPayload) => {
    const res = await api.post<UsuarioEmpresa>('/usuarios-empresa', data);
    return res.data;
  },

  list: async (params?: { page?: number; limit?: number; search?: string }) => {
    const res = await api.get<PaginatedResponse<UsuarioEmpresa>>('/usuarios-empresa', { params });
    return res.data;
  },

  getById: async (id: number | string) => {
    const res = await api.get<UsuarioEmpresa>(`/usuarios-empresa/${id}`);
    return res.data;
  },

  update: async (id: number | string, data: Partial<UsuarioEmpresa>) => {
    const res = await api.patch<UsuarioEmpresa>(`/usuarios-empresa/${id}`, data);
    return res.data;
  },

  remove: async (id: number | string) => {
    const res = await api.delete(`/usuarios-empresa/${id}`);
    return res.data;
  },
};
