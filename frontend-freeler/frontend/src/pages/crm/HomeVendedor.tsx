import { useQuery } from '@tanstack/react-query';
import { LeadService } from '@/services/lead.service';
import { KPI } from '@/components/common/KPI';
import { useAuth } from '@/store/auth';
import { EmptyState } from '@/components/common/EmptyState';

export const HomeVendedor = () => {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ['crm-vendedor-leads'],
    queryFn: () => LeadService.listAssignedToMe(),
  });

  if (!user) {
    return (
      <EmptyState
        title="Sesin requerida"
        description="Inicia sesin con tu cuenta de vendedor para ver tus resultados."
      />
    );
  }

  const leads = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  const activos = leads.filter((lead) => lead.estado?.nombre !== 'Ganado' && lead.estado?.nombre !== 'Perdido').length;
  const ganados = leads.filter((lead) => lead.estado?.nombre === 'Ganado').length;

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-content">Mi desempeo</h1>
        <p className="text-sm text-content-muted">
          Seguimiento rpido de los leads que tienes asignados.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        <KPI label="Leads asignados" value={leads.length} />
        <KPI label="En gestin" value={activos} />
        <KPI label="Ganados" value={ganados} />
      </div>
    </section>
  );
};

export default HomeVendedor;
