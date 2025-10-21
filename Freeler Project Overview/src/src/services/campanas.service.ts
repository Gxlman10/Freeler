import api from '../lib/api';

export interface Campana {
  id: string;
  nombre: string;
  descripcion?: string;
  fecha_inicio: string;
  fecha_fin?: string;
  comision_porcentaje?: number;
  comision_fija?: number;
  activa: boolean;
  empresa_id: string;
}

export interface CampanaStats {
  total_campanas: number;
  campanas_activas: number;
  total_leads: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export const campanasService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await api.get<PaginatedResponse<Campana>>('/campanas', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<Campana>(`/campanas/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get<CampanaStats>('/campanas/stats/basic');
    return response.data;
  },

  create: async (data: Partial<Campana>) => {
    const response = await api.post<Campana>('/campanas', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Campana>) => {
    const response = await api.patch<Campana>(`/campanas/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/campanas/${id}`);
  },

  // Ping del recurso
  ping: async () => {
    const response = await api.get('/campanas/ping');
    return response.data;
  },
};
