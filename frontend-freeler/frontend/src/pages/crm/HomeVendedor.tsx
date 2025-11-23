import { useQuery } from '@tanstack/react-query';
import { LeadService } from '@/services/lead.service';
import type { Lead } from '@/services/lead.service';
import { KPI } from '@/components/common/KPI';
import { useAuth } from '@/store/auth';
import { EmptyState } from '@/components/common/EmptyState';
import { Users, Target, Trophy, Activity, UserX, Sparkles } from 'lucide-react';
import { t } from '@/i18n';

export const HomeVendedor = () => {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ['crm-vendedor-leads-summary', user?.id ?? null, user?.companyId ?? null, user?.type ?? null],
    enabled: Boolean(user?.id),
    queryFn: () => {
      const vendorId = user?.id ? Number(user.id) : null;
      return LeadService.listVendorUniverse({
        filters: { limit: 250, asignado_a_usuario_empresa_id: vendorId ?? undefined },
        includeEmpresa: user?.type === 'empresa',
        freelerUserId: user?.type === 'freeler' ? vendorId : null,
        empresaUserId: user?.type === 'empresa' ? vendorId : null,
      });
    },
  });

  if (!user) {
    return (
      <EmptyState
        title={t('crmVendorHome.emptyState.title')}
        description={t('crmVendorHome.emptyState.description')}
      />
    );
  }

  const leads = data ?? [];
  const lowerStatus = (lead: Lead) => (lead.estado?.nombre ?? '').toLowerCase();
  const ganados = leads.filter((lead) => lowerStatus(lead) === 'ganado').length;
  const perdidos = leads.filter((lead) => lowerStatus(lead) === 'perdido').length;
  const activos = leads.filter((lead) => {
    const status = lowerStatus(lead);
    return status !== 'ganado' && status !== 'perdido';
  }).length;
  const sinAsignar = leads.filter((lead) => !lead.asignaciones?.some((assignment) => assignment.estado === 1)).length;
  const nuevos = leads.filter((lead) => {
    if (!lead.fecha_creacion) return false;
    const created = new Date(lead.fecha_creacion).getTime();
    const diffDays = (Date.now() - created) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  }).length;
  const conversionRate = leads.length ? Math.round((ganados / leads.length) * 100) : 0;

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-content">{t('crmVendorHome.title')}</h1>
        <p className="text-sm text-content-muted">{t('crmVendorHome.subtitle')}</p>
      </header>
      <div className="grid gap-4 md:grid-cols-4">
        <KPI
          label={t('crmVendorHome.kpis.assigned')}
          value={leads.length}
          icon={<Users className="h-5 w-5" />}
          className="border-l-4 border-primary-500 bg-primary-50 dark:bg-primary-500/10"
        />
        <KPI
          label={t('crmVendorHome.kpis.inProgress')}
          value={activos}
          icon={<Activity className="h-5 w-5" />}
          className="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-500/10"
        />
        <KPI
          label={t('crmVendorHome.kpis.won')}
          value={ganados}
          icon={<Trophy className="h-5 w-5" />}
          className="border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
        />
        <KPI
          label={t('crmVendorHome.kpis.lost')}
          value={perdidos}
          icon={<Target className="h-5 w-5" />}
          className="border-l-4 border-rose-500 bg-rose-50 dark:bg-rose-500/10"
        />
        <KPI
          label={t('crmVendorHome.kpis.conversion')}
          value={`${conversionRate}%`}
          icon={<Sparkles className="h-5 w-5" />}
          className="border-l-4 border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
        />
        <KPI
          label={t('crmVendorHome.kpis.unassigned')}
          value={sinAsignar}
          icon={<UserX className="h-5 w-5" />}
          className="border-l-4 border-slate-500 bg-slate-50 dark:bg-slate-600/20"
        />
        <KPI
          label={t('crmVendorHome.kpis.newLeads')}
          value={nuevos}
          icon={<Users className="h-5 w-5" />}
          className="border-l-4 border-sky-500 bg-sky-50 dark:bg-sky-500/10"
        />
      </div>
    </section>
  );
};

export default HomeVendedor;
