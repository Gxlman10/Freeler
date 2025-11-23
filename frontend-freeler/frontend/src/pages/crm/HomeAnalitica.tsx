import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { KPI } from '@/components/common/KPI';
import { Button } from '@/components/ui/Button';
import { LeadService } from '@/services/lead.service';
import type { Lead } from '@/services/lead.service';
import { CommissionService } from '@/services/commission.service';
import { CampaignService } from '@/services/campaign.service';
import { UserService } from '@/services/user.service';
import type { UsuarioEmpresa } from '@/services/user.service';
import { useAuth } from '@/store/auth';
import { mapBackendRole, Role } from '@/utils/constants';
import { t } from '@/i18n';

const CURRENT_YEAR = new Date().getFullYear();
const FALLBACK_STATUSES = [
  { id_estado_lead: 1, nombre: 'Pendiente' },
  { id_estado_lead: 2, nombre: 'Asignado' },
  { id_estado_lead: 3, nombre: 'Contactado' },
  { id_estado_lead: 4, nombre: 'En gestion' },
  { id_estado_lead: 5, nombre: 'Perdido' },
  { id_estado_lead: 6, nombre: 'Ganado' },
];

const numberFormatter = new Intl.NumberFormat('es-PE');
const currencyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  maximumFractionDigits: 0,
});
const formatNumber = (value: number) => numberFormatter.format(value);
const formatCurrency = (value: number) => currencyFormatter.format(Math.round(value));

type AnalyticsFilters = {
  year: string;
  month: string;
  origin: string;
  campaignId: string;
  vendorId: string;
  statusId: string;
};

const DEFAULT_FILTERS: AnalyticsFilters = {
  year: String(CURRENT_YEAR),
  month: 'all',
  origin: 'all',
  campaignId: 'all',
  vendorId: 'all',
  statusId: 'all',
};

const ORIGIN_COLORS = ['#f97316', '#6366f1', '#0ea5e9', '#14b8a6', '#f472b6', '#facc15'];

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

const resolveUserName = (usuario?: UsuarioEmpresa | null) => {
  if (!usuario) return '-';
  const fullName = `${usuario.nombres ?? ''} ${usuario.apellidos ?? ''}`.trim();
  return fullName || usuario.email || '-';
};

const normalizeStatus = (lead: Lead) => (lead.estado?.nombre ?? '').trim().toLowerCase();
const getLeadOwnerId = (lead: Lead) => {
  const assignment = lead.asignaciones?.find((item) => item?.estado === 1);
  return assignment?.id_asignado_usuario_empresa ?? assignment?.asignado?.id_usuario_empresa ?? null;
};

