import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '../../components/base/Button';
import { usuariosEmpresaService } from '../../services/usuarios-empresa.service';
import { rolesService } from '../../services/roles.service';
import { decodeToken } from '../../utils/auth';
import { toast } from 'sonner';

export function UsuarioEmpresaCreate() {
  const navigate = useNavigate();
  const token = decodeToken();
  const usuarioEmpresaId = token?.sub ? parseInt(token.sub, 10) : undefined;
  const { data: yo } = useQuery({
    enabled: !!usuarioEmpresaId,
    queryKey: ['usuario-empresa', usuarioEmpresaId],
    queryFn: () => usuariosEmpresaService.getById(usuarioEmpresaId!),
  });

  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    password: '',
    id_rol: 2,
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!yo?.id_empresa) throw new Error('id_empresa no disponible');
      const payload = {
        id_empresa: Number(yo.id_empresa),
        id_rol: Number(form.id_rol),
        nombres: form.nombres,
        apellidos: form.apellidos,
        email: form.email,
        password: form.password,
        estado: 1,
      };
      return usuariosEmpresaService.create(payload);
    },
    onSuccess: () => {
      toast.success('Usuario creado');
      navigate('/empresa/usuarios');
    },
    onError: () => toast.error('No se pudo crear el usuario'),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-[--color-bg]">
      <header className="bg-[--color-surface] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/empresa/usuarios')} iconStart={<ArrowLeft className="h-4 w-4" />}>
              Volver
            </Button>
            <h1 className="text-[--color-text]">Nuevo usuario</h1>
          </div>
          <Button size="sm" onClick={() => createMutation.mutate()} loading={createMutation.isPending} iconStart={<Check className="h-4 w-4" />}>Guardar</Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-[--color-surface] rounded-lg border border-gray-800 p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm mb-2 text-[--color-text]">Nombres *</label>
            <input name="nombres" value={form.nombres} onChange={handleChange} className="w-full px-3 py-2 bg-[--color-bg] border border-gray-700 rounded-lg text-[--color-text]" />
          </div>
          <div>
            <label className="block text-sm mb-2 text-[--color-text]">Apellidos *</label>
            <input name="apellidos" value={form.apellidos} onChange={handleChange} className="w-full px-3 py-2 bg-[--color-bg] border border-gray-700 rounded-lg text-[--color-text]" />
          </div>
          <div>
            <label className="block text-sm mb-2 text-[--color-text]">Email *</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full px-3 py-2 bg-[--color-bg] border border-gray-700 rounded-lg text-[--color-text]" />
          </div>
          <div>
            <label className="block text-sm mb-2 text-[--color-text]">Contraseña *</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} className="w-full px-3 py-2 bg-[--color-bg] border border-gray-700 rounded-lg text-[--color-text]" />
          </div>
          <div>
            <label className="block text-sm mb-2 text-[--color-text]">Rol</label>
            <select
              name="id_rol"
              value={form.id_rol}
              onChange={(e) => setForm((prev) => ({ ...prev, id_rol: parseInt(e.target.value, 10) }))}
              className="w-full px-3 py-2 bg-[--color-bg] border border-gray-700 rounded-lg text-[--color-text]"
            >
              {roles?.map((r) => (
                <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </main>
    </div>
  );
}

export default UsuarioEmpresaCreate;
