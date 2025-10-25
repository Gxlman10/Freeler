import { useQuery } from '@tanstack/react-query';
import { KPI } from '@/components/common/KPI';
import { Card, CardContent } from '@/components/ui/Card';
import { CampaignService } from '@/services/campaign.service';
import { UserService } from '@/services/user.service';
import { LeadService, unwrapLeadCollection } from '@/services/lead.service';

export const HomeAdmin = () => {
  const { data: campaigns } = useQuery({
    queryKey: ['admin-campaigns'],
    queryFn: () => CampaignService.getAll(),
  });

  const { data: empresas } = useQuery({
    queryKey: ['admin-empresas'],
    queryFn: () => UserService.getEmpresas(),
  });

  const { data: leads } = useQuery({
    queryKey: ['admin-leads'],
    queryFn: () => LeadService.listAssignedToMe(),
  });

  const totalCampanas = Array.isArray(campaigns?.data) ? campaigns.data.length : 0;
  const totalEmpresas = Array.isArray(empresas?.data) ? empresas.data.length : 0;
  const totalLeads = unwrapLeadCollection(leads).length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-content">Panel Admin global</h1>
        <p className="text-sm text-content-muted">
          Resumen rapido de empresas registradas, campanas y leads en seguimiento.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <KPI label="Campanas totales" value={totalCampanas} />
        <KPI label="Empresas activas" value={totalEmpresas} />
        <KPI label="Leads monitoreados" value={totalLeads} />
      </div>

      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold text-content">Siguientes acciones</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-content-muted">
            <li>Verifica que cada empresa tenga un Supervisor asignado.</li>
            <li>Revisa campanas con vigencia cercana y ajusta incentivos si es necesario.</li>
            <li>Distribuye los leads pendientes entre los vendedores activos.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default HomeAdmin;