export const HomeAnalitica = () => {
  const { user } = useAuth();
  const companyId = user?.companyId;
  const isAdmin = user?.role === Role.ADMIN;
  const canFilterByVendor = user?.role === Role.ADMIN || user?.role === Role.SUPERVISOR;
  const [filters, setFilters] = useState<AnalyticsFilters>(DEFAULT_FILTERS);
  const [filtersVisible, setFiltersVisible] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const applyVisibility = () => setFiltersVisible(mediaQuery.matches);
    const handleChange = (event: MediaQueryListEvent) => setFiltersVisible(event.matches);
    applyVisibility();
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['crm-analytics', companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      if (!companyId) throw new Error('MISSING_COMPANY');
      const [leadsPayload, campaignsResponse, statusesResponse, usuariosResponse] = await Promise.all([
        LeadService.collectForEmpresa(companyId, {}, 250),
        CampaignService.getAll({ id_empresa: companyId, limit: 200 }),
        LeadService.getStatuses(),
        UserService.getUsuariosEmpresa({ id_empresa: companyId, limit: 500 }),
      ]);
      let commissionsPayload: { data: any[] } = { data: [] };
      try {
        commissionsPayload = await CommissionService.collectAll({ id_empresa: companyId }, 250);
      } catch (error) {
        console.warn('[CRM][Analytics] commissions fallback', error);
        commissionsPayload = { data: [] };
      }

      const campaigns = Array.isArray(campaignsResponse?.data)
        ? campaignsResponse.data
        : Array.isArray(campaignsResponse)
          ? campaignsResponse
          : [];
      const usuarios = Array.isArray(usuariosResponse?.data)
        ? usuariosResponse.data
        : Array.isArray(usuariosResponse)
          ? usuariosResponse
          : [];
      const statuses = Array.isArray(statusesResponse?.data)
        ? statusesResponse.data
        : Array.isArray(statusesResponse)
          ? statusesResponse
          : [];

      return {
        leads: leadsPayload.data,
        commissions: commissionsPayload.data,
        campaigns,
        usuarios,
        statuses,
      };
    },
  });

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    data?.leads.forEach((lead) => {
      if (!lead.fecha_creacion) return;
      const year = new Date(lead.fecha_creacion).getFullYear();
      if (Number.isFinite(year)) years.add(String(year));
    });
    data?.commissions.forEach((commission) => {
      if (!commission.fecha_pago) return;
      const year = new Date(commission.fecha_pago).getFullYear();
      if (Number.isFinite(year)) years.add(String(year));
    });
    if (!years.size) {
      years.add(String(CURRENT_YEAR));
    }
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [data]);

  useEffect(() => {
    if (!availableYears.length) return;
    if (filters.year !== 'all' && !availableYears.includes(filters.year)) {
      setFilters((prev) => ({ ...prev, year: availableYears[0] ?? 'all' }));
    }
  }, [availableYears, filters.year]);

  const vendors = useMemo(
    () =>
      (data?.usuarios ?? []).filter(
        (usuario) => mapBackendRole(usuario.rol?.nombre) === Role.VENDEDOR,
      ),
    [data?.usuarios],
  );

  const statusesCatalog = useMemo(() => {
    const catalog = data?.statuses?.length ? data.statuses : FALLBACK_STATUSES;
    return catalog;
  }, [data?.statuses]);

  const campaignOptions = useMemo(() => {
    const base = [{ value: 'all', label: t('common.allCampaigns') }];
    const items =
      data?.campaigns?.map((campaign) => ({
        value: String(campaign.id_campania),
        label: campaign.nombre,
      })) ?? [];
    return base.concat(items);
  }, [data?.campaigns]);

  const originOptions = useMemo(() => {
    const entries = new Map<string, string>();
    data?.leads?.forEach((lead) => {
      if (!lead.origen) return;
      const normalized = lead.origen.trim().toLowerCase();
      if (!entries.has(normalized)) {
        entries.set(normalized, lead.origen);
      }
    });
    return [
      { value: 'all', label: t('common.allOrigins') },
      ...Array.from(entries.entries()).map(([value, label]) => ({ value, label })),
    ];
  }, [data?.leads]);

  const vendorOptions = useMemo(() => {
    return [
      { value: 'all', label: t('common.allVendors') },
      ...vendors.map((vendor) => ({
        value: String(vendor.id_usuario_empresa),
        label: resolveUserName(vendor),
      })),
    ];
  }, [vendors]);

  const statusOptions = useMemo(() => {
    return [
      { value: 'all', label: t('common.allStatuses') },
      ...statusesCatalog.map((status) => ({
        value: String(status.id_estado_lead),
        label: status.nombre,
      })),
    ];
  }, [statusesCatalog]);

  const monthOptions = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, index) => {
      const monthNumber = index + 1;
      return {
        value: String(monthNumber),
        label: t(`common.months.${monthNumber}`),
      };
    });
    return [{ value: 'all', label: t('common.allMonths') }, ...months];
  }, []);

  const yearOptions = useMemo(() => {
    return [
      { value: 'all', label: t('common.all') },
      ...availableYears.map((year) => ({ value: year, label: year })),
    ];
  }, [availableYears]);

  const yearFilter = filters.year === 'all' ? null : Number(filters.year);
  const monthFilter = filters.month === 'all' ? null : Number(filters.month);

  const leadById = useMemo(() => {
    const map = new Map<number, Lead>();
    data?.leads?.forEach((lead) => {
      map.set(lead.id_lead, lead);
    });
    return map;
  }, [data?.leads]);

  const matchDate = useCallback((rawDate?: string | null) => {
    if (!rawDate) return false;
    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return false;
    if (yearFilter && date.getFullYear() !== yearFilter) return false;
    if (monthFilter && date.getMonth() + 1 !== monthFilter) return false;
    return true;
  }, [yearFilter, monthFilter]);

  const filteredLeads = useMemo(() => {
    if (!data?.leads?.length) return [];
    return data.leads.filter((lead) => {
      if (!matchDate(lead.fecha_creacion)) return false;
      if (filters.origin !== 'all') {
        const normalized = (lead.origen ?? '').trim().toLowerCase();
        if (normalized !== filters.origin) return false;
      }
      if (filters.campaignId !== 'all' && Number(filters.campaignId) !== lead.id_campania) {
        return false;
      }
      if (filters.statusId !== 'all' && Number(filters.statusId) !== lead.id_estado_lead) {
        return false;
      }
      if (filters.vendorId !== 'all') {
        const ownerId = getLeadOwnerId(lead);
        if (ownerId !== Number(filters.vendorId)) return false;
      }
      return true;
    });
  }, [data?.leads, filters, matchDate]);

  const filteredCommissions = useMemo(() => {
    if (!data?.commissions?.length) return [];
    return data.commissions.filter((commission) => {
      if (!matchDate(commission.fecha_pago)) return false;
      if (filters.campaignId !== 'all' && Number(filters.campaignId) !== commission.id_campania) {
        return false;
      }
      if (filters.vendorId !== 'all') {
        const lead = commission.id_lead ? leadById.get(commission.id_lead) : null;
        const ownerId = lead ? getLeadOwnerId(lead) : null;
        if (ownerId !== Number(filters.vendorId)) return false;
      }
      return true;
    });
  }, [data?.commissions, filters, leadById, matchDate]);

  const leadsByCampaign = useMemo(() => {
    if (!filteredLeads.length) return [];
    const labels = new Map<number, string>();
    (data?.campaigns ?? []).forEach((campaign) => {
      labels.set(campaign.id_campania, campaign.nombre);
    });
    const counts = new Map<string, number>();
    filteredLeads.forEach((lead) => {
      const label =
        labels.get(lead.id_campania ?? 0) ?? lead.campania?.nombre ?? t('common.campaign');
      counts.set(label, (counts.get(label) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [filteredLeads, data?.campaigns]);

  const leadsByOriginData = useMemo(() => {
    if (!filteredLeads.length) return [];
    const fallback = t('crmAnalytics.charts.noOrigin');
    const counts = new Map<string, number>();
    filteredLeads.forEach((lead) => {
      const label = lead.origen?.trim() || fallback;
      counts.set(label, (counts.get(label) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([label, total]) => ({ label, total }))
      .sort((a, b) => b.total - a.total);
  }, [filteredLeads]);

  const funnelData = useMemo(() => {
    if (!filteredLeads.length) {
      return statusesCatalog.map((status) => ({ label: status.nombre, value: 0 }));
    }
    return statusesCatalog.map((status) => ({
      label: status.nombre,
      value: filteredLeads.filter((lead) => lead.id_estado_lead === status.id_estado_lead).length,
    }));
  }, [filteredLeads, statusesCatalog]);

  const monthlyCommissionData = useMemo(() => {
    const accumulator = Array.from({ length: 12 }, () => 0);
    filteredCommissions.forEach((commission) => {
      if (!commission.fecha_pago) return;
      const date = new Date(commission.fecha_pago);
      if (Number.isNaN(date.getTime())) return;
      const index = date.getMonth();
      const amount = Number(commission.monto ?? 0);
      accumulator[index] += Number.isFinite(amount) ? amount : 0;
    });
    return accumulator.map((total, index) => ({
      month: t(`common.months.${index + 1}`).slice(0, 3),
      total: Number(total.toFixed(2)),
    }));
  }, [filteredCommissions]);

  const vendorCards = useMemo(() => {
    const cards = vendors.map((vendor) => {
      const vendorLeads = filteredLeads.filter(
        (lead) => getLeadOwnerId(lead) === vendor.id_usuario_empresa,
      );
      const assigned = vendorLeads.length;
      const won = vendorLeads.filter((lead) => normalizeStatus(lead) === 'ganado').length;
      const lost = vendorLeads.filter((lead) => normalizeStatus(lead) === 'perdido').length;
      const winRate = assigned ? Math.round((won / assigned) * 100) : 0;
      return {
        id: vendor.id_usuario_empresa,
        name: resolveUserName(vendor),
        email: vendor.email,
        assigned,
        won,
        lost,
        winRate,
      };
    });
    if (filters.vendorId === 'all') {
      return cards;
    }
    return cards.filter((card) => String(card.id) === filters.vendorId);
  }, [vendors, filteredLeads, filters.vendorId]);

  const filteredWonLeads = filteredLeads.filter((lead) => normalizeStatus(lead) === 'ganado');
  const filteredLostLeads = filteredLeads.filter((lead) => normalizeStatus(lead) === 'perdido');

  if (!companyId) {
    return <p className="text-sm text-content-muted">{t('crmPanel.emptyCompany')}</p>;
  }

  if (isLoading) {
    return <p className="text-sm text-content-muted">{t('crmAnalytics.loading')}</p>;
  }

  if (isError || !data) {
    return <p className="text-sm text-red-500">{t('crmAnalytics.error')}</p>;
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-primary-500">{t('nav.analytics')}</p>
          <h1 className="mt-1 text-3xl font-semibold text-content">{t('crmAnalytics.title')}</h1>
          <p className="text-sm text-content-muted">{t('crmAnalytics.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-medium text-content">{t('crmAnalytics.filters.title')}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFiltersVisible((prev) => !prev)}
            className="inline-flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            <span>{filtersVisible ? t('crmAnalytics.filters.hide') : t('crmAnalytics.filters.show')}</span>
            {filtersVisible ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {filtersVisible && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Select
            label={t('crmAnalytics.filters.year')}
            value={filters.year}
            onChange={(event) => setFilters((prev) => ({ ...prev, year: event.target.value }))}
            options={yearOptions}
          />
          <Select
            label={t('crmAnalytics.filters.month')}
            value={filters.month}
            onChange={(event) => setFilters((prev) => ({ ...prev, month: event.target.value }))}
            options={monthOptions}
          />
          {isAdmin && (
            <Select
              label={t('crmAnalytics.filters.origin')}
              value={filters.origin}
              onChange={(event) => setFilters((prev) => ({ ...prev, origin: event.target.value }))}
              options={originOptions}
            />
          )}
          <Select
            label={t('crmAnalytics.filters.campaign')}
            value={filters.campaignId}
            onChange={(event) => setFilters((prev) => ({ ...prev, campaignId: event.target.value }))}
            options={campaignOptions}
          />
          {canFilterByVendor && (
            <Select
              label={t('crmAnalytics.filters.vendor')}
              value={filters.vendorId}
              onChange={(event) => setFilters((prev) => ({ ...prev, vendorId: event.target.value }))}
              options={vendorOptions}
            />
          )}
          <Select
            label={t('crmAnalytics.filters.status')}
            value={filters.statusId}
            onChange={(event) => setFilters((prev) => ({ ...prev, statusId: event.target.value }))}
            options={statusOptions}
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <KPI label={t('crmAnalytics.kpis.leads')} value={formatNumber(filteredLeads.length)} />
        <KPI label={t('crmAnalytics.kpis.won')} value={formatNumber(filteredWonLeads.length)} />
        <KPI label={t('crmAnalytics.kpis.lost')} value={formatNumber(filteredLostLeads.length)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-content">{t('crmAnalytics.charts.commissionLine')}</h2>
              <p className="text-xs text-content-muted">{t('crmAnalytics.charts.commissionHint')}</p>
            </div>
            <div className="h-72">
              {filteredCommissions.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyCommissionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatCurrency(Number(value))} />
                    <Tooltip formatter={(value: number) => formatCurrency(Number(value))} />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-content-muted">{t('crmAnalytics.empty')}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <h2 className="text-lg font-semibold text-content">{t('crmAnalytics.charts.leadsByCampaign')}</h2>
            <div className="h-72">
              {leadsByCampaign.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={leadsByCampaign}
                    layout="vertical"
                    margin={{ left: 20, right: 12, top: 8, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="2 2" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={140} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#10b981" radius={[0, 4, 4, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-content-muted">{t('crmAnalytics.empty')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-3">
            <h2 className="text-lg font-semibold text-content">{t('crmAnalytics.charts.leadsByStatus')}</h2>
            <div className="h-72">
              {filteredLeads.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <FunnelChart>
                    <Tooltip />
                    <Funnel
                      dataKey="value"
                      data={funnelData}
                      isAnimationActive={false}
                      stroke="#6366f1"
                      fill="#6366f1"
                    >
                      <LabelList position="right" dataKey="label" fill="#0f172a" stroke="none" />
                      <LabelList position="inside" dataKey="value" fill="#ffffff" stroke="none" />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-content-muted">{t('crmAnalytics.empty')}</p>
              )}
            </div>
          </CardContent>
        </Card>
        {isAdmin && (
          <Card>
            <CardContent className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold text-content">{t('crmAnalytics.charts.leadsByOrigin')}</h2>
                <p className="text-xs text-content-muted">
                  {t('crmAnalytics.charts.leadsByOriginMonthHint')}
                </p>
              </div>
              <div className="h-72">
                {leadsByOriginData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leadsByOriginData} margin={{ left: 8, right: 8, top: 16, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="total" fill="#f97316" radius={[4, 4, 0, 0]} barSize={24}>
                        {leadsByOriginData.map((entry, index) => (
                          <Cell key={`${entry.label}-${index}`} fill={ORIGIN_COLORS[index % ORIGIN_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-content-muted">{t('crmAnalytics.empty')}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        <Card className={isAdmin ? 'lg:col-span-2' : undefined}>
          <CardContent className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-content">{t('crmAnalytics.charts.vendorPerformance')}</h2>
              <p className="text-sm text-content-muted">{t('crmAnalytics.charts.vendorPerformanceHint')}</p>
            </div>
            {vendorCards.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {vendorCards.map((card) => (
                  <div
                    key={card.id}
                    className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-muted text-lg font-semibold text-primary-600">
                          {getInitials(card.name)}
                        </div>
                        <div>
                          <p className="text-base font-semibold text-content">{card.name}</p>
                          <p className="text-sm text-content-muted">{card.email ?? '-'}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-primary-600">{card.winRate}%</span>
                    </div>
                    <div className="mt-4 h-2 w-full rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-primary-500"
                        style={{ width: `${Math.min(card.winRate, 100)}%` }}
                      />
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-content-muted">{t('crmAnalytics.vendorCard.assigned')}</dt>
                        <dd className="text-lg font-semibold text-content">{card.assigned}</dd>
                      </div>
                      <div>
                        <dt className="text-content-muted">{t('crmAnalytics.vendorCard.won')}</dt>
                        <dd className="text-lg font-semibold text-emerald-600">{card.won}</dd>
                      </div>
                      <div>
                        <dt className="text-content-muted">{t('crmAnalytics.vendorCard.lost')}</dt>
                        <dd className="text-lg font-semibold text-red-500">{card.lost}</dd>
                      </div>
                      <div>
                        <dt className="text-content-muted">{t('crmAnalytics.vendorCard.winRate')}</dt>
                        <dd className="text-lg font-semibold text-primary-600">{card.winRate}%</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-content-muted">{t('crmAnalytics.empty')}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default HomeAnalitica;
