import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Lead, LeadService } from '@/services/lead.service';
import { useAuth } from '@/store/auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { EmptyState } from '@/components/common/EmptyState';
import { LeadDetailDrawer } from '@/components/common/LeadDetailDrawer';
import { formatDate } from '@/utils/helpers';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LeadFormModal } from '@/components/common/LeadFormModal';
import { getStatusBadgeVariant, normalizeStatusLabel } from '@/utils/badges';

const mapResponse = (data: unknown): Lead[] => {
  if (Array.isArray((data as any)?.data)) return (data as any).data as Lead[];
  if (Array.isArray(data)) return data as Lead[];
  return [];
};

export const MisReferidos = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const draftsQuery = useQuery({
    queryKey: ['leads-mine-drafts', user?.id],
    queryFn: () => LeadService.listMine(user?.id ?? 0, { estado_completo: false, limit: 200 }),
    enabled: Boolean(user?.id),
  });

  const submittedQuery = useQuery({
    queryKey: ['leads-mine-sent', user?.id],
    queryFn: () => LeadService.listMine(user?.id ?? 0, { estado_completo: true, limit: 200 }),
    enabled: Boolean(user?.id),
  });

  const drafts = useMemo(() => mapResponse(draftsQuery.data), [draftsQuery.data]);
  const sentLeads = useMemo(() => mapResponse(submittedQuery.data), [submittedQuery.data]);

  const refreshLists = useMutation({
    mutationFn: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['leads-mine-drafts', user?.id] }),
        queryClient.invalidateQueries({ queryKey: ['leads-mine-sent', user?.id] }),
      ]);
    },
  });

  if (!user) {
    return (
      <EmptyState
        title="Necesitas iniciar sesion"
        description="Inicia sesion con tu cuenta de referidos para revisar tus leads."
      />
    );
  }

  const isLoading = draftsQuery.isLoading || submittedQuery.isLoading;

  if (isLoading) {
    return <p className="text-sm text-content-muted">Cargando tus referidos...</p>;
  }

  const hasContent = Boolean(drafts.length || sentLeads.length);

  if (!hasContent) {
    return (
      <EmptyState
        title="Aun no tienes referidos"
        description="Cuando registres un lead aparecera aqui junto con su estado."
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-content">Mis referidos</h1>
        <p className="text-sm text-content-muted">
          Revisa tus borradores, completa la informacion pendiente y haz seguimiento de tus envios.
        </p>
      </header>

      <section className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-content">Borradores</h2>
            <p className="text-xs text-content-muted">
              Mantente al dia con la informacion pendiente antes de enviarla al equipo de campanas.
            </p>
          </div>
          <Badge variant="outline">{drafts.length} guardados</Badge>
        </div>
        {drafts.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Campana</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drafts.map((lead) => (
                <TableRow key={lead.id_lead}>
                  <TableCell>{`${lead.nombres ?? ''} ${lead.apellidos ?? ''}`.trim() || 'Sin nombre'}</TableCell>
                  <TableCell>{lead.campania?.nombre ?? 'Sin campana'}</TableCell>
                  <TableCell>{formatDate(lead.fecha_creacion ?? '')}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setEditingLead(lead)}>
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-content-muted">No tienes referidos en borrador.</p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        <div className="mb-3 space-y-1">
          <h2 className="text-lg font-semibold text-content">Leads enviados</h2>
          <p className="text-xs text-content-muted">
            Visualiza el estado de tus referidos enviados y la informacion clave asociada.
          </p>
        </div>
        {sentLeads.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Campana</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sentLeads.map((lead) => (
                <TableRow key={lead.id_lead} onClick={() => setSelectedLead(lead)} className="cursor-pointer">
                  <TableCell>{`${lead.nombres ?? ''} ${lead.apellidos ?? ''}`.trim()}</TableCell>
                  <TableCell>{lead.campania?.nombre ?? 'Sin campana'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(lead.estado?.nombre)}>
                      {normalizeStatusLabel(lead.estado?.nombre, 'No asignado')}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(lead.fecha_creacion ?? '')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-content-muted">Aun no has enviado referidos.</p>
        )}
      </section>

      <LeadDetailDrawer
        open={Boolean(selectedLead)}
        onClose={() => setSelectedLead(null)}
        title={selectedLead ? `${selectedLead.nombres ?? ''} ${selectedLead.apellidos ?? ''}`.trim() : ''}
      >
        {selectedLead && (
          <div className="space-y-2 text-sm text-content">
            <p>
              <strong>Campana:</strong> {selectedLead.campania?.nombre ?? 'Sin campana'}
            </p>
            <p className="flex items-center gap-2">
              <strong>Estado:</strong>{' '}
              <Badge variant={getStatusBadgeVariant(selectedLead.estado?.nombre)}>
                {normalizeStatusLabel(selectedLead.estado?.nombre, 'No asignado')}
              </Badge>
            </p>
            <p>
              <strong>Registrado:</strong> {formatDate(selectedLead.fecha_creacion ?? '')}
            </p>
            <p>
              <strong>Descripcion:</strong> {selectedLead.descripcion ?? 'Sin descripcion'}
            </p>
          </div>
        )}
      </LeadDetailDrawer>

      <LeadFormModal
        open={Boolean(editingLead)}
        onClose={() => setEditingLead(null)}
        lead={editingLead ?? undefined}
        campaignId={editingLead?.id_campania}
        onCompleted={() => {
          setEditingLead(null);
          refreshLists.mutate();
        }}
      />
    </div>
  );
};

export default MisReferidos;
