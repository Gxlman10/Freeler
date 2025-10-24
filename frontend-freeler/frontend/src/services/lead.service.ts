import { api } from './api';
import { STORAGE_KEYS } from '@/utils/constants';
import { safeJsonParse } from '@/utils/helpers';

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
};

export type Lead = LeadDraft & {
  id_lead: number;
  id_usuario_freeler?: number | null;
  id_estado_lead?: number | null;
  estado_completo?: boolean;
  fecha_creacion?: string;
  campania?: {
    id_campania: number;
    nombre: string;
  } | null;
  estado?: {
    id_estado_lead: number;
    nombre: string;
  } | null;
};

const DRAFT_KEY = STORAGE_KEYS.leadDraft;

export const LeadService = {
  saveDraft(draft: LeadDraft) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  },
  getDraft(): LeadDraft | null {
    return safeJsonParse<LeadDraft>(localStorage.getItem(DRAFT_KEY));
  },
  clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
  },
  async create(payload: LeadDraft) {
    const { data } = await api.post('/leads', payload);
    return data as Lead;
  },
  async createDraft(payload: LeadDraft) {
    const { data } = await api.post('/leads/draft', payload);
    return data as Lead;
  },
  async listMine(userId: number, params: Record<string, unknown> = {}) {
    const { data } = await api.get(`/leads/mine/by-user/${userId}`, { params });
    return data;
  },
  async listAssignedToMe(params: Record<string, unknown> = {}) {
    const { data } = await api.get('/leads/assigned-to-me', { params });
    return data;
  },
  async listAll(params: Record<string, unknown> = {}) {
    const { data } = await api.get('/leads', { params });
    return data;
  },
  async getStatuses() {
    const { data } = await api.get('/leads/statuses');
    return data;
  },
  async updateStatus(payload: { leadId: number; estadoId: number }) {
    const { data } = await api.post('/leads/status', payload);
    return data;
  },
  async markAsSold(payload: { leadId: number; monto: number }) {
    const { data } = await api.post('/leads/mark-sold', payload);
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
