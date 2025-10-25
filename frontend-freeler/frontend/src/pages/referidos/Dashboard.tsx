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

  const draftsCount = leads.filter((lead) => lead.estado_completo === false).length;
  const sentLeads = leads.filter((lead) => lead.estado_completo !== false);
  const sentCount = sentLeads.length;
  const wonCount = sentLeads.filter(
    (lead) => lead.estado?.nombre?.toLowerCase() === 'ganado',
  ).length;
  const conversion = sentCount ? Math.round((wonCount / sentCount) * 100) : 0;
  const chartData = sentLeads
    .slice()
    .sort(
      (a, b) =>
        new Date(a.fecha_creacion ?? 0).getTime() - new Date(b.fecha_creacion ?? 0).getTime(),
    )
    .slice(-12)
    .map((lead) =>
      lead.estado?.nombre?.toLowerCase() === 'ganado' ? 2 : 1,
    );
  const lastSentTimestamp = sentLeads.reduce((latest, lead) => {
    const createdAt = lead.fecha_creacion ? new Date(lead.fecha_creacion).getTime() : 0;
    return createdAt > latest ? createdAt : latest;
  }, 0);
  const lastSentFormatted = lastSentTimestamp
    ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(
        lastSentTimestamp,
      )
    : 'Sin registros';

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-content">Mi panel</h1>
        <p className="text-sm text-content-muted">
          Seguimiento rpido de tus referidos y comisiones generadas.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPI label="Referidos totales" value={leads.length} />
        <KPI label="Borradores pendientes" value={draftsCount} />
        <KPI
          label="Enviados"
          value={sentCount}
          trend={sentCount ? { label: 'ganados', value: wonCount } : undefined}
        />
        <KPI
          label="Conversion"
          value={`${conversion}%`}
          trend={sentCount ? { label: 'sobre enviados', value: conversion } : undefined}
        />
      </div>
      <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-content">Actividad reciente</h2>
        <p className="mt-1 text-sm text-content-muted">
          Historico de los ultimos referidos enviados. Los valores en 2 representan referidos ganados.
        </p>
        <MiniChart data={chartData} className="mt-4 h-20 w-full" />
        <ul className="mt-6 grid gap-3 text-sm text-content-muted md:grid-cols-2">
          <li>
            <strong className="text-content">Ganados:</strong> {wonCount}
          </li>
          <li>
            <strong className="text-content">En progreso:</strong> {Math.max(sentCount - wonCount, 0)}
          </li>
          <li>
            <strong className="text-content">Ultimo envio:</strong> {lastSentFormatted}
          </li>
          <li>
            <strong className="text-content">Borradores listos:</strong> {draftsCount}
          </li>
        </ul>
      </div>
    </section>
  );
};

export default DashboardReferidos;
