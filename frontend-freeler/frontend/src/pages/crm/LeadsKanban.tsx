import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DragEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LeadService, unwrapLeadCollection } from '@/services/lead.service';
import type { Lead } from '@/services/lead.service';
import { Filter, Pencil, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { useAuth } from '@/store/auth';
import { t } from '@/i18n';
import { useToast } from '@/components/common/Toasts';
import { LeadEditorDrawer } from '@/components/crm/LeadEditorDrawer';

type KanbanVariant = 'vendor' | 'admin';

type FiltersState = {
  search: string;
  campaignId: 'all' | 'none' | number;
};

const DEFAULT_FILTERS: FiltersState = {
  search: '',
  campaignId: 'all',
};

const FALLBACK_COLUMN_KEYS = ['prospect', 'inProgress', 'won', 'lost'] as const;

const KANBAN_COLOR_MAP: Record<
  string,
  { headerBg: string; headerText: string; border: string; pillBg: string; pillText: string; accent: string }
> = {
  pendiente: {
    headerBg: '#FEF3C7',
    headerText: '#92400E',
    border: '#FCD34D',
    pillBg: '#F59E0B',
    pillText: '#1F2937',
    accent: '#F59E0B',
  },
  prospecto: {
    headerBg: '#FEF3C7',
    headerText: '#92400E',
    border: '#FCD34D',
    pillBg: '#F59E0B',
    pillText: '#1F2937',
    accent: '#F59E0B',
  },
  asignado: {
    headerBg: '#DBEAFE',
    headerText: '#1D4ED8',
    border: '#93C5FD',
    pillBg: '#3B82F6',
    pillText: '#F8FAFC',
    accent: '#3B82F6',
  },
  contactado: {
    headerBg: '#E0F2FE',
    headerText: '#0C4A6E',
    border: '#7DD3FC',
    pillBg: '#0284C7',
    pillText: '#F8FAFC',
    accent: '#0284C7',
  },
  'en gestion': {
    headerBg: '#EDE9FE',
    headerText: '#5B21B6',
    border: '#C4B5FD',
    pillBg: '#7C3AED',
    pillText: '#F8FAFC',
    accent: '#7C3AED',
  },
  ganado: {
    headerBg: '#D1FAE5',
    headerText: '#065F46',
    border: '#6EE7B7',
    pillBg: '#059669',
    pillText: '#ECFDF5',
    accent: '#10B981',
  },
  perdido: {
    headerBg: '#FEE2E2',
    headerText: '#991B1B',
    border: '#FCA5A5',
    pillBg: '#DC2626',
    pillText: '#FEF2F2',
    accent: '#EF4444',
  },
};

const getKanbanPalette = (label: string) => {
  const normalized = label?.toLowerCase().trim() ?? '';
  return (
    KANBAN_COLOR_MAP[normalized] ?? {
      headerBg: '#E2E8F0',
      headerText: '#0F172A',
      border: '#CBD5F5',
      pillBg: '#CBD5F5',
      pillText: '#0F172A',
      accent: '#38BDF8',
    }
  );
};

const extractStatusOptions = (raw: unknown) => {
  const source = unwrapLeadCollection(raw);
  return source
    .map((item: any) => ({
      id: Number(item.id_estado_lead ?? item.id ?? item.value ?? 0),
      label: String(item.nombre ?? item.label ?? item.descripcion ?? '').trim() || 'Estado',
    }))
    .filter((option) => option.id);
};

const hasActiveAssignment = (lead?: Lead | null) =>
  Boolean(lead?.asignaciones?.some((assignment) => assignment?.estado === 1));

const resolveDetailValue = (
  lead: Lead,
  field: DetailField,
  fallbacks: { email: string; phone: string; city: string; origin: string },
) => {
  switch (field) {
    case 'email':
      return lead.email ?? fallbacks.email;
    case 'telefono':
      return lead.telefono ?? fallbacks.phone;
    case 'ciudad':
      return lead.ciudad ?? fallbacks.city;
    case 'origen':
    default:
      return lead.origen ?? fallbacks.origin;
  }
};

type LeadsKanbanProps = {
  variant?: KanbanVariant;
};

type DetailField = 'origen' | 'ciudad' | 'telefono' | 'email';

export const LeadsKanban = ({ variant = 'vendor' }: LeadsKanbanProps) => {
  const queryClient = useQueryClient();
  const { push } = useToast();
  const { user } = useAuth();
  const isAdminVariant = variant === 'admin';
  const currentUserId = user?.id ? Number(user.id) : null;
  const fallbackLeadName = t('crmKanban.defaults.leadName');
  const fallbackCampaignLabel = t('crmKanban.defaults.fallbackCampaign');
  const noCampaignLabel = t('crmKanban.defaults.noCampaign');
  const fallbackDetailLabels = useMemo(
    () => ({
      email: t('crmKanban.defaults.details.email'),
      phone: t('crmKanban.defaults.details.phone'),
      city: t('crmKanban.defaults.details.city'),
      origin: t('crmKanban.defaults.details.origin'),
    }),
    [t],
  );
const detailLabelMap = useMemo(
  () => ({
    origen: t('crmKanban.filters.detailOrigin'),
    ciudad: t('crmKanban.filters.detailCity'),
    telefono: t('crmKanban.filters.detailPhone'),
    email: t('crmKanban.filters.detailEmail'),
  }),
  [t],
);

  const detailOptions = useMemo(() => {
    const base: Array<{ value: DetailField; label: string }> = [
      { value: 'origen', label: detailLabelMap.origen },
      { value: 'ciudad', label: detailLabelMap.ciudad },
      { value: 'telefono', label: detailLabelMap.telefono },
      { value: 'email', label: detailLabelMap.email },
    ];
    return isAdminVariant ? base : base.filter((option) => option.value !== 'origen');
  }, [detailLabelMap, isAdminVariant]);

  const [filtersVisible, setFiltersVisible] = useState(true);
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const [kanbanDetails, setKanbanDetails] = useState<DetailField[]>(() =>
    variant === 'vendor' ? ['ciudad'] : ['origen'],
  );
  const [boardOverrides, setBoardOverrides] = useState<Record<number, string>>({});
  const [showOnlyUnassigned, setShowOnlyUnassigned] = useState(false);
  const [drawerLead, setDrawerLead] = useState<Lead | null>(null);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const filterToggleLabel = filtersVisible
    ? t('crmKanban.filters.hideControls')
    : t('crmKanban.filters.showControls');

  useEffect(() => {
    const available = detailOptions.map((option) => option.value);
    setKanbanDetails((prev) => {
      const filtered = prev.filter((field) => available.includes(field));
      if (filtered.length) return filtered;
      return available.length ? [available[0]] : prev;
    });
  }, [detailOptions]);


  const normalizedSearch = filters.search.trim();
  const campaignFilterId =
    filters.campaignId === 'all' || filters.campaignId === 'none'
      ? undefined
      : Number(filters.campaignId);

  const leadsQuery = useQuery({
    queryKey: [
      'crm-kanban',
      variant,
      user?.companyId ?? null,
      currentUserId,
      normalizedSearch || 'all',
      filters.campaignId,
      showOnlyUnassigned ? 'unassigned' : 'assigned',
    ],
    enabled: isAdminVariant ? Boolean(user?.companyId) : Boolean(currentUserId),
    queryFn: async () => {
      if (isAdminVariant) {
        const response = await LeadService.listByEmpresa({
          page: 1,
          limit: 500,
          search: normalizedSearch || undefined,
          id_campania: campaignFilterId,
          solo_sin_asignar: showOnlyUnassigned || undefined,
        });
        return unwrapLeadCollection<Lead>(response);
      }

      if (showOnlyUnassigned) {
        if (user?.type !== 'empresa') {
          return [];
        }
        const response = await LeadService.listByEmpresa({
          page: 1,
          limit: 500,
          search: normalizedSearch || undefined,
          id_campania: campaignFilterId,
          solo_sin_asignar: true,
        });
        return unwrapLeadCollection<Lead>(response);
      }

      if (user?.type === 'empresa' && currentUserId) {
        try {
          const response = await LeadService.listByEmpresa({
            page: 1,
            limit: 500,
            search: normalizedSearch || undefined,
            id_campania: campaignFilterId,
            asignado_a_usuario_empresa_id: currentUserId,
          });
          return unwrapLeadCollection<Lead>(response);
        } catch (error) {
          console.warn('[CRM][Kanban] listByEmpresa vendor fallback', error);
        }
      }

      const rows = await LeadService.listVendorUniverse({
        filters: {
          limit: 500,
          search: normalizedSearch || undefined,
          id_campania: campaignFilterId,
        },
        includeEmpresa: user?.type === 'empresa',
        freelerUserId: user?.type === 'freeler' ? currentUserId : null,
        empresaUserId: user?.type === 'empresa' ? currentUserId : null,
      });
      return Array.isArray(rows) ? rows : [];
    },
    keepPreviousData: true,
  });

  const campaignOptions = useMemo(() => {
    const dataset = leadsQuery.data ?? [];
    const map = new Map<number, string>();
    let hasNoCampaign = false;
    dataset.forEach((lead) => {
      const campaignId = lead.campania?.id_campania;
      if (campaignId) {
        map.set(campaignId, lead.campania?.nombre ?? fallbackCampaignLabel);
      } else {
        hasNoCampaign = true;
      }
    });
    const options = Array.from(map.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([id, label]) => ({ value: String(id), label }));
    if (hasNoCampaign) {
      options.unshift({ value: 'none', label: t('crmKanban.filters.campaignNone') });
    }
    return options;
  }, [fallbackCampaignLabel, leadsQuery.data, t]);

  const statusesQuery = useQuery({
    queryKey: ['crm-lead-statuses'],
    queryFn: () => LeadService.getStatuses(),
  });
  const fallbackStatuses = useMemo(
    () => [
      { id: 1, label: t('crmKanban.defaults.status.pending') },
      { id: 2, label: t('crmKanban.defaults.status.assigned') },
      { id: 3, label: t('crmKanban.defaults.status.contact') },
      { id: 4, label: t('crmKanban.defaults.status.inProgress') },
      { id: 5, label: t('crmKanban.defaults.status.lost') },
      { id: 6, label: t('crmKanban.defaults.status.won') },
    ],
    [t],
  );
  const statusOptions = useMemo(() => {
    const extracted = extractStatusOptions(statusesQuery.data);
    return extracted.length ? extracted : fallbackStatuses;
  }, [fallbackStatuses, statusesQuery.data]);
  const fallbackColumns = useMemo(
    () => FALLBACK_COLUMN_KEYS.map((key) => t(`crmKanban.defaults.columns.${key}`)),
    [t],
  );
  const columns = useMemo(
    () => (statusOptions.length ? statusOptions.map((status) => status.label) : fallbackColumns),
    [statusOptions, fallbackColumns],
  );

  const getStatusLabelById = useCallback(
    (statusId?: number | null) => {
      if (typeof statusId !== 'number') return null;
      const fromOptions = statusOptions.find((status) => status.id === statusId);
      if (fromOptions) return fromOptions.label;
      const fallback = fallbackStatuses.find((status) => status.id === statusId);
      return fallback?.label ?? null;
    },
    [fallbackStatuses, statusOptions],
  );

  const leads = leadsQuery.data ?? [];

  useEffect(() => {
    setBoardOverrides((prev) => {
      if (!Object.keys(prev).length) return prev;
      if (!leads.length) {
        return Object.keys(prev).length ? {} : prev;
      }
      const byId = new Map<number, Lead>();
      leads.forEach((lead) => byId.set(lead.id_lead, lead));
      const allowedColumns = new Set(columns.map((column) => normalizeLabel(column)));
      let changed = false;
      const next: Record<number, string> = {};
      Object.entries(prev).forEach(([key, value]) => {
        const id = Number(key);
        const normalized = normalizeLabel(value);
        if (!allowedColumns.has(normalized)) {
          changed = true;
          return;
        }
        const lead = byId.get(id);
        if (!lead) {
          changed = true;
          return;
        }
        const currentStatusLabel = normalizeLabel(lead.estado?.nombre ?? '');
        if (currentStatusLabel === normalized) {
          changed = true;
          return;
        }
        next[id] = value;
      });
      return changed ? next : prev;
    });
  }, [columns, leads]);
  const filteredLeads = useMemo(() => {
    return leads
      .filter((lead) => {
        if (filters.campaignId === 'none') {
          return !lead.campania;
        }
        return true;
      })
      .filter((lead) => (showOnlyUnassigned ? !hasActiveAssignment(lead) : true))
      .sort((a, b) => {
        const dateA = new Date(a.fecha_creacion ?? 0).getTime();
        const dateB = new Date(b.fecha_creacion ?? 0).getTime();
        return dateB - dateA;
      });
  }, [filters.campaignId, leads, showOnlyUnassigned]);

  const groupedByColumn = useMemo(() => {
    const grouped: Record<string, Lead[]> = {};
    const defaultColumn = columns[0] ?? '';
    columns.forEach((column) => {
      grouped[column] = [];
    });
    filteredLeads.forEach((lead) => {
      const override = boardOverrides[lead.id_lead];
      const sourceStatus = override ?? lead.estado?.nombre ?? defaultColumn;
      const column = columns.find(
        (label) => label.toLowerCase() === (sourceStatus ?? '').toLowerCase().trim(),
      );
      const bucket = column ?? defaultColumn;
      if (!grouped[bucket]) grouped[bucket] = [];
      grouped[bucket].push(lead);
    });
    return grouped;
  }, [boardOverrides, columns, filteredLeads]);

  const invalidateRelatedQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['crm-kanban'] });
    queryClient.invalidateQueries({ queryKey: ['crm-admin-leads'] });
    queryClient.invalidateQueries({ queryKey: ['crm-vendor-leads-table'] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ leadId, estadoId }: { leadId: number; estadoId: number }) => {
      if (!currentUserId) throw new Error('NO_USER_CONTEXT');
      return LeadService.updateStatus({
        leadId,
        id_estado_lead: estadoId,
        usuarioEmpresaId: currentUserId,
      });
    },
    onSuccess: () => {
      invalidateRelatedQueries();
    },
    onError: () => {
      push({
        title: t('crmKanban.messages.statusUnknown'),
        description: t('crmKanban.messages.statusUnknown'),
        variant: 'danger',
      });
    },
  });

  const handleCardEdit = (lead: Lead) => {
    setDrawerLead(lead);
    setDrawerOpen(true);
  };

  const handleDragStart = (event: DragEvent<HTMLDivElement>, leadId: number) => {
    event.dataTransfer.setData('lead-id', String(leadId));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, columnLabel: string) => {
    event.preventDefault();
    const leadId = Number(event.dataTransfer.getData('lead-id'));
    if (!Number.isFinite(leadId)) return;
    const draggedLead = leads.find((lead) => lead.id_lead === leadId);
    const fallbackStatus = boardOverrides[leadId] ?? draggedLead?.estado?.nombre ?? columns[0];
    const normalizedTarget = normalizeLabel(columnLabel);
    const normalizedCurrent = normalizeLabel(fallbackStatus ?? '');
    if (normalizedCurrent === normalizedTarget) {
      return;
    }

    const statusId =
      resolveStatusIdByName(statusOptions, columnLabel) ??
      resolveStatusIdByName(fallbackStatuses, columnLabel);
    if (!statusId) {
      push({
        title: t('crmKanban.messages.statusUnknown'),
        description: t('crmKanban.messages.statusUnknown'),
        variant: 'danger',
      });
      return;
    }

    setBoardOverrides((prev) => ({ ...prev, [leadId]: columnLabel }));
    statusMutation.mutate(
      { leadId, estadoId: statusId },
      {
        onError: () => {
          setBoardOverrides((prev) => {
            const next = { ...prev };
            if (draggedLead?.estado?.nombre) {
              next[leadId] = draggedLead.estado.nombre;
            } else {
              delete next[leadId];
            }
            return next;
          });
        },
      },
    );
  };

  const handleCardStatusChange = (lead: Lead, nextStatusId: number) => {
    if (!lead || !Number.isFinite(nextStatusId)) return;
    const nextLabel = getStatusLabelById(nextStatusId) ?? columns[0] ?? '';
    if (!nextLabel) return;
    const currentLabel = boardOverrides[lead.id_lead] ?? lead.estado?.nombre ?? '';
    if (normalizeLabel(currentLabel) === normalizeLabel(nextLabel)) return;
    setBoardOverrides((prev) => ({ ...prev, [lead.id_lead]: nextLabel }));
    statusMutation.mutate(
      { leadId: lead.id_lead, estadoId: nextStatusId },
      {
        onError: () => {
          setBoardOverrides((prev) => {
            const next = { ...prev };
            if (lead.estado?.nombre) {
              next[lead.id_lead] = lead.estado.nombre;
            } else {
              delete next[lead.id_lead];
            }
            return next;
          });
        },
      },
    );
  };

  return (
    <>
      <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-content">{t('crmKanban.title')}</h1>
          <p className="text-sm text-content-muted">{t('crmKanban.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            className="gap-2"
            onClick={() => setFiltersVisible((prev) => !prev)}
            leftIcon={<Filter className="h-4 w-4" />}
          >
            {filterToggleLabel}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-10 w-10 p-0"
            onClick={() => leadsQuery.refetch()}
            aria-label={t('crmKanban.actions.refresh')}
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {filtersVisible && (
        <div className="flex flex-wrap items-end gap-3">
        <div className="w-full max-w-xs">
          <Input
            label={t('crmKanban.filters.searchLabel')}
            placeholder={t('crmKanban.filters.searchPlaceholder')}
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            autoComplete="off"
          />
        </div>
        <div className="w-full max-w-xs">
          <Select
            label={t('crmKanban.filters.campaign')}
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
            options={[
              { label: t('crmKanban.filters.campaignAll'), value: 'all' },
              ...campaignOptions,
            ]}
          />
        </div>
        <div className="w-full max-w-xs">
          <MultiSelect
            label={t('crmKanban.filters.detail')}
            placeholder={t('crmKanban.filters.detailPlaceholder')}
            values={kanbanDetails}
            options={detailOptions}
            onChange={(selection) => {
              const allowed = detailOptions.map((option) => option.value);
              if (!selection.length) {
                if (allowed.length) {
                  setKanbanDetails([allowed[0]]);
                }
                return;
              }
              const sanitized = selection.filter((value): value is DetailField =>
                allowed.includes(value as DetailField),
              );
              if (sanitized.length) {
                setKanbanDetails(sanitized);
              } else if (allowed.length) {
                setKanbanDetails([allowed[0]]);
              }
            }}
          />
        </div>
        <div className="flex w-full max-w-xs items-end self-end">
          <Switch
            label={t('crmKanban.filters.onlyUnassigned')}
            checked={showOnlyUnassigned}
            onChange={(event) => setShowOnlyUnassigned(event.target.checked)}
            aria-label={t('crmKanban.filters.onlyUnassigned')}
          />
        </div>
      </div>
      )}

      {leadsQuery.isLoading ? (
        <p className="text-sm text-content-muted">{t('crmKanban.messages.loading')}</p>
      ) : (
        <div className="overflow-x-auto pb-3">
          <div className="flex gap-4 pr-4">
            {columns.map((column) => {
              const leadsForColumn = groupedByColumn[column] ?? [];
              const palette = getKanbanPalette(column);
              return (
                <div
                  key={column}
                  className="flex h-[480px] flex-col rounded-2xl border bg-surface"
                  style={{ width: '7.5cm', minWidth: '7.5cm', borderColor: palette.border }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDrop(event, column)}
                >
                  <div
                    className="flex items-center justify-between gap-2 rounded-t-2xl border-b px-3 py-2"
                    style={{ backgroundColor: palette.headerBg, color: palette.headerText, borderColor: palette.border }}
                  >
                    <h2 className="text-[11px] font-semibold uppercase tracking-wider">{column}</h2>
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={{ backgroundColor: palette.pillBg, color: palette.pillText }}
                    >
                      {leadsForColumn.length}
                    </span>
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto px-2 py-3">
                    {leadsForColumn.map((lead) => {
                      const fullName =
                        `${lead.nombres ?? ''} ${lead.apellidos ?? ''}`.trim() ||
                        lead.email ||
                        fallbackLeadName;
                      const detailEntries = kanbanDetails.map((detailKey) => ({
                        key: detailKey,
                        label: detailLabelMap[detailKey],
                        value: resolveDetailValue(lead, detailKey, fallbackDetailLabels),
                      }));
                      const overrideLabel = boardOverrides[lead.id_lead];
                      const effectiveStatusId = overrideLabel
                        ? resolveStatusIdByName(statusOptions, overrideLabel) ??
                          resolveStatusIdByName(fallbackStatuses, overrideLabel) ??
                          lead.id_estado_lead
                        : lead.id_estado_lead;
                      return (
                        <div
                          key={lead.id_lead}
                          draggable
                          onDragStart={(event) => handleDragStart(event, lead.id_lead)}
                          className="w-full cursor-grab rounded-md border bg-surface px-3 py-2 text-xs shadow-sm transition hover:shadow-md active:cursor-grabbing"
                          style={{
                            borderColor: palette.border,
                            borderLeftColor: palette.accent,
                            borderLeftWidth: '6px',
                            borderLeftStyle: 'solid',
                          }}
                        >
                          <div className="mb-1 flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-content">{fullName}</p>
                              <p className="text-[11px] text-content-muted">
                                {lead.campania?.nombre ?? noCampaignLabel}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-content-muted hover:text-content"
                              onClick={() => handleCardEdit(lead)}
                              aria-label={t('crmKanban.actions.editLead')}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <Select
                            label={t('crmKanban.filters.status')}
                            value={effectiveStatusId ? String(effectiveStatusId) : ''}
                            onChange={(event) => {
                              const nextId = Number(event.target.value);
                              if (Number.isFinite(nextId)) {
                                handleCardStatusChange(lead, nextId);
                              }
                            }}
                            options={[
                              { value: '', label: t('crmKanban.filters.statusAll') },
                              ...statusOptions.map((status) => ({ value: String(status.id), label: status.label })),
                            ]}
                          />
                          <div className="mt-2 grid gap-1">
                            {detailEntries.map((entry) => (
                              <div
                                key={`${lead.id_lead}-${entry.key}`}
                                className="rounded-md bg-surface-muted px-2 py-1 text-[11px] text-content break-words"
                              >
                                <p className="text-[10px] font-semibold text-content-muted">{entry.label}</p>
                                <p className="text-[11px] text-content break-words">{entry.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {!leadsForColumn.length && (
                      <div className="rounded-md border border-dashed border-border-subtle p-3 text-[11px] text-content-subtle">
                        {t('crmKanban.messages.columnEmpty')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {!columns.length && <p className="text-sm text-content-muted">{t('crmKanban.messages.empty')}</p>}
        </div>
      )}
      </div>
      <LeadEditorDrawer
        open={isDrawerOpen}
        lead={drawerLead}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerLead(null);
        }}
        variant={isAdminVariant ? 'admin' : 'vendor'}
        onUpdated={() => invalidateRelatedQueries()}
      />
    </>
  );
};

export default LeadsKanban;

const normalizeLabel = (value?: string | null) => (value ?? '').trim().toLowerCase();

const resolveStatusIdByName = (statuses: Array<{ id: number; label: string }>, name: string) => {
  const normalized = normalizeLabel(name);
  const match = statuses.find((status) => normalizeLabel(status.label) === normalized);
  return match?.id ?? null;
};
