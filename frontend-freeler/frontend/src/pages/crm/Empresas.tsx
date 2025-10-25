import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserService, Empresa } from '@/services/user.service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/common/Toasts';
import { Badge } from '@/components/ui/Badge';
import { getStatusBadgeVariant, normalizeStatusLabel } from '@/utils/badges';

type EmpresaForm = {
  razon_social: string;
  ruc: string;
  direccion: string;
  telefono: string;
  email: string;
};

const buildInitialForm = (): EmpresaForm => ({
  razon_social: '',
  ruc: '',
  direccion: '',
  telefono: '',
  email: '',
});

export const Empresas = () => {
  const queryClient = useQueryClient();
  const { push } = useToast();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [form, setForm] = useState<EmpresaForm>(() => buildInitialForm());
  const [editForm, setEditForm] = useState<EmpresaForm>(() => buildInitialForm());
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['crm-empresas'],
    queryFn: () => UserService.getEmpresas(),
  });

  const empresas: Empresa[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

  const createEmpresa = useMutation({
    mutationFn: () => UserService.createEmpresa({ ...form }),
    onSuccess: () => {
      push({ title: 'Empresa registrada', description: form.razon_social });
      setDialogOpen(false);
      setForm(buildInitialForm());
      queryClient.invalidateQueries({ queryKey: ['crm-empresas'] });
    },
    onError: () => {
      push({
        title: 'No se pudo registrar',
        description: 'Verifica los datos ingresados.',
        variant: 'danger',
      });
    },
  });

  const updateEmpresa = useMutation({
    mutationFn: (payload: EmpresaForm) => {
      if (!editingEmpresa) {
        throw new Error('NO_EMPRESA_SELECTED');
      }
      return UserService.updateEmpresa(editingEmpresa.id_empresa, payload);
    },
    onSuccess: (updated) => {
      push({
        title: 'Empresa actualizada',
        description: updated.razon_social ?? 'Datos guardados correctamente.',
      });
      setEditDialogOpen(false);
      setEditingEmpresa(null);
      queryClient.invalidateQueries({ queryKey: ['crm-empresas'] });
    },
    onError: () => {
      push({
        title: 'No se pudo actualizar',
        description: 'Intenta nuevamente.',
        variant: 'danger',
      });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.razon_social.trim()) {
      push({ title: 'Campos incompletos', description: 'La razon social es obligatoria.', variant: 'warning' });
      return;
    }
    createEmpresa.mutate();
  };

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editForm.razon_social.trim()) {
      push({
        title: 'Campos incompletos',
        description: 'La razon social es obligatoria.',
        variant: 'warning',
      });
      return;
    }
    updateEmpresa.mutate(editForm);
  };

  const openEditDialog = (empresa: Empresa) => {
    setEditingEmpresa(empresa);
    setEditForm({
      razon_social: empresa.razon_social ?? '',
      ruc: empresa.ruc ?? '',
      direccion: empresa.direccion ?? '',
      telefono: empresa.telefono ?? '',
      email: empresa.email ?? '',
    });
    setEditDialogOpen(true);
  };

  return (
    <section className="space-y-6 text-content">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-content">Empresas</h1>
          <p className="text-sm text-content-muted">Administra las empresas que participan del programa.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>Registrar empresa</Button>
      </header>

      {isLoading ? (
        <p className="text-sm text-content-muted">Cargando empresas...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Razon social</TableHead>
              <TableHead>RUC</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {empresas.map((empresa) => (
              <TableRow key={empresa.id_empresa}>
                <TableCell>{empresa.razon_social ?? ''}</TableCell>
                <TableCell>{empresa.ruc ?? ''}</TableCell>
                <TableCell>{empresa.email ?? ''}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(empresa.estado)}>
                    {normalizeStatusLabel(empresa.estado, 'Sin estado')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(empresa)}>
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!empresas.length && (
              <TableRow>
                <TableCell colSpan={5}>Aun no hay empresas registradas.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setForm(buildInitialForm());
        }}
        title="Registrar nueva empresa"
        description="Completa los datos basicos de la empresa."
      >
        <form className="space-y-3" onSubmit={handleSubmit}>
          <Input
            label="Razon social"
            required
            value={form.razon_social}
            onChange={(event) => setForm((prev) => ({ ...prev, razon_social: event.target.value }))}
          />
          <Input label="RUC" value={form.ruc} onChange={(event) => setForm((prev) => ({ ...prev, ruc: event.target.value }))} />
          <Input label="Direccion" value={form.direccion} onChange={(event) => setForm((prev) => ({ ...prev, direccion: event.target.value }))} />
          <Input label="Telefono" value={form.telefono} onChange={(event) => setForm((prev) => ({ ...prev, telefono: event.target.value }))} />
          <Input
            label="Correo"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={createEmpresa.isLoading}>
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
            setEditingEmpresa(null);
            setEditForm(buildInitialForm());
          }
        }}
        title="Editar empresa"
        description="Actualiza los datos de la empresa seleccionada."
      >
        <form className="space-y-3" onSubmit={handleEditSubmit}>
          <Input
            label="Razon social"
            required
            value={editForm.razon_social}
            onChange={(event) => setEditForm((prev) => ({ ...prev, razon_social: event.target.value }))}
          />
          <Input
            label="RUC"
            value={editForm.ruc}
            onChange={(event) => setEditForm((prev) => ({ ...prev, ruc: event.target.value }))}
          />
          <Input
            label="Direccion"
            value={editForm.direccion}
            onChange={(event) => setEditForm((prev) => ({ ...prev, direccion: event.target.value }))}
          />
          <Input
            label="Telefono"
            value={editForm.telefono}
            onChange={(event) => setEditForm((prev) => ({ ...prev, telefono: event.target.value }))}
          />
          <Input
            label="Correo"
            type="email"
            value={editForm.email}
            onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={updateEmpresa.isLoading}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </Dialog>
    </section>
  );
};

export default Empresas;
