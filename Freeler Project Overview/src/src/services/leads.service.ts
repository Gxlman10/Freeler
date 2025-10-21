import api from '../lib/api';

export interface Lead {
  id: string;
  nombre_cliente: string;
  email?: string;
  telefono?: string;
  empresa?: string;
  cargo?: string;
  notas?: string;
  estado_lead_id: number;
  campana_id: string;
  usuario_freeler_id: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  campana?: {
    id: string;
    nombre: string;
  };
  usuario_freeler?: {
    id: string;
    nombre: string;
    apellido: string;
  };
  asignacion?: {
    id: string;
    usuario_empresa_id: string;
    activa: boolean;
    fecha_asignacion: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export const leadsService = {
  getAll: async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string;
    campana_id?: string;
    estado_lead_id?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  }) => {
    const response = await api.get<PaginatedResponse<Lead>>('/leads', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<Lead>(`/leads/${id}`);
    return response.data;
  },

  getMine: async (usuarioFreelerId: string, params?: { page?: number; limit?: number; search?: string }) => {
    const response = await api.get<PaginatedResponse<Lead>>(`/leads/mine/by-user/${usuarioFreelerId}`, { params });
    return response.data;
  },

  getByCampana: async (campanaId: string, params?: { page?: number; limit?: number }) => {
    const response = await api.get<PaginatedResponse<Lead>>(`/leads/by-campana/${campanaId}`, { params });
    return response.data;
  },

  createDraft: async (data: Partial<Lead>) => {
    const response = await api.post<Lead>('/leads/draft', data);
    return response.data;
  },

  create: async (data: Partial<Lead>) => {
    const response = await api.post<Lead>('/leads', data);
    return response.data;
  },

  // Actualiza un lead existente
  update: async (id: string, data: Partial<Lead>) => {
    const response = await api.patch<Lead>(`/leads/${id}`, data);
    return response.data;
  },

  assign: async (leadId: string, usuarioEmpresaId: string) => {
    const response = await api.post(`/leads/assign`, {
      lead_id: leadId,
      usuario_empresa_id: usuarioEmpresaId,
    });
    return response.data;
  },

  assignSelf: async (leadId: string) => {
    const response = await api.post(`/leads/assign/self`, { lead_id: leadId });
    return response.data;
  },

  updateStatus: async (leadId: string, estadoLeadId: number) => {
    const response = await api.post(`/leads/status`, {
      lead_id: leadId,
      estado_lead_id: estadoLeadId,
    });
    return response.data;
  },

  markSold: async (leadId: string, montoVenta: number) => {
    const response = await api.post(`/leads/mark-sold`, {
      lead_id: leadId,
      monto_venta: montoVenta,
    });
    return response.data;
  },

  getEstadosCatalogo: async () => {
    const response = await api.get('/leads/catalogos/estado-lead');
    return response.data;
  },

  // Lista leads asignados al usuario empresa autenticado
  getAssignedToMe: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get<PaginatedResponse<Lead>>('/leads/assigned-to-me', { params });
    return response.data;
  },

  // Actualiza una asignación de lead
  updateAssignment: async (assignmentId: string, data: { activa?: boolean }) => {
    const response = await api.patch(`/leads/assignments/${assignmentId}`, data);
    return response.data;
  },

  // Actualización masiva de asignaciones
  bulkUpdateAssignments: async (payload: Record<string, unknown>) => {
    const response = await api.patch('/leads/assignments/bulk', payload);
    return response.data;
  },

  // Ping del recurso
  ping: async () => {
    const response = await api.get('/leads/ping');
    return response.data;
  },
};
