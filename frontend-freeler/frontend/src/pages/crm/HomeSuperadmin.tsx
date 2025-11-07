import { useQuery } from '@tanstack/react-query';
import { CampaignService } from '@/services/campaign.service';
import type { Campaign } from '@/services/campaign.service';
import { KPI } from '@/components/common/KPI';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { formatDate } from '@/utils/helpers';
import { Badge } from '@/components/ui/Badge';
import { getStatusBadgeVariant, normalizeStatusLabel } from '@/utils/badges';

export const HomeSupervisor = () => {
  const { data } = useQuery({
    queryKey: ['crm-super-campaigns'],
    queryFn: () => CampaignService.getAll({ limit: 20 }),
  });

  const campaigns: Campaign[] = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
    ? data
    : [];
  const activas = campaigns.filter((campaign) => campaign.estado === 1).length;
  const finalizadas = campaigns.length - activas;

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-content">Resumen de campaas</h1>
        <p className="text-sm text-content-muted">
          Supervisor puede monitorear el desempeno de campanas por empresa.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <KPI label="Campaas totales" value={campaigns.length} />
        <KPI label="Activas" value={activas} />
        <KPI label="Finalizadas" value={finalizadas} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campaa</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Vigencia</TableHead>
            <TableHead>Comisin</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => (
            <TableRow key={campaign.id_campania}>
              <TableCell>{campaign.nombre}</TableCell>
              <TableCell>{campaign.empresa?.razon_social ?? campaign.id_empresa ?? ''}</TableCell>
              <TableCell>
                {formatDate(campaign.fecha_inicio)} - {formatDate(campaign.fecha_fin)}
              </TableCell>
              <TableCell>{campaign.comision ? `${campaign.comision}%` : 'Variable'}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(campaign.estado)}>
                  {normalizeStatusLabel(campaign.estado, 'Sin estado')}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {!campaigns.length && (
            <TableRow>
              <TableCell colSpan={5}>An no se registran campaas.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </section>
  );
};

export default HomeSupervisor;
