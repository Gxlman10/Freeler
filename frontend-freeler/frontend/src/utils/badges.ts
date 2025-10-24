import { Role } from '@/utils/constants';
import type { BadgeVariant } from '@/components/ui/Badge';

export const ROLE_BADGE_VARIANTS: Record<Role, BadgeVariant> = {
  [Role.ADMIN]: 'role-admin',
  [Role.SUPERVISOR]: 'role-supervisor',
  [Role.VENDEDOR]: 'role-vendedor',
  [Role.ANALISTA]: 'role-analista',
};

export const getRoleBadgeVariant = (role?: Role | null): BadgeVariant =>
  role ? ROLE_BADGE_VARIANTS[role] : 'role-pending';

export const getStatusBadgeVariant = (status?: string | number | null): BadgeVariant => {
  if (typeof status === 'number') {
    if (status === 1) return 'status-active';
    if (status === 0) return 'status-inactive';
  }

  if (!status) return 'status-pending';

  const normalized = String(status).trim().toLowerCase();

  if (['1', 'activo', 'active', 'habilitado', 'enabled'].includes(normalized)) {
    return 'status-active';
  }

  if (['0', 'inactivo', 'inactive', 'inhabilitado', 'disabled', 'cerrado'].includes(normalized)) {
    return 'status-inactive';
  }

  if (['pendiente', 'pending', 'en revision', 'sin asignar', 'prospecto'].includes(normalized)) {
    return 'status-pending';
  }

  if (['archivado', 'archived', 'cerrado'].includes(normalized)) {
    return 'status-archived';
  }

  return 'neutral';
};

export const normalizeStatusLabel = (status?: string | number | null, fallback = 'Sin estado'): string => {
  if (status === null || status === undefined) return fallback;
  if (typeof status === 'number') return status === 1 ? 'Activo' : status === 0 ? 'Inactivo' : fallback;
  const label = status.toString().trim();
  return label.length ? label.charAt(0).toUpperCase() + label.slice(1).toLowerCase() : fallback;
};
