import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ChevronRight, Loader2, XCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LeadService, unwrapLeadCollection } from '@/services/lead.service';
import type {
  Lead,
  LeadDraft,
  LeadImportPreview,
  LeadImportJob,
  LeadImportJobStatus,
} from '@/services/lead.service';
import { CampaignService } from '@/services/campaign.service';
import type { Campaign } from '@/services/campaign.service';
import { UserService } from '@/services/user.service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { Alert } from '@/components/common/Alert';
import LeadBulkActionsBar from '@/components/crm/LeadBulkActionsBar';
import type { BulkStatusOption, BulkVendorOption, LeadBulkAction } from '@/components/crm/LeadBulkActionsBar';
import { getStatusBadgeVariant, normalizeStatusLabel } from '@/utils/badges';
import { formatDate } from '@/utils/helpers';
import { useToast } from '@/components/common/Toasts';
import { mapBackendRole, Role } from '@/utils/constants';
import { useAuth } from '@/store/auth';

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
  { id: 1, label: 'Pendiente' },
  { id: 2, label: 'Asignado' },
  { id: 3, label: 'Contactado' },
  { id: 4, label: 'En gestion' },
  { id: 5, label: 'Perdido' },
  { id: 6, label: 'Ganado' },
];

const getApiErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object') {
    const maybeResponse = (error as { response?: { data?: unknown } }).response;
    const data = maybeResponse?.data as { message?: unknown };
    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message;
    }
    if (Array.isArray(data?.message)) {
      return data.message.join(', ');
    }
    const fallback = (error as { message?: string }).message;
    if (typeof fallback === 'string' && fallback.trim()) {
      return fallback;
    }
  }
  return 'Ocurrió un error inesperado. Inténtalo nuevamente.';
};
const REQUIRED_IMPORT_FIELDS: Array<{
  key: string;
  label: string;
  required: boolean;
  optionalLabel?: string;
}> = [
  { key: 'dni', label: 'DNI', required: false},
  { key: 'nombres', label: 'Nombres', required: true },
  { key: 'apellidos', label: 'Apellidos', required: false},
  { key: 'telefono', label: 'Telefono', required: true },
  { key: 'email', label: 'Email', required: false},
  { key: 'ciudad', label: 'Ciudad', required: false},
  { key: 'ocupacion', label: 'Ocupacion', required: false},
  { key: 'descripcion', label: 'Descripcion', required: false},
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
  if (!fullName) return `${initials}${email ? ` Â· ${email}` : ''}`;
  return `${initials} Â· ${fullName}`;
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
    const [first] = [...lead.asignaciones].sort((a: any, b: any) => {
      const dateA = new Date(a.fecha_asignacion ?? 0).getTime();
      const dateB = new Date(b.fecha_asignacion ?? 0).getTime();
      return dateB - dateA;
    });
    const assigneeCandidate = first?.usuario ?? first?.asignado ?? first;
    return {
      assignee: assigneeCandidate,
      assignedAt: first?.fecha_asignacion ?? null,
    };
  }

  return { assignee: null, assignedAt: null };
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

const extractVendorOptions = (raw: any): BulkVendorOption[] => {
  const source = unwrapLeadCollection(raw);
  return source
    .filter((user: any) => mapBackendRole(user.rol?.nombre) === Role.VENDEDOR)
    .map((user: any) => ({
      id: Number(user.id_usuario_empresa ?? user.id ?? 0),
      label: buildVendorLabel(user.nombres, user.apellidos, user.email),
    }))
    .filter((option) => option.id);
};

const normalizeLeads = (raw: any): Lead[] => unwrapLeadCollection<Lead>(raw);

type ImportReportPanelProps = {
  job: LeadImportJob;
  isOpen: boolean;
  isLoading: boolean;
  onToggle: () => void;
  onDismiss: () => void;
};

const buildImportRowEntries = (job: LeadImportJob) => {
  if (!job.total) return [];
  const rowErrors = (job.errors ?? []).filter((entry) => (entry.row ?? 0) >= 2);
  const errorMap = new Map<number, string[]>();
  rowErrors.forEach((entry) => {
    if (entry.row) {
      errorMap.set(entry.row, entry.issues ?? []);
    }
  });
  return Array.from({ length: job.total }, (_, index) => {
    const rowNumber = index + 2;
    return { rowNumber, issues: errorMap.get(rowNumber) ?? null };
  });
};

