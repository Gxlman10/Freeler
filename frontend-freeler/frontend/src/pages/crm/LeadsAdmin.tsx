import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LeadService, Lead, LeadDraft } from '@/services/lead.service';
import { UserService } from '@/services/user.service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { Alert } from '@/components/common/Alert';
import LeadBulkActionsBar, {
  BulkStatusOption,
  BulkVendorOption,
  LeadBulkAction,
} from '@/components/crm/LeadBulkActionsBar';
import { getStatusBadgeVariant, normalizeStatusLabel } from '@/utils/badges';
import { formatDate } from '@/utils/helpers';
import { useToast } from '@/components/common/Toasts';
import { mapBackendRole, Role } from '@/utils/constants';

type FiltersState = {
  search: string;
  statusId: number | 'all';
  onlyUnassigned: boolean;
};

const DEFAULT_FILTERS: FiltersState = {
  search: '',
  statusId: 'all',
  onlyUnassigned: false,
};

const FALLBACK_STATUSES: BulkStatusOption[] = [
  { id: 1, label: 'Prospecto' },
  { id: 2, label: 'En gestion' },
  { id: 3, label: 'Ganado' },
  { id: 4, label: 'Perdido' },
];

const getInitials = (value?: string | null) => {
  if (!value) return 'UX';
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!parts.length) return value.charAt(0).toUpperCase();
  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
};

const buildVendorLabel = (nombres?: string | null, apellidos?: string | null, email?: string | null) => {
  const fullName = `${nombres ?? ''} ${apellidos ?? ''}`.trim();
  const initials = getInitials(fullName || email || '');
  if (!fullName) return `${initials}${email ? ` · ${email}` : ''}`;
  return `${initials} · ${fullName}`;
};

const computeUnassignedDuration = (createdAt?: string, assignedAt?: string | null) => {
  if (!createdAt) return '-';
  const created = new Date(createdAt);
  const target = assignedAt ? new Date(assignedAt) : new Date();
  const diffMs = Math.max(target.getTime() - created.getTime(), 0);
  const totalMinutes = Math.round(diffMs / (1000 * 60));
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const totalHours = Math.round(diffMs / (1000 * 60 * 60));
  if (totalHours < 24) return `${totalHours}h`;
  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;
  return remainingHours ? `${days}d ${remainingHours}h` : `${days}d`;
};

type LeadAssignee = {
  id?: number;
  nombres?: string;
  apellidos?: string;
  email?: string;
};

const resolveAssignee = (lead: any): { assignee: LeadAssignee | null; assignedAt: string | null } => {
  if (!lead) return { assignee: null, assignedAt: null };
  const direct =
    lead.vendedor || lead.usuario || lead.asignado || lead.asignado_a || lead.usuario_asignado;
  if (direct) {
    return { assignee: direct, assignedAt: direct.fecha_asignacion ?? lead.fecha_asignacion ?? null };
  }

  if (lead.asignacion && typeof lead.asignacion === 'object') {
    return {
      assignee: lead.asignacion.usuario ?? lead.asignacion,
      assignedAt: lead.asignacion.fecha_asignacion ?? null,
    };
  }

  if (Array.isArray(lead.asignaciones) && lead.asignaciones.length) {
    const first = lead.asignaciones[0];
    return {
      assignee: first?.usuario ?? first,
      assignedAt: first?.fecha_asignacion ?? null,
    };
  }

  return { assignee: null, assignedAt: null };
};

const extractStatusOptions = (raw: any): BulkStatusOption[] => {
  const source = Array.isArray(raw?.data)
    ? raw.data
    : Array.isArray(raw?.items)
    ? raw.items
    : Array.isArray(raw)
    ? raw
    : [];

  const mapped = source
    .map((item: any) => ({
      id: Number(item.id_estado_lead ?? item.id ?? item.value ?? 0),
      label: String(item.nombre ?? item.label ?? item.descripcion ?? '').trim() || 'Estado',
    }))
    .filter((option) => option.id);

  return mapped.length ? mapped : FALLBACK_STATUSES;
};

const extractVendorOptions = (raw: any): BulkVendorOption[] => {
  const source = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
  return source
    .filter((user: any) => mapBackendRole(user.rol?.nombre) === Role.VENDEDOR)
    .map((user: any) => ({
      id: Number(user.id_usuario_empresa ?? user.id ?? 0),
      label: buildVendorLabel(user.nombres, user.apellidos, user.email),
    }))
    .filter((option) => option.id);
};

