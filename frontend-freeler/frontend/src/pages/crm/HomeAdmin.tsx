import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Award,
  Building2,
  Target,
  TrendingDown,
  Trophy,
  Users2,
} from 'lucide-react';
import { KPI } from '@/components/common/KPI';
import { CampaignService } from '@/services/campaign.service';
import { LeadService } from '@/services/lead.service';
import type { Lead } from '@/services/lead.service';
import { UserService } from '@/services/user.service';
import type { UsuarioEmpresa } from '@/services/user.service';
import { mapBackendRole, Role } from '@/utils/constants';
import { useAuth } from '@/store/auth';
import { t } from '@/i18n';

const numberFormatter = new Intl.NumberFormat('es-PE');
const formatNumber = (value: number) => numberFormatter.format(value);

const normalizeStatus = (lead: Lead) => (lead.estado?.nombre ?? '').trim().toLowerCase();
const getLeadOwnerId = (lead: Lead) => {
  const assignment = lead.asignaciones?.find((item) => item?.estado === 1);
  return (
    assignment?.id_asignado_usuario_empresa ?? assignment?.asignado?.id_usuario_empresa ?? null
  );
};

const resolveUserName = (usuario?: UsuarioEmpresa | null) => {
  if (!usuario) return '';
  const fullName = `${usuario.nombres ?? ''} ${usuario.apellidos ?? ''}`.trim();
  return fullName || usuario.email || '-';
};

export const HomeAdmin = () => {
  const { user } = useAuth();
  const companyId =
    user?.companyId ??
    (user && typeof (user as Record<string, unknown>).empresaId === 'number'
      ? ((user as Record<string, number>).empresaId as number)
      : (user as Record<string, any>)?.empresa?.id_empresa);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['crm-admin-dashboard', companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      if (!companyId) throw new Error('MISSING_COMPANY');
      const [campaignsResponse, usersResponse, leadsResponse] = await Promise.all([
        CampaignService.getAll({ id_empresa: companyId, limit: 200 }),
        UserService.getUsuariosEmpresa({ id_empresa: companyId, limit: 500 }),
        LeadService.collectForEmpresa(companyId, {}, 250),
      ]);
      const campaigns = Array.isArray(campaignsResponse?.data)
        ? campaignsResponse.data
        : Array.isArray(campaignsResponse?.items)
          ? campaignsResponse.items
          : Array.isArray(campaignsResponse)
            ? campaignsResponse
            : [];
      const usuarios = Array.isArray(usersResponse?.data)
        ? usersResponse.data
        : Array.isArray(usersResponse?.items)
          ? usersResponse.items
          : Array.isArray(usersResponse)
            ? usersResponse
            : [];
      return {
        campaigns,
        usuarios,
        leads: leadsResponse.data,
      };
    },
  });

  const metrics = useMemo(() => {
    if (!data) {
      return {
        campaigns: 0,
        activeUsers: 0,
        vendors: {
          total: 0,
          list: [] as UsuarioEmpresa[],
        },
        leads: {
          total: 0,
          won: 0,
          lost: 0,
        },
        topSeller: null as { name: string; won: number } | null,
      };
    }
    const activeUsers = data.usuarios.filter((usuario) => Number(usuario.estado) === 1);
    const vendors = activeUsers.filter(
      (usuario) => mapBackendRole(usuario.rol?.nombre) === Role.VENDEDOR,
    );
    const leads = data.leads ?? [];
    const wonLeads = leads.filter((lead) => normalizeStatus(lead) === 'ganado');
    const lostLeads = leads.filter((lead) => normalizeStatus(lead) === 'perdido');

    const vendorMap = new Map<number, UsuarioEmpresa>();
    vendors.forEach((vendor) => vendorMap.set(vendor.id_usuario_empresa, vendor));

    const vendorWins = wonLeads.reduce<Record<number, number>>((acc, lead) => {
      const ownerId = getLeadOwnerId(lead);
      if (!ownerId || !vendorMap.has(ownerId)) return acc;
      acc[ownerId] = (acc[ownerId] ?? 0) + 1;
      return acc;
    }, {});

    const topVendorId = Object.entries(vendorWins)
      .sort((a, b) => b[1] - a[1])
      .map(([vendorId]) => Number(vendorId))[0];

    const topSeller = topVendorId
      ? {
          name: resolveUserName(vendorMap.get(topVendorId)),
          won: vendorWins[topVendorId] ?? 0,
        }
      : null;

    return {
      campaigns: data.campaigns.length,
      activeUsers: activeUsers.length,
      vendors: {
        total: vendors.length,
        list: vendors,
      },
      leads: {
        total: leads.length,
        won: wonLeads.length,
        lost: lostLeads.length,
      },
      topSeller,
    };
  }, [data]);

  if (!companyId) {
    return (
      <p className="text-sm text-content-muted">{t('crmPanel.emptyCompany')}</p>
    );
  }

  if (isLoading) {
    return (
      <p className="text-sm text-content-muted">{t('crmPanel.loading')}</p>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-500">{t('crmPanel.error')}</p>
    );
  }

  const kpis = [
    {
      key: 'campaigns',
      label: t('crmPanel.kpis.campaigns'),
      value: formatNumber(metrics.campaigns),
      icon: <Building2 className="h-5 w-5" />,
    },
    {
      key: 'activeUsers',
      label: t('crmPanel.kpis.activeUsers'),
      value: formatNumber(metrics.activeUsers),
      icon: <Users2 className="h-5 w-5" />,
    },
    {
      key: 'vendors',
      label: t('crmPanel.kpis.vendors'),
      value: formatNumber(metrics.vendors.total),
      icon: <Activity className="h-5 w-5" />,
    },
    {
      key: 'topSeller',
      label: t('crmPanel.kpis.topSeller'),
      value: metrics.topSeller?.name ?? t('common.noData'),
      icon: <Award className="h-5 w-5" />,
      trend: metrics.topSeller
        ? {
            label: t('crmPanel.kpis.topSellerLabel'),
            value: metrics.topSeller.won,
            variant: 'plain',
          }
        : undefined,
    },
    {
      key: 'monitored',
      label: t('crmPanel.kpis.monitoredLeads'),
      value: formatNumber(metrics.leads.total),
      icon: <Target className="h-5 w-5" />,
    },
    {
      key: 'wonLeads',
      label: t('crmPanel.kpis.wonLeads'),
      value: formatNumber(metrics.leads.won),
      icon: <Trophy className="h-5 w-5 text-emerald-600" />,
    },
    {
      key: 'lostLeads',
      label: t('crmPanel.kpis.lostLeads'),
      value: formatNumber(metrics.leads.lost),
      icon: <TrendingDown className="h-5 w-5 text-red-500" />,
    },
  ];

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-wide text-primary-500">{t('nav.dashboard')}</p>
        <h1 className="mt-1 text-3xl font-semibold text-content">{t('crmPanel.title')}</h1>
        <p className="text-sm text-content-muted">{t('crmPanel.subtitle')}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KPI
            key={kpi.key}
            label={kpi.label}
            value={kpi.value}
            icon={kpi.icon}
            trend={kpi.trend}
          />
        ))}
      </div>
    </section>
  );
};

export default HomeAdmin;
