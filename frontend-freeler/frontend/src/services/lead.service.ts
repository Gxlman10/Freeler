import { api } from './api';

export type LeadDraft = {
  nombres?: string;
  apellidos?: string;
  dni?: string;
  email?: string;
  telefono?: string;
  ocupacion?: string;
  ciudad?: string;
  descripcion?: string;
  origen?: string;
  id_campania?: number;
  id_usuario_freeler?: number;
  estado_completo?: boolean;
  id_estado_lead?: number | null;
};

export type Lead = LeadDraft & {
  id_lead: number;
  id_usuario_freeler?: number | null;
  fecha_creacion?: string;
  campania?: {
    id_campania: number;
    nombre: string;
    empresa?: {
      razon_social?: string | null;
    } | null;
  } | null;
  estado?: {
    id_estado_lead: number;
    nombre: string;
  } | null;
};

const mapLeadPayload = (payload: Partial<LeadDraft>) => {
  const { id_usuario_freeler, ...rest } = payload;
  return {
    ...rest,
    ...(typeof id_usuario_freeler === 'number'
      ? { usuarioFreelerId: id_usuario_freeler }
      : {}),
  };
};

export const unwrapLeadCollection = <T = unknown>(payload: unknown): T[] => {
  if (!payload) return [];

  if (Array.isArray(payload)) {
    return payload as T[];
  }

  const candidate = payload as {
    data?: unknown;
    items?: unknown;
    total?: unknown;
  };

  if (Array.isArray(candidate.data)) {
    return candidate.data as T[];
  }

  if (Array.isArray(candidate.items)) {
    return candidate.items as T[];
  }

  const nested = (candidate.data as { data?: unknown } | undefined)?.data;
  if (Array.isArray(nested)) {
    return nested as T[];
  }

  return [];
};

const normalizeParams = (params: Record<string, unknown> = {}) =>
  Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => {
        if (typeof value === 'boolean') {
          return [key, value ? 'true' : 'false'];
        }
        return [key, value];
      }),
  );

export const LeadService = {
  async create(payload: LeadDraft) {
    const { data } = await api.post('/leads', mapLeadPayload(payload));
    return data as Lead;
  },
  async createDraft(payload: LeadDraft) {
    const { data } = await api.post('/leads/draft', mapLeadPayload(payload));
    return data as Lead;
  },
  async update(id: number, payload: Partial<LeadDraft>) {
    const { data } = await api.patch(`/leads/${id}`, mapLeadPayload(payload));
    return data as Lead;
  },
  async findById(id: number) {
    const { data } = await api.get(`/leads/${id}`);
    return data as Lead;
  },
  async listMine(userId: number, params: Record<string, unknown> = {}) {
    const { data } = await api.get(`/leads/mine/by-user/${userId}`, {
      params: normalizeParams(params),
    });
    return data;
  },
  async listAssignedToMe(params: Record<string, unknown> = {}) {
    const { data } = await api.get('/leads/assigned-to-me', {
      params: normalizeParams(params),
    });
    return data;
  },
  async listAll(params: Record<string, unknown> = {}) {
    const { data } = await api.get('/leads', { params: normalizeParams(params) });
    return data;
  },
  async getStatuses() {
    const { data } = await api.get('/leads/catalogos/estado-lead');
    return data;
  },
  async updateStatus(payload: {
    leadId: number;
    id_estado_lead: number;
    usuarioEmpresaId: number;
  }) {
    const { data } = await api.post('/leads/status', payload);
    return data;
  },
  async markAsSold(payload: { leadId: number; usuarioEmpresaId: number }) {
    const { data } = await api.post('/leads/mark-sold', payload);
    return data;
  },
  async updateAsignacion(id: number, payload: { usuarioEmpresaId: number; estado: 'activo' | 'inactivo' }) {
    const { data } = await api.patch(`/leads/assignments/${id}`, payload);
    return data;
  },
  async bulkUpdateAsignaciones(payload: Record<string, unknown>) {
    const { data } = await api.patch('/leads/assignments/bulk', payload);
    return data;
  },
  async bulkUpdate(payload: {
    leadIds: number[];
    action: 'assign' | 'change-status' | 'activate' | 'deactivate';
    vendedorId?: number | null;
    estadoId?: number | null;
  }) {
    const { data } = await api.post('/leads/bulk-actions', payload);
    return data;
  },
};
