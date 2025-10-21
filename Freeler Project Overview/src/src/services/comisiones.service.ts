import api from '../lib/api';

export interface Comision {
  id: string;
  monto: number;
  moneda: string;
  estado_comision_id: number;
  lead_id: string;
  usuario_freeler_id: string;
  fecha_generacion: string;
  fecha_pago?: string;
  lead?: {
    id: string;
    nombre_cliente: string;
  };
  usuario_freeler?: {
    id: string;
    nombre: string;
    apellido: string;
  };
}

export interface ComisionStats {
  total_comisiones: number;
  monto_total_por_cobrar: number;
  monto_total_cobrado: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export const comisionesService = {
  getAll: async (params?: { 
    page?: number; 
    limit?: number;
    estado_comision_id?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  }) => {
    const response = await api.get<PaginatedResponse<Comision>>('/comisiones', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<Comision>(`/comisiones/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get<ComisionStats>('/comisiones/stats/basic');
    return response.data;
  },

  pay: async (id: string) => {
    const response = await api.post(`/comisiones/${id}/pay`);
    return response.data;
  },

  getEstadosCatalogo: async () => {
    const response = await api.get('/comisiones/catalogos/estado-comisiones');
    return response.data;
  },

  // Ping del recurso
  ping: async () => {
    const response = await api.get('/comisiones/ping');
    return response.data;
  },
};