const normalizeLeads = (raw: any): Lead[] => {
  if (!raw) return [];
  if (Array.isArray(raw?.data)) return raw.data as Lead[];
  if (Array.isArray(raw?.items)) return raw.items as Lead[];
  if (Array.isArray(raw)) return raw as Lead[];
  return [];
};

export const LeadsAdmin = () => {
  const { push } = useToast();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedAction, setSelectedAction] = useState<LeadBulkAction>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null);
  const [isMetaDialogOpen, setMetaDialogOpen] = useState(false);
  const [isImportDialogOpen, setImportDialogOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent');
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editLeadState, setEditLeadState] = useState<{ estadoId: string; descripcion: string }>({
    estadoId: '',
    descripcion: '',
  });

  const leadsQuery = useQuery({
    queryKey: ['crm-admin-leads'],
    queryFn: () => LeadService.listAll({ limit: 250, include: 'campania,estado,asignaciones' }),
  });

  const statusesQuery = useQuery({
    queryKey: ['crm-lead-statuses'],
    queryFn: () => LeadService.getStatuses(),
  });

  const vendorsQuery = useQuery({
    queryKey: ['crm-vendors'],
    queryFn: () => UserService.getUsuariosEmpresa(),
  });

  const leads = useMemo(() => normalizeLeads(leadsQuery.data), [leadsQuery.data]);
  const statusOptions = useMemo(() => extractStatusOptions(statusesQuery.data), [statusesQuery.data]);
  const vendorOptions = useMemo(() => extractVendorOptions(vendorsQuery.data), [vendorsQuery.data]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => leads.some((lead) => lead.id_lead === id)));
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    const result = leads
      .filter((lead) => {
        if (!term) return true;
        const haystack = [
          lead.nombres,
          lead.apellidos,
          lead.email,
          lead.telefono,
          lead.dni,
          lead.origen,
          lead.ciudad,
          lead.campania?.nombre,
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(term);
      })
      .filter((lead) => {
        if (filters.statusId === 'all') return true;
        const statusId = lead.estado?.id_estado_lead ?? lead.id_estado_lead;
        return Number(statusId) === Number(filters.statusId);
      })
      .filter((lead) => {
        if (!filters.onlyUnassigned) return true;
        const { assignee } = resolveAssignee(lead as any);
        return !assignee;
      });

    return result.sort((a, b) => {
      const dateA = new Date(a.fecha_creacion ?? 0).getTime();
      const dateB = new Date(b.fecha_creacion ?? 0).getTime();
      return sortOrder === 'recent' ? dateB - dateA : dateA - dateB;
    });
  }, [leads, filters, sortOrder]);

  const allSelected =
    filteredLeads.length > 0 && filteredLeads.every((lead) => selectedIds.includes(lead.id_lead));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredLeads.some((lead) => lead.id_lead === id)));
    } else {
      setSelectedIds((prev) =>
        Array.from(new Set([...prev, ...filteredLeads.map((lead) => lead.id_lead)])),
      );
    }
  };

  const toggleLeadSelection = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((leadId) => leadId !== id) : [...prev, id]));
  };

  const resetBulkState = () => {
    setSelectedIds([]);
    setSelectedAction(null);
    setSelectedVendorId(null);
    setSelectedStatusId(null);
  };

  const bulkMutation = useMutation({
    mutationFn: LeadService.bulkUpdate,
    onSuccess: () => {
      push({ title: 'Accion aplicada', description: 'Los leads se actualizaron correctamente.' });
      resetBulkState();
      queryClient.invalidateQueries({ queryKey: ['crm-admin-leads'] });
    },
    onError: () => {
      push({
        title: 'No se pudo aplicar la accion',
        description: 'Intentalo nuevamente.',
        variant: 'danger',
      });
    },
  });

  const editLeadMutation = useMutation({
    mutationFn: async (payload: { estadoId: string; descripcion: string }) => {
      if (!editingLead) {
        throw new Error('NO_LEAD_SELECTED');
      }
      const body: Partial<LeadDraft> & { id_estado_lead?: number | null } = {};
      body.descripcion = payload.descripcion.trim() || undefined;
      body.id_estado_lead = payload.estadoId ? Number(payload.estadoId) : null;
      return LeadService.update(editingLead.id_lead, body);
    },
    onSuccess: () => {
      push({ title: 'Lead actualizado', description: 'Los cambios se guardaron correctamente.' });
      setEditDialogOpen(false);
      setEditingLead(null);
      queryClient.invalidateQueries({ queryKey: ['crm-admin-leads'] });
    },
    onError: () => {
      push({
        title: 'No se pudo actualizar el lead',
        description: 'Revisa los datos e intenta nuevamente.',
        variant: 'danger',
      });
    },
  });

  const handleActionChange = (action: LeadBulkAction) => {
    setSelectedAction(action);
    if (action !== 'assign') {
      setSelectedVendorId(null);
    }
    if (action !== 'change-status') {
      setSelectedStatusId(null);
    }
  };

  const handleBulkConfirm = () => {
    if (!selectedAction) return;
    const payload: Parameters<typeof LeadService.bulkUpdate>[0] = {
      leadIds: selectedIds,
      action: selectedAction,
    };
    if (selectedAction === 'assign') payload.vendedorId = selectedVendorId ?? undefined;
    if (selectedAction === 'change-status') payload.estadoId = selectedStatusId ?? undefined;
    bulkMutation.mutate(payload);
  };

  const openEditLeadDialog = (lead: Lead) => {
    setEditingLead(lead);
    setEditLeadState({
      estadoId: lead.estado?.id_estado_lead ? String(lead.estado.id_estado_lead) : '',
      descripcion: lead.descripcion ?? '',
    });
    setEditDialogOpen(true);
  };

  const handleEditLeadSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    editLeadMutation.mutate({
      estadoId: editLeadState.estadoId,
      descripcion: editLeadState.descripcion,
    });
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-content">Gestor de leads</h1>
          <p className="text-sm text-content-muted">
            Filtra, asigna y actualiza el estado de los leads de tu empresa desde un solo lugar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setMetaDialogOpen(true)}>
            Conectar Meta Ads
          </Button>
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            Importar desde Excel
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap gap-3">
        <div className="w-full max-w-xs">
          <Input
            label="Buscar"
            placeholder="Nombre, correo, campana..."
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            autoComplete="off"
          />
        </div>
        <div className="w-full max-w-xs">
        <Select
          label="Estado"
          value={filters.statusId === 'all' ? 'all' : String(filters.statusId)}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              statusId: event.target.value === 'all' ? 'all' : Number(event.target.value),
            }))
          }
          options={[
            { label: 'Todos los estados', value: 'all' },
            ...statusOptions.map((status) => ({ value: status.id, label: status.label })),
          ]}
        />
      </div>
      <div className="w-full max-w-xs">
        <Select
          label="Ordenar"
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value === 'oldest' ? 'oldest' : 'recent')}
          options={[
            { label: 'Mas recientes', value: 'recent' },
            { label: 'Mas antiguos', value: 'oldest' },
          ]}
        />
      </div>
      <Button
        type="button"
        variant={filters.onlyUnassigned ? 'primary' : 'ghost'}
        onClick={() => setFilters((prev) => ({ ...prev, onlyUnassigned: !prev.onlyUnassigned }))}
        className="h-10 px-4"
        >
          {filters.onlyUnassigned ? 'Mostrando sin asignar' : 'Solo sin asignar'}
        </Button>
      </div>

      {leadsQuery.isLoading ? (
        <p className="text-sm text-content-muted">Cargando leads...</p>
      ) : filteredLeads.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border-subtle"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  aria-label="Seleccionar todos los leads filtrados"
                />
              </TableHead>
              <TableHead>Lead</TableHead>
              <TableHead>Campana</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Asignado a</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead>Tiempo sin asignar</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead) => {
              const isSelected = selectedIds.includes(lead.id_lead);
              const { assignee, assignedAt } = resolveAssignee(lead as any);
              const fullName =
                `${lead.nombres ?? ''} ${lead.apellidos ?? ''}`.trim() ||
                lead.email ||
                'Lead sin nombre';
              const assigneeName = assignee
                ? `${assignee.nombres ?? ''} ${assignee.apellidos ?? ''}`.trim() ||
                  assignee.email ||
                  'Usuario'
                : 'Sin asignar';
              const assigneeInitials = assignee ? getInitials(assigneeName) : null;
              const unassignedDuration = computeUnassignedDuration(lead.fecha_creacion, assignedAt);

              return (
                <TableRow key={lead.id_lead} className={isSelected ? 'bg-surface-muted/60' : undefined}>
                  <TableCell className="w-10">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border-subtle"
                      checked={isSelected}
                      onChange={() => toggleLeadSelection(lead.id_lead)}
                      aria-label={`Seleccionar lead ${fullName}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-content">{fullName}</span>
                      <span className="text-xs text-content-muted">
                        {lead.email ?? 'Sin correo registrado'}
                      </span>
                      {lead.telefono && (
                        <span className="text-xs text-content-muted">Tel: {lead.telefono}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{lead.campania?.nombre ?? 'Sin campana'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(lead.estado?.nombre ?? lead.estado)}>
                      {normalizeStatusLabel(lead.estado?.nombre ?? lead.estado, 'Pendiente')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {assignee ? (
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600/10 text-xs font-semibold text-primary-700">
                          {assigneeInitials}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-content">{assigneeName}</p>
                          <p className="text-xs text-content-muted">{assignee.email ?? 'Sin correo'}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-content-muted">Sin asignar</span>
                    )}
                  </TableCell>
                  <TableCell>{lead.origen ?? 'No indicado'}</TableCell>
                  <TableCell>{formatDate(lead.fecha_creacion)}</TableCell>
                  <TableCell className="text-sm text-content-muted">{unassignedDuration}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => openEditLeadDialog(lead)}>
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-content-muted">No encontramos leads con los filtros seleccionados.</p>
      )}

      <LeadBulkActionsBar
        selectedCount={selectedIds.length}
        action={selectedAction}
        onActionChange={handleActionChange}
        vendors={vendorOptions}
        statuses={statusOptions}
        selectedVendorId={selectedVendorId}
        onVendorSelect={setSelectedVendorId}
        selectedStatusId={selectedStatusId}
        onStatusSelect={setSelectedStatusId}
        onClear={resetBulkState}
        onConfirm={handleBulkConfirm}
        disabled={bulkMutation.isPending}
      />

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setEditingLead(null);
            setEditLeadState({ estadoId: '', descripcion: '' });
          }
        }}
        title="Editar lead"
        description="Actualiza la informacion del lead seleccionado."
      >
        {editingLead ? (
          <form className="space-y-3" onSubmit={handleEditLeadSubmit}>
            <Select
              label="Estado"
              value={editLeadState.estadoId}
              onChange={(event) =>
                setEditLeadState((prev) => ({ ...prev, estadoId: event.target.value }))
              }
              options={[
                { label: 'No asignado', value: '' },
                ...statusOptions.map((status) => ({
                  value: String(status.id),
                  label: status.label,
                })),
              ]}
            />
            <Textarea
              label="Descripcion"
              minRows={4}
              value={editLeadState.descripcion}
              onChange={(event) =>
                setEditLeadState((prev) => ({ ...prev, descripcion: event.target.value }))
              }
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={editLeadMutation.isLoading}>
                Guardar cambios
              </Button>
            </div>
          </form>
        ) : null}
      </Dialog>

      <Dialog
        open={isMetaDialogOpen}
        onOpenChange={setMetaDialogOpen}
        title="Conectar con Meta Ads"
        description="Sincroniza los formularios publicitarios para recibir leads automaticamente."
      >
        <div className="space-y-3">
          <p className="text-sm text-content-muted">
            Estamos finalizando la integracion con Meta Ads. Muy pronto podras conectar tus formularios y
            recibir leads en tiempo real.
          </p>
          <Alert
            variant="info"
            title="Proximamente"
            description="Recibiras una notificacion cuando esta integracion este disponible."
            onClose={() => setMetaDialogOpen(false)}
          />
        </div>
      </Dialog>

      <Dialog
        open={isImportDialogOpen}
        onOpenChange={setImportDialogOpen}
        title="Importar leads desde Excel"
        description="Sube tu archivo y mapea las columnas para crear leads en bloque."
      >
        <div className="space-y-3">
          <p className="text-sm text-content-muted">
            Aun estamos preparando el asistente de importacion. Pronto podras cargar archivos XLSX o CSV y
            transformar los datos antes de crear los leads.
          </p>
          <Alert
            variant="warning"
            title="Disponible en el siguiente release"
            description="Nuestro equipo esta afinando los ultimos detalles de esta funcionalidad."
            onClose={() => setImportDialogOpen(false)}
          />
        </div>
      </Dialog>
    </section>
  );
};

export default LeadsAdmin;
