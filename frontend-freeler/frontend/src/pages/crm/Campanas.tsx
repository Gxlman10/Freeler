import { FormEvent, useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CampaignService } from '@/services/campaign.service';
import type { Campaign, CreateCampaignPayload } from '@/services/campaign.service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/common/Toasts';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { useAuth } from '@/store/auth';
import { Badge } from '@/components/ui/Badge';
import { getStatusBadgeVariant, normalizeStatusLabel } from '@/utils/badges';

type CampaignFormState = {
  nombre: string;
  descripcion: string;
  ubicacion: string;
  comision: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: number;
};

const buildInitialForm = (): CampaignFormState => ({
  nombre: '',
  descripcion: '',
  ubicacion: '',
  comision: '',
  fecha_inicio: '',
  fecha_fin: '',
  estado: 1,
});

export const Campanas = () => {
  const queryClient = useQueryClient();
  const { push } = useToast();
  const { user } = useAuth();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [form, setForm] = useState<CampaignFormState>(() => buildInitialForm());
  const [editForm, setEditForm] = useState<CampaignFormState>(() => buildInitialForm());
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  const resetForm = useCallback(() => {
    setForm(buildInitialForm());
  }, []);

  const companyId = user?.companyId ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ['crm-campanas', companyId],
    queryFn: () =>
      CampaignService.getAll(companyId ? { id_empresa: companyId } : {}),
    enabled: Boolean(user),
  });

  const campaigns: Campaign[] = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
    ? data
    : [];

  // Inyectamos los identificadores de la empresa y del usuario activo antes del POST
  const resolveSessionIds = useCallback(() => {
    if (!user || !user.companyId) {
      push({
        title: 'No se pudo identificar la empresa',
        description: 'Vuelve a iniciar sesion para registrar una campana.',
        variant: 'danger',
      });
      throw new Error('MISSING_SESSION_IDS');
    }

    return {
      id_empresa: user.companyId,
      usuarioEmpresaId: user.id,
    };
  }, [push, user]);

  const createCampaign = useMutation({
    mutationFn: (payload: CreateCampaignPayload) => CampaignService.create(payload),
    onSuccess: (_, variables) => {
      push({ title: 'Campana creada', description: variables.nombre });
      setDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['crm-campanas'] });
    },
    onError: () => {
      push({
        title: 'No se pudo crear la campana',
        description: 'Revisa los datos ingresados.',
        variant: 'danger',
      });
    },
  });

  const updateCampaign = useMutation({
    mutationFn: (payload: Partial<CreateCampaignPayload>) => {
      if (!editingCampaign) {
        throw new Error('NO_CAMPAIGN_SELECTED');
      }
      return CampaignService.update(editingCampaign.id_campania, payload);
    },
    onSuccess: (updated) => {
      push({
        title: 'Campana actualizada',
        description: updated.nombre ?? 'Cambios guardados correctamente.',
      });
      setEditDialogOpen(false);
      setEditingCampaign(null);
      queryClient.invalidateQueries({ queryKey: ['crm-campanas'] });
    },
    onError: () => {
      push({
        title: 'No se pudo actualizar la campana',
        description: 'Revisa los datos e intenta nuevamente.',
        variant: 'danger',
      });
    },
  });

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      try {
        const sessionIds = resolveSessionIds();
        const commissionValue = Number(form.comision);
        if (Number.isNaN(commissionValue) || commissionValue < 0) {
          push({
            title: 'Monto invalido',
            description: 'Ingresa un monto valido para la comision.',
            variant: 'danger',
          });
          return;
        }
        if (!form.fecha_inicio) {
          push({
            title: 'Fecha de inicio requerida',
            description: 'Selecciona una fecha de inicio para la campana.',
            variant: 'warning',
          });
          return;
        }
        if (!form.fecha_fin || form.fecha_fin < form.fecha_inicio) {
          push({
            title: 'Rango de fechas invalido',
            description: 'La fecha de cierre no puede ser anterior a la fecha de inicio.',
            variant: 'danger',
          });
          return;
        }

        createCampaign.mutate({
          ...sessionIds,
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || undefined,
          ubicacion: form.ubicacion.trim() || undefined,
          comision: commissionValue,
          fecha_inicio: form.fecha_inicio,
          fecha_fin: form.fecha_fin,
          estado: form.estado,
        });
      } catch (error) {
        if ((error as Error).message !== 'MISSING_SESSION_IDS') {
          push({
            title: 'No se pudo crear la campana',
            description: 'Vuelve a intentarlo en unos segundos.',
            variant: 'danger',
          });
        }
      }
    },
    [createCampaign, form, push, resolveSessionIds],
  );

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingCampaign) return;
    const commissionValue = Number(editForm.comision);
    if (Number.isNaN(commissionValue) || commissionValue < 0) {
      push({
        title: 'Monto invalido',
        description: 'Ingresa un monto valido para la comision.',
        variant: 'danger',
      });
      return;
    }
    if (!editForm.fecha_inicio) {
      push({
        title: 'Fecha de inicio requerida',
        description: 'Selecciona una fecha de inicio para la campana.',
        variant: 'warning',
      });
      return;
    }
    if (!editForm.fecha_fin || editForm.fecha_fin < editForm.fecha_inicio) {
      push({
        title: 'Rango de fechas invalido',
        description: 'La fecha de cierre no puede ser anterior a la fecha de inicio.',
        variant: 'danger',
      });
      return;
    }
    updateCampaign.mutate({
      nombre: editForm.nombre.trim(),
      descripcion: editForm.descripcion.trim() || undefined,
      ubicacion: editForm.ubicacion.trim() || undefined,
      comision: commissionValue,
      fecha_inicio: editForm.fecha_inicio,
      fecha_fin: editForm.fecha_fin,
      estado: editForm.estado,
    });
  };

  const openEditDialog = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setEditForm({
      nombre: campaign.nombre ?? '',
      descripcion: campaign.descripcion ?? '',
      ubicacion: campaign.ubicacion ?? '',
      comision:
        typeof campaign.comision === 'string'
          ? campaign.comision
          : String(campaign.comision ?? ''),
      fecha_inicio: campaign.fecha_inicio ?? '',
      fecha_fin: campaign.fecha_fin ?? '',
      estado: campaign.estado ?? 1,
    });
    setEditDialogOpen(true);
  };

  return (
    <section className="space-y-6 text-content">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-content">Campanas</h1>
          <p className="text-sm text-content-muted">
            Configura campanas y controla su periodo de vigencia.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>Nueva campana</Button>
      </header>

      {isLoading ? (
        <p className="text-sm text-content-muted">Cargando campanas...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Comision</TableHead>
              <TableHead>Vigencia</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => {
              const commissionAmount =
                typeof campaign.comision === 'string'
                  ? Number(campaign.comision)
                  : campaign.comision;
              const safeCommission = Number.isFinite(commissionAmount) ? commissionAmount : 0;

              return (
                <TableRow key={campaign.id_campania}>
                  <TableCell>{campaign.nombre}</TableCell>
                  <TableCell>{formatCurrency(safeCommission)}</TableCell>
                  <TableCell>
                    {formatDate(campaign.fecha_inicio)} - {formatDate(campaign.fecha_fin)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(campaign.estado)}>
                      {normalizeStatusLabel(campaign.estado, 'Sin estado')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(campaign)}>
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {!campaigns.length && (
              <TableRow>
                <TableCell colSpan={5}>Aun no hay campanas registradas.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}
        title="Registrar campana"
        description="Completa los datos de la nueva campana."
      >
        <form className="space-y-3" onSubmit={handleSubmit}>
          <Input
            label="Nombre"
            required
            value={form.nombre}
            onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
          />
          <Textarea
            label="Descripcion"
            minRows={4}
            value={form.descripcion}
            onChange={(event) => setForm((prev) => ({ ...prev, descripcion: event.target.value }))}
          />
          <Input
            label="Ubicacion"
            value={form.ubicacion}
            onChange={(event) => setForm((prev) => ({ ...prev, ubicacion: event.target.value }))}
          />
          <Input
            label="Comision por referido (S/)"
            type="number"
            step="0.01"
            min="0"
            required
            value={form.comision}
            onChange={(event) => setForm((prev) => ({ ...prev, comision: event.target.value }))}
          />
          <Input
            label="Fecha de inicio"
            type="date"
            required
            value={form.fecha_inicio}
            onChange={(event) => {
              const nextValue = event.target.value;
              setForm((prev) => ({
                ...prev,
                fecha_inicio: nextValue,
                fecha_fin:
                  prev.fecha_fin && prev.fecha_fin < nextValue ? nextValue : prev.fecha_fin,
              }));
            }}
          />
          <Input
            label="Fecha de cierre"
            type="date"
            required
            min={form.fecha_inicio || undefined}
            value={form.fecha_fin}
            onChange={(event) => {
              const nextValue = event.target.value;
              setForm((prev) => ({
                ...prev,
                fecha_fin:
                  prev.fecha_inicio && nextValue < prev.fecha_inicio ? prev.fecha_inicio : nextValue,
              }));
            }}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={createCampaign.isLoading}>
              Guardar
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setEditingCampaign(null);
            setEditForm(buildInitialForm());
          }
        }}
        title="Editar campana"
        description="Actualiza los detalles de la campana."
      >
        <form className="space-y-3" onSubmit={handleEditSubmit}>
          <Input
            label="Nombre"
            required
            value={editForm.nombre}
            onChange={(event) => setEditForm((prev) => ({ ...prev, nombre: event.target.value }))}
          />
          <Textarea
            label="Descripcion"
            minRows={4}
            value={editForm.descripcion}
            onChange={(event) => setEditForm((prev) => ({ ...prev, descripcion: event.target.value }))}
          />
          <Input
            label="Ubicacion"
            value={editForm.ubicacion}
            onChange={(event) => setEditForm((prev) => ({ ...prev, ubicacion: event.target.value }))}
          />
          <Input
            label="Comision por referido (S/)"
            type="number"
            step="0.01"
            min="0"
            required
            value={editForm.comision}
            onChange={(event) => setEditForm((prev) => ({ ...prev, comision: event.target.value }))}
          />
          <Input
            label="Fecha de inicio"
            type="date"
            required
            value={editForm.fecha_inicio}
            onChange={(event) => {
              const nextValue = event.target.value;
              setEditForm((prev) => ({
                ...prev,
                fecha_inicio: nextValue,
                fecha_fin:
                  prev.fecha_fin && prev.fecha_fin < nextValue ? nextValue : prev.fecha_fin,
              }));
            }}
          />
          <Input
            label="Fecha de cierre"
            type="date"
            required
            min={editForm.fecha_inicio || undefined}
            value={editForm.fecha_fin}
            onChange={(event) => {
              const nextValue = event.target.value;
              setEditForm((prev) => ({
                ...prev,
                fecha_fin:
                  prev.fecha_inicio && nextValue < prev.fecha_inicio ? prev.fecha_inicio : nextValue,
              }));
            }}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={updateCampaign.isLoading}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </Dialog>
    </section>
  );
};

export default Campanas;
