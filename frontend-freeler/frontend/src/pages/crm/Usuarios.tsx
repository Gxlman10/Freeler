import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserService } from '@/services/user.service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { ROLE_LABELS, Role, mapBackendRole } from '@/utils/constants';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/common/Toasts';
import { useAuth } from '@/store/auth';
import { Badge } from '@/components/ui/Badge';
import { getRoleBadgeVariant, getStatusBadgeVariant, normalizeStatusLabel } from '@/utils/badges';

const ROLE_OPTIONS = [
  { value: 1, label: ROLE_LABELS[Role.ADMIN] },
  { value: 2, label: ROLE_LABELS[Role.SUPERVISOR] },
  { value: 3, label: ROLE_LABELS[Role.VENDEDOR] },
  { value: 4, label: ROLE_LABELS[Role.ANALISTA] },
];

type NewUserForm = {
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  roleId: number;
};

const buildInitialForm = (): NewUserForm => ({
  nombres: '',
  apellidos: '',
  email: '',
  password: '',
  roleId: ROLE_OPTIONS[0]?.value ?? 1,
});

export const Usuarios = () => {
  const queryClient = useQueryClient();
  const { push } = useToast();
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['crm-usuarios-empresa'],
    queryFn: () => UserService.getUsuariosEmpresa(),
  });

  const usuarios = useMemo(
    () => (Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []),
    [data],
  );

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<NewUserForm>(() => buildInitialForm());
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<NewUserForm>(() => buildInitialForm());
  const [editingUser, setEditingUser] = useState<any | null>(null);

  const createUser = useMutation({
    mutationFn: async () => {
      if (!user?.companyId) {
        push({
          title: 'No se pudo identificar la empresa',
          description: 'Vuelve a iniciar sesion e intenta registrar nuevamente.',
          variant: 'danger',
        });
        throw new Error('MISSING_COMPANY_ID');
      }

      return UserService.createUsuarioEmpresa({
        id_empresa: user.companyId,
        id_rol: form.roleId,
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        email: form.email.trim(),
        password: form.password,
        estado: 1,
      });
    },
    onSuccess: () => {
      push({ title: 'Usuario creado', description: form.nombres || 'Cuenta registrada con exito.' });
      setDialogOpen(false);
      setForm(buildInitialForm());
      queryClient.invalidateQueries({ queryKey: ['crm-usuarios-empresa'] });
    },
    onError: () => {
      push({
        title: 'No se pudo crear el usuario',
        description: 'Revisa los datos e intenta nuevamente.',
        variant: 'danger',
      });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.nombres.trim() || !form.apellidos.trim() || !form.email.trim() || !form.password.trim()) {
      push({ title: 'Campos incompletos', description: 'Completa todos los campos obligatorios.', variant: 'warning' });
      return;
    }
    createUser.mutate();
  };

  const updateUser = useMutation({
    mutationFn: async (payload: NewUserForm) => {
      if (!editingUser) {
        throw new Error('NO_USER_SELECTED');
      }
      return UserService.updateUsuarioEmpresa(editingUser.id_usuario_empresa, {
        nombres: payload.nombres.trim(),
        apellidos: payload.apellidos.trim(),
        email: payload.email.trim(),
        id_rol: payload.roleId,
        ...(payload.password.trim() ? { password: payload.password } : {}),
      });
    },
    onSuccess: (updated) => {
      push({
        title: 'Usuario actualizado',
        description: `${updated.nombres ?? ''} ${updated.apellidos ?? ''}`.trim() || 'Datos guardados.',
      });
      setEditDialogOpen(false);
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ['crm-usuarios-empresa'] });
    },
    onError: () => {
      push({
        title: 'No se pudo actualizar el usuario',
        description: 'Intenta nuevamente.',
        variant: 'danger',
      });
    },
  });

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editForm.nombres.trim() || !editForm.apellidos.trim() || !editForm.email.trim()) {
      push({
        title: 'Campos incompletos',
        description: 'Completa al menos nombres, apellidos y correo.',
        variant: 'warning',
      });
      return;
    }
    updateUser.mutate(editForm);
  };

  const openEditDialog = (usuario: any) => {
    setEditingUser(usuario);
    setEditForm({
      nombres: usuario.nombres ?? '',
      apellidos: usuario.apellidos ?? '',
      email: usuario.email ?? '',
      password: '',
      roleId: usuario.rol?.id_rol ?? ROLE_OPTIONS[0].value,
    });
    setEditDialogOpen(true);
  };

  return (
    <section className="space-y-6 text-content">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-content">Usuarios de empresa</h1>
          <p className="text-sm text-content-muted">
            Controla que usuarios tienen acceso al CRM y define su rol dentro de la empresa.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>Nuevo usuario</Button>
      </header>

      {isLoading ? (
        <p className="text-sm text-content-muted">Cargando usuarios...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((usuario: any) => (
              <TableRow key={usuario.id_usuario_empresa}>
                <TableCell>{`${usuario.nombres ?? ''} ${usuario.apellidos ?? ''}`.trim()}</TableCell>
                <TableCell>{usuario.email ?? '-'}</TableCell>
                <TableCell>
                  {(() => {
                    const role = mapBackendRole(usuario.rol?.nombre);
                    const label = role ? ROLE_LABELS[role] : 'Sin rol';
                    return <Badge variant={getRoleBadgeVariant(role)}>{label}</Badge>;
                  })()}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(usuario.estado)}>
                    {normalizeStatusLabel(usuario.estado, 'Sin estado')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(usuario)}>
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!usuarios.length && (
              <TableRow>
                <TableCell colSpan={5}>Aun no hay usuarios registrados.</TableCell>
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
        title="Registrar usuario"
        description="Completa la informacion para invitar a un miembro del equipo."
      >
        <form className="space-y-3" onSubmit={handleSubmit}>
          <Input
            label="Nombres"
            required
            value={form.nombres}
            onChange={(event) => setForm((prev) => ({ ...prev, nombres: event.target.value }))}
          />
          <Input
            label="Apellidos"
            required
            value={form.apellidos}
            onChange={(event) => setForm((prev) => ({ ...prev, apellidos: event.target.value }))}
          />
          <Input
            label="Correo"
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          />
          <Input
            label="Contrasena temporal"
            type="password"
            required
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          />
          <Select
            label="Rol"
            value={String(form.roleId)}
            onChange={(event) => setForm((prev) => ({ ...prev, roleId: Number(event.target.value) }))}
            options={ROLE_OPTIONS.map((option) => ({ label: option.label, value: String(option.value) }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={createUser.isLoading}>
              Registrar
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setEditingUser(null);
            setEditForm(buildInitialForm());
          }
        }}
        title="Editar usuario"
        description="Actualiza la informacion del usuario seleccionado."
      >
        <form className="space-y-3" onSubmit={handleEditSubmit}>
          <Input
            label="Nombres"
            required
            value={editForm.nombres}
            onChange={(event) => setEditForm((prev) => ({ ...prev, nombres: event.target.value }))}
          />
          <Input
            label="Apellidos"
            required
            value={editForm.apellidos}
            onChange={(event) => setEditForm((prev) => ({ ...prev, apellidos: event.target.value }))}
          />
          <Input
            label="Correo"
            type="email"
            required
            value={editForm.email}
            onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
          />
          <Input
            label="Actualizar contrasena"
            type="password"
            value={editForm.password}
            onChange={(event) => setEditForm((prev) => ({ ...prev, password: event.target.value }))}
            helperText="Deja en blanco para mantener la contrasena actual."
          />
          <Select
            label="Rol"
            value={String(editForm.roleId)}
            onChange={(event) => setEditForm((prev) => ({ ...prev, roleId: Number(event.target.value) }))}
            options={ROLE_OPTIONS.map((option) => ({ label: option.label, value: String(option.value) }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={updateUser.isLoading}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </Dialog>
    </section>
  );
};

export default Usuarios;
