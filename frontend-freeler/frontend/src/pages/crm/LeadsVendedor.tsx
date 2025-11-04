import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Lead, LeadService, unwrapLeadCollection } from '@/services/lead.service';
import { useToast } from '@/components/common/Toasts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import LeadBulkActionsBar, {
  BulkStatusOption,
  BulkVendorOption,
  LeadBulkAction,
} from '@/components/crm/LeadBulkActionsBar';
import { getStatusBadgeVariant, normalizeStatusLabel } from '@/utils/badges';
import { formatDate } from '@/utils/helpers';
import { useAuth } from '@/store/auth';

const FALLBACK_COLUMNS = ['Prospecto', 'En gestion', 'Ganado', 'Perdido'] as const;

const FALLBACK_STATUSES: BulkStatusOption[] = [
  { id: 1, label: 'Prospecto' },
  { id: 2, label: 'En gestion' },
  { id: 3, label: 'Ganado' },
  { id: 4, label: 'Perdido' },
];

type FiltersState = {
  search: string;
  statusId: number | 'all';
  campaignId: 'all' | 'none' | number;
};

const DEFAULT_FILTERS: FiltersState = {
  search: '',
  statusId: 'all',
  campaignId: 'all',
};

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

const extractStatusOptions = (raw: any): BulkStatusOption[] => {
  const source = unwrapLeadCollection(raw);

  const mapped = source
    .map((item: any) => ({
      id: Number(item.id_estado_lead ?? item.id ?? item.value ?? 0),
      label: String(item.nombre ?? item.label ?? item.descripcion ?? '').trim() || 'Estado',
    }))
    .filter((option) => option.id);

  return mapped.length ? mapped : FALLBACK_STATUSES;
};

const normalizeLeads = (raw: any): Lead[] => unwrapLeadCollection<Lead>(raw);

const resolveStatusIdByName = (statuses: BulkStatusOption[], name: string) => {
  const match = statuses.find(
    (status) => status.label.toLowerCase() === name.toLowerCase().trim(),
  );
  return match?.id;
};

const selectActiveAssignment = (lead?: Lead | null) => {
  if (!lead) return null;
  const list = Array.isArray(lead.asignaciones) ? lead.asignaciones : [];
  if (!list.length) return null;
  const [first] = [...list].sort((a, b) => {
    const dateA = new Date(a.fecha_asignacion ?? 0).getTime();
    const dateB = new Date(b.fecha_asignacion ?? 0).getTime();
    return dateB - dateA;
  });
  return first;
};

const computeAssignmentDuration = (createdAt?: string, assignedAt?: string | null) => {
  if (!createdAt) return '-';
  const created = new Date(createdAt);
  const end = assignedAt ? new Date(assignedAt) : new Date();
  const diffMs = Math.max(end.getTime() - created.getTime(), 0);
  const totalMinutes = Math.round(diffMs / (1000 * 60));
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const totalHours = Math.round(diffMs / (1000 * 60 * 60));
  if (totalHours < 24) return `${totalHours}h`;
  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;
  return remainingHours ? `${days}d ${remainingHours}h` : `${days}d`;
};

