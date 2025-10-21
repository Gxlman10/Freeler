import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '../../components/base/Button';
import { usuariosEmpresaService } from '../../services/usuarios-empresa.service';
import { rolesService } from '../../services/roles.service';
import { toast } from 'sonner';

export function UsuarioEmpresaEdit() {
  const navigate = useNavigate();
  const { id } = useParams();

  const { data: user, isLoading } = useQuery({
    enabled: !!id,
    queryKey: ['usuario-empresa', id],
    queryFn: () => usuariosEmpresaService.getById(String(id)),
  });
  const { data: roles } = useQuery({ queryKey: ['roles'], queryFn: () => rolesService.getAll() });

  const [form, setForm] = useState({ nombres: '', apellidos: '', email: '', id_rol: 2 });
  useEffect(() => {
    if (user) {
      setForm({
        nombres: (user as any).nombres || '',
        apellidos: (user as any).apellidos || '',
        email: (user as any).email || '',
        id_rol: (user as any).id_rol || 2,
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async () => usuariosEmpresaService.update(String(id), form as any),
    onSuccess: () => { toast.success('Usuario actualizado'); navigate('/empresa/usuarios'); },
    onError: () => toast.error('No se pudo actualizar')
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
            <h1 className="text-[--color-text]">Editar usuario</h1>
          </div>
          <Button size="sm" onClick={() => updateMutation.mutate()} loading={updateMutation.isPending} iconStart={<Check className="h-4 w-4" />}>Guardar</Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {isLoading ? <div className="text-gray-400">Cargando...</div> : (
          <div className="bg-[--color-surface] rounded-lg border border-gray-800 p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm mb-2 text-[--color-text]">Nombres *</label>
              <input name="nombres" value={form.nombres} onChange={handleChange} className="w-full px-3 py-2 bg-[--color-bg] border border-gray-700 rounded-lg text-[--color-text]" />
            </div>
            <div>
              <label className="block text-sm mb-2 text-[--color-text]">Apellidos *</label>
              <input name="apellidos" value={form.apellidos} onChange={handleChange} className="w-full px-3 py-2 bg-[--color-bg] border border-gray-700 rounded-lg text-[--color-text]" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-2 text-[--color-text]">Email *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full px-3 py-2 bg-[--color-bg] border border-gray-700 rounded-lg text-[--color-text]" />
            </div>
            <div className="md:col-span-2">
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
        )}
      </main>
    </div>
  );
}

export default UsuarioEmpresaEdit;

