import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lead, LeadService } from '@/services/lead.service';
import { useAuth } from '@/store/auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { EmptyState } from '@/components/common/EmptyState';
import { LeadDetailDrawer } from '@/components/common/LeadDetailDrawer';
import { formatDate } from '@/utils/helpers';
import { Badge } from '@/components/ui/Badge';
import { getStatusBadgeVariant, normalizeStatusLabel } from '@/utils/badges';

export const MisReferidos = () => {
  const { user } = useAuth();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['leads-mine', user?.id],
    queryFn: () => LeadService.listMine(user?.id ?? 0),
    enabled: Boolean(user?.id),
  });

  const leads: Lead[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

  if (!user) {
    return (
      <EmptyState
        title="Necesitas iniciar sesin"
        description="Inicia sesin con tu cuenta de referidos para revisar tus leads."
      />
    );
  }

  if (isLoading) {
    return <p className="text-sm text-content-muted">Cargando tus referidos</p>;
  }

  if (!leads.length) {
    return (
      <EmptyState
        title="An no tienes referidos"
        description="Cuando registres un lead aparecer aqu junto con su estado."
      />
    );
  }

  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold text-content">Mis referidos</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Campaña</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id_lead} onClick={() => setSelectedLead(lead)}>
              <TableCell>{`${lead.nombres ?? ''} ${lead.apellidos ?? ''}`.trim()}</TableCell>
              <TableCell>{lead.campania?.nombre ?? ''}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(lead.estado?.nombre)}>
                  {normalizeStatusLabel(lead.estado?.nombre, 'Pendiente')}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(lead.fecha_creacion ?? '')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <LeadDetailDrawer
        open={Boolean(selectedLead)}
        onClose={() => setSelectedLead(null)}
        title={selectedLead ? `${selectedLead.nombres} ${selectedLead.apellidos}` : ''}
      >
        {selectedLead && (
          <div className="space-y-2">
            <p>
              <strong>Campaa:</strong> {selectedLead.campania?.nombre ?? ''}
            </p>
            <p className="flex items-center gap-2">
              <strong>Estado:</strong>{' '}
              <Badge variant={getStatusBadgeVariant(selectedLead.estado?.nombre)}>
                {normalizeStatusLabel(selectedLead.estado?.nombre, 'Pendiente')}
              </Badge>
            </p>
            <p>
              <strong>Registrado:</strong> {formatDate(selectedLead.fecha_creacion ?? '')}
            </p>
            <p>
              <strong>Descripcin:</strong> {selectedLead.descripcion ?? 'Sin descripcin'}
            </p>
          </div>
        )}
      </LeadDetailDrawer>
    </>
  );
};

export default MisReferidos;
