import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/store/auth';
import { LeadService } from '@/services/lead.service';
import { KPI } from '@/components/common/KPI';
import { MiniChart } from '@/components/common/MiniChart';
import { EmptyState } from '@/components/common/EmptyState';

export const DashboardReferidos = () => {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ['leads-mine-dashboard', user?.id],
    queryFn: () => LeadService.listMine(user?.id ?? 0),
    enabled: Boolean(user?.id),
  });

  const leads = useMemo(() => {
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
  }, [data]);

  if (!user) {
    return (
      <EmptyState
        title="Inicia sesin"
        description="Necesitas iniciar sesin para ver tus mtricas."
      />
    );
  }

  if (!leads.length) {
    return (
      <EmptyState
        title="An no hay datos"
        description="Cuando registres referidos vers tus mtricas aqu."
      />
    );
  }

  const totalLeads = leads.length;
  const ganados = leads.filter((lead) => lead.estado?.nombre?.toLowerCase() === 'ganado').length;
  const conversion = totalLeads ? Math.round((ganados / totalLeads) * 100) : 0;
  const chartData = leads.slice(-12).map((_, index) => index + 1);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-content">Mi panel</h1>
        <p className="text-sm text-content-muted">
          Seguimiento rpido de tus referidos y comisiones generadas.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        <KPI label="Leads enviados" value={totalLeads} />
        <KPI label="Leads ganados" value={ganados} trend={{ label: 'en total', value: conversion }} />
        <KPI label="Conversion" value={`${conversion}%`} />
      </div>
      <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-content">Actividad reciente</h2>
        <p className="mt-1 text-sm text-content-muted">
          Referidos creados en los ltimos envos.
        </p>
        <MiniChart data={chartData} className="mt-4 h-20 w-full" />
      </div>
    </section>
  );
};

export default DashboardReferidos;