// Lead Vendedor Page
export const LeadsVendedor = () => {
  const { push } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [view, setView] = useState<'table' | 'kanban'>('kanban');
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedAction, setSelectedAction] = useState<LeadBulkAction>(null);
  const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(user?.id ?? null);
  const [kanbanDetail, setKanbanDetail] = useState<'origen' | 'ciudad' | 'telefono' | 'email'>('origen');

  const serverFilters = useMemo(() => {
    const normalizedSearch = filters.search.trim();
    const numericCampaign =
      filters.campaignId !== 'all' && filters.campaignId !== 'none'
        ? Number(filters.campaignId)
        : undefined;
    return {
      limit: 250,
      search: normalizedSearch ? normalizedSearch : undefined,
      id_estado_lead: filters.statusId === 'all' ? undefined : filters.statusId,
      id_campania: numericCampaign,
    };
  }, [filters]);

  const leadsQuery = useQuery({
    queryKey: [
      'crm-leads-assigned',
      user?.id ?? null,
      serverFilters.search ?? null,
      serverFilters.id_estado_lead ?? null,
      filters.campaignId,
    ],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const response = await LeadService.listAssignedToMe(serverFilters);
      return normalizeLeads(response);
    },
  });

  const statusesQuery = useQuery({
    queryKey: ['crm-lead-statuses'],
    queryFn: () => LeadService.getStatuses(),
  });

  const statusOptions = useMemo(
    () => extractStatusOptions(statusesQuery.data),
    [statusesQuery.data],
  );
  const columns = useMemo(
    () => (statusOptions.length ? statusOptions.map((status) => status.label) : [...FALLBACK_COLUMNS]),
    [statusOptions],
  );

  const [leadItems, setLeadItems] = useState<Lead[]>([]);

  useEffect(() => {
    setLeadItems(leadsQuery.data ?? []);
  }, [leadsQuery.data]);

  const campaignOptions = useMemo(() => {
    const map = new Map<string, { value: string; label: string }>();
    leadItems.forEach((lead) => {
      const id = lead.campania?.id_campania;
      if (id) {
        const key = String(id);
        if (!map.has(key)) {
          map.set(key, { value: key, label: lead.campania?.nombre ?? `Campana ${key}` });
        }
      } else {
        map.set('none', { value: 'none', label: 'Sin campana' });
      }
    });
    return [{ value: 'all', label: 'Todas las campanas' }, ...Array.from(map.values())];
  }, [leadItems]);

  const filteredLeads = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return leadItems
      .filter((lead) => {
        if (!term) return true;
        const haystack = [
          lead.nombres,
          lead.apellidos,
          lead.email,
          lead.telefono,
          lead.campania?.nombre,
          lead.origen,
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
        if (filters.campaignId === 'all') return true;
        if (filters.campaignId === 'none') return !lead.campania;
        return lead.campania?.id_campania === Number(filters.campaignId);
      })
      .sort((a, b) => {
        const dateA = new Date(a.fecha_creacion ?? 0).getTime();
        const dateB = new Date(b.fecha_creacion ?? 0).getTime();
        return dateB - dateA;
      });
  }, [leadItems, filters]);

  const selectedLeads = filteredLeads.filter((lead) => selectedIds.includes(lead.id_lead));
  const allSelected =
    filteredLeads.length > 0 && filteredLeads.every((lead) => selectedIds.includes(lead.id_lead));

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => leadItems.some((lead) => lead.id_lead === id)));
  }, [leadItems]);

  useEffect(() => {
    setSelectedIds([]);
    setSelectedAction(null);
    setSelectedVendorId(user?.id ?? null);
    setSelectedStatusId(null);
    setFilters((prev) => ({
      ...prev,
      campaignId: 'all',
    }));
  }, [view]);

  useEffect(() => {
    setSelectedVendorId(user?.id ?? null);
  }, [user?.id]);

  const vendorOptions: BulkVendorOption[] = user?.id
    ? [{ id: user.id, label: 'Asignarme este lead' }]
    : [];

  const statusMutation = useMutation({
    mutationFn: ({ leadId, estadoId }: { leadId: number; estadoId: number }) => {
      if (!user?.id) {
        throw new Error('NO_USER_CONTEXT');
      }
      return LeadService.updateStatus({
        leadId,
        id_estado_lead: estadoId,
        usuarioEmpresaId: user.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads-assigned'] });
    },
    onError: () => {
      push({
        title: 'No se pudo actualizar el estado',
        description: 'Intentalo nuevamente.',
        variant: 'danger',
      });
    },
  });

  const bulkMutation = useMutation({
    mutationFn: LeadService.bulkUpdate,
    onSuccess: () => {
      push({ title: 'Accion aplicada', description: 'Los leads se actualizaron correctamente.' });
      setSelectedIds([]);
      setSelectedAction(null);
      setSelectedStatusId(null);
      queryClient.invalidateQueries({ queryKey: ['crm-leads-assigned'] });
    },
    onError: () => {
      push({
        title: 'No se pudo aplicar la accion',
        description: 'Intentalo nuevamente.',
        variant: 'danger',
      });
    },
  });

  const handleDrop = (column: string, leadId: number) => {
    const statusId = resolveStatusIdByName(statusOptions, column) ?? resolveStatusIdByName(FALLBACK_STATUSES, column);
    if (!statusId) {
      push({
        title: 'Estado desconocido',
        description: 'No pudimos detectar el estado destino.',
        variant: 'danger',
      });
      return;
    }
    statusMutation.mutate(
      { leadId, estadoId: statusId },
      {
        onSuccess: () => {
          setLeadItems((prev) =>
            prev.map((lead) =>
              lead.id_lead === leadId
                ? {
                    ...lead,
                    estado: {
                      id_estado_lead: statusId,
                      nombre: column,
                    },
                  }
                : lead,
            ),
          );
          push({ title: 'Lead actualizado', description: `Estado movido a ${column}.` });
        },
      },
    );
  };

  const handleBulkConfirm = () => {
    if (!selectedAction || !selectedIds.length) return;
    if (!user?.id) {
      push({
        title: 'Sesion requerida',
        description: 'Debes iniciar sesion nuevamente para aplicar esta accion.',
        variant: 'danger',
      });
      return;
    }
    const payload: Parameters<typeof LeadService.bulkUpdate>[0] = {
      leadIds: selectedIds,
      action: selectedAction,
      usuarioEmpresaId: user.id,
    };
    if (selectedAction === 'assign') {
      payload.vendedorId = selectedVendorId ?? undefined;
    }
    if (selectedAction === 'change-status') {
      payload.estadoId = selectedStatusId ?? undefined;
    }
    bulkMutation.mutate(payload);
  };

  const handleActionChange = (action: LeadBulkAction) => {
    setSelectedAction(action);
    if (action === 'assign' && user?.id) {
      setSelectedVendorId(user.id);
    }
    if (action !== 'change-status') setSelectedStatusId(null);
  };

  const groupedByColumn = useMemo(() => {
    const grouped: Record<string, Lead[]> = {};
    columns.forEach((column) => {
      grouped[column] = [];
    });
    leadItems.forEach((lead) => {
      const name = lead.estado?.nombre ?? columns[0];
      const column = columns.find(
        (label) => label.toLowerCase() === (name ?? '').toLowerCase().trim(),
      );
      const bucket = column ?? columns[0];
      if (!grouped[bucket]) grouped[bucket] = [];
      grouped[bucket].push(lead);
    });
    return grouped;
  }, [leadItems, columns]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-content">Mis leads</h1>
          <p className="text-sm text-content-muted">
            Visualiza y actualiza tus leads desde una vista de tabla o tablero.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={view === 'table' ? 'primary' : 'ghost'}
            onClick={() => setView('table')}
          >
            Vista tabla
          </Button>
          <Button
            type="button"
            variant={view === 'kanban' ? 'primary' : 'ghost'}
            onClick={() => setView('kanban')}
          >
            Vista kanban
          </Button>
          <Button variant="outline" onClick={() => leadsQuery.refetch()}>
            Actualizar
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap gap-3">
        <div className="w-full max-w-xs">
          <Input
            label="Buscar"
            placeholder="Nombre o correo"
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
            label="Campana"
            value={filters.campaignId === 'all' ? 'all' : String(filters.campaignId)}
            onChange={(event) => {
              const value = event.target.value;
              setFilters((prev) => ({
                ...prev,
                campaignId:
                  value === 'all'
                    ? 'all'
                    : value === 'none'
                    ? 'none'
                    : (Number(value) as FiltersState['campaignId']),
              }));
            }}
            options={campaignOptions}
          />
        </div>
        <div className="w-full max-w-xs">
          <Select
            label="Detalle en tarjetas"
            value={kanbanDetail}
            onChange={(event) => {
              const value = event.target.value as 'origen' | 'ciudad' | 'telefono' | 'email';
              setKanbanDetail(value);
            }}
            options={[
              { label: 'Mostrar origen', value: 'origen' },
              { label: 'Mostrar ciudad', value: 'ciudad' },
              { label: 'Mostrar telefono', value: 'telefono' },
              { label: 'Mostrar correo', value: 'email' },
            ]}
          />
        </div>
      </div>

      {view === 'table' ? (
        leadsQuery.isLoading ? (
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
                    onChange={() =>
                      setSelectedIds((prev) =>
                        allSelected
                          ? prev.filter((id) => !filteredLeads.some((lead) => lead.id_lead === id))
                          : Array.from(new Set([...prev, ...filteredLeads.map((lead) => lead.id_lead)])),
                      )
                    }
                    aria-label="Seleccionar todos los leads"
                  />
                </TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Campana</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Tiempo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => {
                const isSelected = selectedIds.includes(lead.id_lead);
                const fullName =
                  `${lead.nombres ?? ''} ${lead.apellidos ?? ''}`.trim() ||
                  lead.email ||
                  'Lead sin nombre';
                const assignment = selectActiveAssignment(lead);
                const assignedAt = assignment?.fecha_asignacion ?? null;
                return (
                  <TableRow key={lead.id_lead} className={isSelected ? 'bg-surface-muted/60' : undefined}>
                    <TableCell className="w-10">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border-subtle"
                        checked={isSelected}
                        onChange={() =>
                          setSelectedIds((prev) =>
                            prev.includes(lead.id_lead)
                              ? prev.filter((id) => id !== lead.id_lead)
                              : [...prev, lead.id_lead],
                          )
                        }
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
                    <TableCell>{formatDate(lead.fecha_creacion)}</TableCell>
                    <TableCell className="text-sm text-content-muted">
                      {computeAssignmentDuration(lead.fecha_creacion, assignedAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-content-muted">No hay leads para mostrar.</p>
        )
      ) : leadsQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {columns.map((column) => (
            <div key={column} className="h-64 animate-pulse rounded-lg border border-border bg-surface" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          {columns.map((column) => {
            const leads = groupedByColumn[column] ?? [];
            return (
              <div
                key={column}
                className="flex h-full flex-col rounded-lg border border-border bg-surface-muted"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  const leadId = Number(event.dataTransfer.getData('lead-id'));
                  if (!Number.isNaN(leadId)) {
                    handleDrop(column, leadId);
                  }
                }}
              >
                <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-content-muted">
                    {column}
                  </h2>
                  <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-content-subtle">
                    {leads.length}
                  </span>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
                 {leads.map((lead) => {
                   const fullName =
                     `${lead.nombres ?? ''} ${lead.apellidos ?? ''}`.trim() ||
                     lead.email ||
                     'Lead sin nombre';
                    const extraInfo =
                      kanbanDetail === 'email'
                        ? lead.email ?? 'Sin correo'
                        : kanbanDetail === 'telefono'
                        ? lead.telefono ?? 'Sin telefono'
                        : kanbanDetail === 'ciudad'
                        ? lead.ciudad ?? 'Sin ciudad'
                        : lead.origen ?? 'Origen no registrado';
                    return (
                      <div
                        key={lead.id_lead}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData('lead-id', String(lead.id_lead));
                          event.dataTransfer.effectAllowed = 'move';
                        }}
                        className="rounded-md border border-border bg-surface p-3 text-sm shadow-sm transition hover:border-primary-200"
                      >
                        <p className="font-semibold text-content">{fullName}</p>
                        <p className="text-xs text-content-muted">
                          {lead.campania?.nombre ?? 'Sin campana asignada'}
                        </p>
                        <p className="mt-2 text-xs text-content-muted">{extraInfo}</p>
                      </div>
                    );
                  })}
                  {!leads.length && (
                    <div className="rounded-md border border-dashed border-border-subtle p-3 text-xs text-content-subtle">
                      Sin leads en esta etapa
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'table' && (
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
          onClear={() => {
            setSelectedIds([]);
            setSelectedAction(null);
            setSelectedVendorId(user?.id ?? null);
            setSelectedStatusId(null);
          }}
          onConfirm={handleBulkConfirm}
          disabled={bulkMutation.isPending}
        />
      )}
    </div>
  );
};

export default LeadsVendedor;
