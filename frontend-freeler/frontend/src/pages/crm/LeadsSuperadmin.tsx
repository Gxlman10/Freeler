import { useQuery } from '@tanstack/react-query';
import { LeadService, unwrapLeadCollection } from '@/services/lead.service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { formatDate } from '@/utils/helpers';
import { Badge } from '@/components/ui/Badge';
import { getStatusBadgeVariant, normalizeStatusLabel } from '@/utils/badges';

export const LeadsSupervisor = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['crm-super-leads'],
    queryFn: () => LeadService.listAll({ limit: 50 }),
  });

  const leads = unwrapLeadCollection(data);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-content">Leads por empresas</h1>
        <p className="text-sm text-content-muted">
          Visualiza los leads registrados para todas las campaas y empresas.
        </p>
      </header>

      {isLoading ? (
        <p className="text-sm text-content-muted">Cargando leads</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Campana</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Creado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead: any) => (
              <TableRow key={lead.id_lead}>
                <TableCell>{`${lead.nombres ?? ''} ${lead.apellidos ?? ''}`.trim()}</TableCell>
                <TableCell>{lead.Campana?.nombre ?? ''}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(lead.estado?.nombre)}>
                    {normalizeStatusLabel(lead.estado?.nombre, 'Pendiente')}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(lead.fecha_creacion ?? '')}</TableCell>
              </TableRow>
            ))}
            {!leads.length && (
              <TableRow>
                <TableCell colSpan={4}>An no se registran leads.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </section>
  );
};

export default LeadsSupervisor;
