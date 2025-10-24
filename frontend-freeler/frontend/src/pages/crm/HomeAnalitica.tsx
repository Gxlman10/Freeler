import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LeadService, Lead } from '@/services/lead.service';
import { Card, CardContent } from '@/components/ui/Card';
import { MiniChart } from '@/components/common/MiniChart';
import { KPI } from '@/components/common/KPI';

type GroupRecord = Record<string, number>;

const groupBy = (items: Lead[], pick: (lead: Lead) => string) =>
  items.reduce<GroupRecord>((acc, item) => {
    const key = pick(item) || 'Sin dato';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

export const HomeAnalitica = () => {
  const { data } = useQuery({
    queryKey: ['analitica-leads'],
    queryFn: () => LeadService.listAssignedToMe(),
  });

  const leads: Lead[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

  const { byEstado, byCiudad } = useMemo(() => {
    return {
      byEstado: groupBy(leads, (lead) => lead.estado?.nombre ?? 'Prospecto'),
      byCiudad: groupBy(leads, (lead) => lead.ciudad ?? 'Sin ciudad'),
    };
  }, [leads]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-content">Analitica</h1>
        <p className="text-sm text-content-muted">
          Distribucion de leads por estado y procedencia para detectar oportunidades.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <KPI label="Leads analizados" value={leads.length} />
        <KPI label="Estados distintos" value={Object.keys(byEstado).length} />
        <KPI label="Ciudades registradas" value={Object.keys(byCiudad).length} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-3">
            <h2 className="text-lg font-semibold text-content">Leads por estado</h2>
            <ul className="space-y-2 text-sm">
              {Object.entries(byEstado).map(([estado, total]) => (
                <li key={estado} className="flex items-center justify-between border-b border-border pb-2 last:border-b-0 last:pb-0">
                  <span>{estado}</span>
                  <strong>{total}</strong>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3">
            <h2 className="text-lg font-semibold text-content">Leads por ciudad</h2>
            <MiniChart data={Object.values(byCiudad)} className="w-full" color="#2563eb" />
            <p className="text-xs text-content-muted">
              Identifica las plazas con mejor rendimiento para enfocar campaas.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HomeAnalitica;