const ImportReportPanel = ({
  job,
  isOpen,
  isLoading,
  onToggle,
  onDismiss,
}: ImportReportPanelProps) => {
  const summaryLabel = job.total
    ? `${job.created} de ${job.total} leads importados. Errores: ${job.failed}`
    : 'La importación no procesó filas. Revisa los errores detectados.';
  const startedLabel = job.startedAt
    ? new Date(job.startedAt).toLocaleString()
    : new Date(job.finishedAt ?? Date.now()).toLocaleString();
  const statusLabel = job.status === 'completed' ? 'Completada' : 'Fallida';
  const statusClass =
    job.status === 'completed' ? 'text-emerald-600 bg-emerald-50' : 'text-error-600 bg-error-50';
  const entries = buildImportRowEntries(job);
  const generalIssues = (job.errors ?? []).filter((entry) => !entry.row || entry.row < 2);

  return (
    <div className="rounded-lg border border-border-subtle bg-surface shadow-sm">
      <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 items-start gap-3 text-left"
        >
          <ChevronRight
            className={`mt-1 h-4 w-4 text-content-muted transition-transform ${isOpen ? 'rotate-90' : ''}`}
          />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-content">Resultado de importación</p>
            <p className="text-xs text-content-muted">{summaryLabel}</p>
            <p className="text-xs text-content-muted">
              ID: {job.importId} · Inicio: {startedLabel}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
            {statusLabel}
          </span>
          <button
            type="button"
            className="text-sm font-medium text-primary-600 hover:underline"
            onClick={onDismiss}
          >
            Ocultar
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="border-t border-border-subtle px-4 py-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-content-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Consultando estado...</span>
            </div>
          ) : (
            <>
              <div className="mb-3 grid gap-2 text-xs text-content-muted sm:grid-cols-2 lg:grid-cols-4">
                <span>
                  <span className="font-semibold text-content">Procesadas:</span>{' '}
                  {job.processed}/{job.total}
                </span>
                <span>
                  <span className="font-semibold text-content">Creadas:</span> {job.created}
                </span>
                <span>
                  <span className="font-semibold text-content">Errores:</span> {job.failed}
                </span>
                <span>
                  <span className="font-semibold text-content">Import ID:</span> {job.importId}
                </span>
              </div>
              {generalIssues.length ? (
                <div className="mb-3 rounded-md border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700">
                  {generalIssues.map((error, index) => (
                    <p key={`general-${index}`}>
                      {error.row && error.row >= 2 ? `Fila ${error.row}: ` : ''}
                      {error.issues.join(', ')}
                    </p>
                  ))}
                </div>
              ) : null}
              {entries.length ? (
                <div className="max-h-64 overflow-auto rounded-md border border-border-subtle">
                  <ul className="divide-y divide-border-subtle text-sm">
                    {entries.map((entry) => (
                      <li key={`import-row-${entry.rowNumber}`} className="flex items-start gap-3 p-3">
                        {entry.issues ? (
                          <XCircle className="mt-0.5 h-4 w-4 text-error-500" />
                        ) : (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                        )}
                        <div>
                          <p className="font-medium text-content">Fila {entry.rowNumber}</p>
                          <p className="text-xs text-content-muted">
                            {entry.issues ? entry.issues.join('; ') : 'Lead creado correctamente.'}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-content-muted">
                  No hay filas detalladas para esta importación. Revisa los mensajes generales.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export const LeadsAdmin = () => {
  const { push } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedAction, setSelectedAction] = useState<LeadBulkAction>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null);
  const [isMetaDialogOpen, setMetaDialogOpen] = useState(false);
  const [isImportDialogOpen, setImportDialogOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<LeadImportPreview | null>(null);
  const [headerMapping, setHeaderMapping] = useState<Record<string, string>>({});
  const [importError, setImportError] = useState<string | null>(null);
  const [isUploadingImport, setUploadingImport] = useState(false);
  const [isConfirmingImport, setConfirmingImport] = useState(false);
  const [activeImportJob, setActiveImportJob] = useState<LeadImportJob | null>(null);
  const [isDownloadingTemplate, setDownloadingTemplate] = useState(false);
  const [importReport, setImportReport] = useState<LeadImportJob | null>(null);
  const [isImportReportOpen, setImportReportOpen] = useState(false);
  const [isImportReportLoading, setImportReportLoading] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent');
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editLeadState, setEditLeadState] = useState<{ estadoId: string; descripcion: string }>({
    estadoId: '',
    descripcion: '',
  });
  const importJobHandledRef = useRef<Record<string, LeadImportJobStatus | undefined>>({});
  const isImportProcessing = activeImportJob?.status === 'pending' || activeImportJob?.status === 'processing';

  const companyId = user?.companyId ?? null;

  const leadsQuery = useQuery({
    queryKey: ['crm-admin-leads', user?.companyId],
    queryFn: () => LeadService.listByEmpresa({ limit: 250 }),
    enabled: Boolean(user),
  });

  const importCampaignsQuery = useQuery({
    queryKey: ['crm-import-campaigns', companyId],
    queryFn: () => CampaignService.getAll({ id_empresa: companyId ?? undefined, estado: 1, limit: 500 }),
    enabled: Boolean(companyId) && isImportDialogOpen,
  });

  const campaignOptions = useMemo(() => {
    const payload = importCampaignsQuery.data;
    const campaigns: Campaign[] = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload)
      ? payload
      : [];
    return campaigns
      .filter((camp) => typeof camp?.id_campania === 'number')
      .map((camp) => ({ value: String(camp.id_campania), label: camp.nombre }));
  }, [importCampaignsQuery.data]);

  const hasCampaignOptions = campaignOptions.length > 0;
  const selectedCampaignLabel = useMemo(() => {
    return campaignOptions.find((option) => option.value === selectedCampaignId)?.label ?? '';
  }, [campaignOptions, selectedCampaignId]);
  const canUploadFile = hasCampaignOptions;
  const importProgressPercent = useMemo(() => {
    if (!activeImportJob || !activeImportJob.total) return 0;
    return Math.min(100, Math.round((activeImportJob.processed / activeImportJob.total) * 100));
  }, [activeImportJob]);
  const importProgressSummary = useMemo(() => {
    if (!activeImportJob) return '';
    if (!activeImportJob.total) return 'Preparando archivo...';
    return `${activeImportJob.processed}/${activeImportJob.total} filas procesadas`;
  }, [activeImportJob]);

  const resetImportState = () => {
    setImportPreview(null);
    setHeaderMapping({});
    setSelectedCampaignId('');
    setImportError(null);
    setUploadingImport(false);
    setConfirmingImport(false);
    setActiveImportJob(null);
    importJobHandledRef.current = {};
  };

  const handleDismissImportReport = () => {
    setImportReport(null);
    setImportReportOpen(false);
  };

  const loadImportReport = useCallback(async (job: LeadImportJob) => {
    setImportReportLoading(true);
    try {
      const latest = await LeadService.getImportProgress(job.importId);
      setImportReport(latest);
      setImportReportOpen(true);
    } catch {
      setImportReport(job);
      setImportReportOpen(true);
    } finally {
      setImportReportLoading(false);
    }
  }, []);

  const handleImportDialogChange = (open: boolean) => {
    if (!open && isImportProcessing) return;
    setImportDialogOpen(open);
    if (!open) resetImportState();
  };

  const handleImportFile = async (file?: File) => {
    if (!file) return;
    setActiveImportJob(null);
    importJobHandledRef.current = {};
    setUploadingImport(true);
    setImportError(null);
    try {
      const preview = await LeadService.previewImport(file);
      setImportPreview(preview);
      setHeaderMapping(preview.suggestedMapping || {});
    } catch (error) {
      setImportError(getApiErrorMessage(error));
    } finally {
      setUploadingImport(false);
    }
  };

  const handleImportJobResult = useCallback(
    async (job: LeadImportJob) => {
      if (job.status === 'completed') {
        await loadImportReport(job);
        resetImportState();
        setImportDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ['crm-admin-leads'] });
        return;
      }
      if (job.status === 'failed') {
        await loadImportReport(job);
        const summary =
          job.errors
            .slice(0, 3)
            .map((item) => `Fila ${item.row || '?'}: ${item.issues.join(', ')}`)
            .join(' | ') || 'La importaci�n fall�. Revisa el archivo e int�ntalo nuevamente.';
        setImportError(summary);
      }
    },
    [loadImportReport, queryClient, resetImportState, setImportDialogOpen],
  );
  const handleImportFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    void handleImportFile(file);
    event.target.value = '';
  };

  const handleMappingChange = (field: string, header: string) => {
    setHeaderMapping((prev) => ({ ...prev, [field]: header }));
  };

  const handleConfirmImport = async () => {
    if (!importPreview || isImportProcessing) return;
    if (!selectedCampaignId) {
      setImportError('Selecciona una campaÃ±a para continuar.');
      return;
    }
    const missing = REQUIRED_IMPORT_FIELDS.filter((field) => field.required && !headerMapping[field.key]);
    if (missing.length) {
      setImportError('Completa el mapeo de todos los campos obligatorios antes de confirmar.');
      return;
    }
    setConfirmingImport(true);
    setImportError(null);
    try {
      const actorLabel = (user?.email || `Usuario ${user?.id ?? ''}`).trim();
      const job = await LeadService.confirmImport({
        importId: importPreview.importId,
        mapping: headerMapping,
        campaignId: Number(selectedCampaignId),
        actorLabel: actorLabel || undefined,
      });
      setActiveImportJob(job);
    } catch (error) {
      setImportError(getApiErrorMessage(error));
    } finally {
      setConfirmingImport(false);
    }
  };

  useEffect(() => {
    if (!activeImportJob) return;
    if (activeImportJob.status === 'completed' || activeImportJob.status === 'failed') {
      const handledStatus = importJobHandledRef.current[activeImportJob.importId];
      if (handledStatus === activeImportJob.status) return;
      importJobHandledRef.current[activeImportJob.importId] = activeImportJob.status;
      void handleImportJobResult(activeImportJob);
      return;
    }
    const intervalId = window.setInterval(async () => {
      try {
        const nextJob = await LeadService.getImportProgress(activeImportJob.importId);
        setActiveImportJob(nextJob);
      } catch {
        // ignore polling errors
      }
    }, 1500);
    return () => window.clearInterval(intervalId);
  }, [activeImportJob, handleImportJobResult]);

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const blob = await LeadService.downloadImportTemplate();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'plantilla_leads.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      push({
        title: 'No se pudo descargar la plantilla',
        description: 'Revisa tu conexiÃ³n e intenta nuevamente.',
        variant: 'danger',
      });
    } finally {
      setDownloadingTemplate(false);
    }
  };

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
    if (!selectedAction || !user) {
      if (!selectedAction) return;
      push({
        title: 'Sin sesion de empresa',
        description: 'Inicia sesion nuevamente para aplicar acciones masivas.',
        variant: 'danger',
      });
      return;
    }
    const payload: Parameters<typeof LeadService.bulkUpdate>[0] = {
      leadIds: selectedIds,
      action: selectedAction,
      usuarioEmpresaId: user.id,
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
      {importReport ? (
        <ImportReportPanel
          job={importReport}
          isOpen={isImportReportOpen}
          isLoading={isImportReportLoading}
          onToggle={() => setImportReportOpen((prev) => !prev)}
          onDismiss={handleDismissImportReport}
        />
      ) : null}

      <div className="flex flex-wrap gap-3">
        <div className="w-full max-w-xs">
          <Input
            label="Buscar"
            placeholder="Nombre, correo, campaÃ±a..."
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
              <TableHead>CampaÃ±a</TableHead>
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
                  <TableCell>{lead.campania?.nombre ?? 'Sin campaÃ±a'}</TableCell>
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
        open={isImportDialogOpen}
        onOpenChange={handleImportDialogChange}
        title="Importar leads desde Excel"
        description="Sube tu archivo y mapea las columnas para crear leads en bloque."
      >
        <div className="space-y-4">
          {!importPreview ? (
            <>
              <div className="space-y-2">
                {importCampaignsQuery.isLoading ? (
                  <p className="text-xs text-content-muted">Cargando campaÃ±as disponibles...</p>
                ) : !hasCampaignOptions ? (
                  <Alert
                    variant="warning"
                    title="No hay campaÃ±as activas"
                    description="Crea una campaÃ±a para poder importar leads."
                    onClose={() => handleImportDialogChange(false)}
                  />
                ) : (
                  <p className="text-xs text-content-muted">
                    Luego de subir el archivo podrÃ¡s elegir la campaÃ±a destino durante el mapeo.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-content">Archivo</label>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleImportFileInput}
                  disabled={!canUploadFile || isUploadingImport}
                  className="w-full rounded-md border border-border-subtle bg-surface px-3 py-2 text-sm"
                />
                {importError ? (
                  <p className="text-sm text-error-500">{importError}</p>
                ) : (
                  <p className="text-xs text-content-muted">Formatos soportados: CSV, XLSX, XLS (mÃ¡x. 5 MB).</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={handleDownloadTemplate} isLoading={isDownloadingTemplate}>
                  Descargar plantilla
                </Button>
                <Button type="button" variant="ghost" onClick={() => handleImportDialogChange(false)}>
                  Cerrar
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-content">Vista previa detectada</p>
                  <p className="text-xs text-content-muted">
                    Ajusta el mapeo de columnas antes de confirmar la importaciÃ³n.
                  </p>
                </div>
                <Button type="button" variant="ghost" onClick={resetImportState} disabled={isImportProcessing}>
                  Subir otro archivo
                </Button>
              </div>
              {activeImportJob ? (
                <div className="space-y-3 rounded-lg border border-border-subtle p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-content">Procesando importaciÃ³n</p>
                      <p className="text-xs text-content-muted">{importProgressSummary}</p>
                    </div>
                    <span className="text-sm font-semibold text-content">{importProgressPercent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-border-subtle">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${importProgressPercent}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap justify-between text-xs text-content-muted">
                    <span>
                      Creados: <span className="font-semibold text-content">{activeImportJob.created}</span>
                    </span>
                    <span>
                      Con errores: <span className="font-semibold text-content">{activeImportJob.failed}</span>
                    </span>
                  </div>
                  {activeImportJob.errors.length ? (
                    <div className="rounded-md bg-surface-muted/60 p-3">
                      <p className="text-xs font-semibold uppercase text-content-muted">Errores recientes</p>
                      <ul className="mt-2 space-y-1 text-xs text-content">
                        {activeImportJob.errors.slice(0, 3).map((error, index) => (
                          <li key={`import-error-${index}`}>
                            Fila {error.row || '?'}: {error.issues.join(', ')}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="space-y-2 rounded-lg border border-border-subtle p-3">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-medium text-content">CampaÃ±a destino</p>
                      {selectedCampaignLabel ? (
                        <span className="text-xs text-content-muted">Seleccionada: {selectedCampaignLabel}</span>
                      ) : null}
                    </div>
                    <Select
                      label="CampaÃ±a"
                      required
                      value={selectedCampaignId}
                      onChange={(event) => setSelectedCampaignId(event.target.value)}
                      disabled={importCampaignsQuery.isLoading || !hasCampaignOptions || isImportProcessing}
                      options={[
                        { label: 'Selecciona una campaÃ±a', value: '' },
                        ...campaignOptions,
                      ]}
                    />
                    {importCampaignsQuery.isLoading ? (
                      <p className="text-xs text-content-muted">Actualizando campaÃ±as...</p>
                    ) : !hasCampaignOptions ? (
                      <Alert
                        variant="warning"
                        title="No hay campaÃ±as activas"
                        description="Crea una campaÃ±a para poder confirmar la importaciÃ³n."
                        onClose={() => handleImportDialogChange(false)}
                      />
                    ) : (
                      <p className="text-xs text-content-muted">
                        Selecciona la campaÃ±a que recibirÃ¡ todos los leads de esta importaciÃ³n.
                      </p>
                    )}
                  </div>
                  <div className="space-y-3">
                    {REQUIRED_IMPORT_FIELDS.map((field) => (
                      <div key={field.key} className="flex flex-col gap-1 sm:flex-row sm:items-center">
                        <span className="w-full text-sm font-medium text-content sm:w-48">
                          {field.label}
                          {field.required ? (
                            <span className="text-error-500"> *</span>
                          ) : field.optionalLabel ? (
                            <span className="ml-1 text-xs font-normal text-content-muted">
                              ({field.optionalLabel})
                            </span>
                          ) : null}
                        </span>
                        <select
                          className="w-full rounded-md border border-border-subtle bg-surface px-3 py-2 text-sm"
                          value={headerMapping[field.key] ?? ''}
                          onChange={(event) => handleMappingChange(field.key, event.target.value)}
                          disabled={isImportProcessing}
                        >
                          <option value="">Selecciona una columna</option>
                          {importPreview.headers.map((header) => (
                            <option key={`${field.key}-${header}`} value={header}>
                              {header}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <div className="space-y-2 rounded-lg border border-border-subtle p-3">
                <p className="text-sm font-medium text-content">Muestra de filas</p>
                <div className="max-h-60 overflow-auto">
                  <table className="min-w-full text-xs">
                    <thead className="bg-surface-muted">
                      <tr>
                        {importPreview.headers.map((header) => (
                          <th key={`header-${header}`} className="px-2 py-1 text-left font-semibold">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.sampleRows.map((row, index) => (
                        <tr key={`sample-${index}`} className="odd:bg-surface even:bg-surface-muted/40">
                          {importPreview.headers.map((header) => (
                            <td key={`sample-${index}-${header}`} className="px-2 py-1">
                              {row[header] ?? ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {importError ? <p className="text-sm text-error-500">{importError}</p> : null}
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => handleImportDialogChange(false)} disabled={isImportProcessing}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmImport}
                  isLoading={isConfirmingImport || isImportProcessing}
                  disabled={!selectedCampaignId || isImportProcessing}
                >
                  {isImportProcessing ? 'Procesando...' : 'Confirmar importaciÃ³n'}
                </Button>
              </div>
            </div>
          )}
        </div>
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

    </section>
  );
};

export default LeadsAdmin;



