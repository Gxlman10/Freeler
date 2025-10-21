import api from '../lib/api';

export interface Lead {
  id_lead: number;
  id_campania?: number | null;
  id_usuario_freeler?: number | null;
  nombres: string;
  apellidos: string;
  dni?: string | null;
  email?: string | null;
  telefono?: string | null;
  ocupacion?: string | null;
  ciudad?: string | null;
  descripcion?: string | null;
  origen: string;
  id_estado_lead?: number | null;
  estado_completo: boolean;
  fecha_creacion: string;
  campania?: {
    id_campania: number;
    nombre: string;
  } | null;
  freeler?: {
    id_usuario_freeler: number;
    nombres: string;
    apellidos: string;
  } | null;
}

export interface CreateLeadRequest {
  usuarioFreelerId: number;
  id_campania: number;
  origen: string;
  nombres: string;
  apellidos: string;
  email?: string;
  telefono?: string;
  dni?: string;
  ocupacion?: string;
  ciudad?: string;
  descripcion?: string;
  estado_completo?: boolean;
}

export interface CreateLeadDraftRequest {
  usuarioFreelerId: number;
  origen: string;
  id_campania?: number;
  nombres?: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
  dni?: string;
  ocupacion?: string;
  ciudad?: string;
  descripcion?: string;
  estado_completo?: boolean;
}

export type UpdateLeadRequest = Partial<CreateLeadRequest> & {
  usuarioFreelerId?: number;
};

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
    const mapped: Record<string, unknown> = {};
    if (params) {
      if (params.page) mapped.page = params.page;
      if (params.limit) mapped.limit = params.limit;
      if (params.search) mapped.search = params.search;
      if (params.campana_id) mapped.id_campania = Number(params.campana_id);
      if (params.estado_lead_id) mapped.id_estado_lead = Number(params.estado_lead_id);
      if (params.fecha_desde) mapped.fecha_desde = params.fecha_desde;
      if (params.fecha_hasta) mapped.fecha_hasta = params.fecha_hasta;
    }
    const response = await api.get<PaginatedResponse<Lead>>('/leads', { params: mapped });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<Lead>(`/leads/${id}`);
    return response.data;
  },

  getMine: async (usuarioFreelerId: string, params?: { page?: number; limit?: number; search?: string }) => {
    const mapped: Record<string, unknown> = {};
    if (params) {
      if (params.page) mapped.page = params.page;
      if (params.limit) mapped.limit = params.limit;
      if (params.search) mapped.search = params.search;
    }
    const response = await api.get<PaginatedResponse<Lead>>(`/leads/mine/by-user/${Number(usuarioFreelerId)}`, { params: mapped });
    return response.data;
  },

  getByCampana: async (campanaId: string, params?: { page?: number; limit?: number }) => {
    const response = await api.get<PaginatedResponse<Lead>>(`/leads/by-campana/${campanaId}`, { params });
    return response.data;
  },

  createDraft: async (data: CreateLeadDraftRequest) => {
    const response = await api.post<Lead>('/leads/draft', data);
    return response.data;
  },

  create: async (data: CreateLeadRequest) => {
    const response = await api.post<Lead>('/leads', data);
    return response.data;
  },

  // Actualiza un lead existente
  update: async (id: string, data: UpdateLeadRequest) => {
    const response = await api.patch<Lead>(`/leads/${id}`, data);
    return response.data;
  },

  assign: async (leadId: string, usuarioEmpresaId: string, asignarAUsuarioEmpresaId?: string) => {
    const targetId = asignarAUsuarioEmpresaId ?? usuarioEmpresaId;
    const response = await api.post(`/leads/assign`, {
      leadId: Number(leadId),
      usuarioEmpresaId: Number(usuarioEmpresaId),
      asignarAUsuarioEmpresaId: Number(targetId),
    });
    return response.data;
  },

  assignSelf: async (leadId: string, usuarioEmpresaId: string) => {
    const response = await api.post(`/leads/assign/self`, { leadId: Number(leadId), usuarioEmpresaId: Number(usuarioEmpresaId) });
    return response.data;
  },

  updateStatus: async (leadId: string, id_estado_lead: number, usuarioEmpresaId: string) => {
    const response = await api.post(`/leads/status`, {
      leadId: Number(leadId),
      id_estado_lead: Number(id_estado_lead),
      usuarioEmpresaId: Number(usuarioEmpresaId),
    });
    return response.data;
  },

  markSold: async (leadId: string, usuarioEmpresaId: string) => {
    const response = await api.post(`/leads/mark-sold`, {
      leadId: Number(leadId),
      usuarioEmpresaId: Number(usuarioEmpresaId),
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

  // Actualiza una asignaciÃ³n de lead
  updateAssignment: async (assignmentId: string, data: { activa?: boolean }) => {
    const response = await api.patch(`/leads/assignments/${assignmentId}`, data);
    return response.data;
  },

  // ActualizaciÃ³n masiva de asignaciones
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

