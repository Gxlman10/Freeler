import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check, Trash } from 'lucide-react';
import { Button } from '../../components/base/Button';
import { campanasService } from '../../services/campanas.service';
import { decodeToken } from '../../utils/auth';
import { toast } from 'sonner';

export function CampanaEditEmpresa() {
  const navigate = useNavigate();
  const { id } = useParams();
  const token = decodeToken();
  const usuarioEmpresaId = token?.sub ? parseInt(token.sub, 10) : undefined;

  const { data: campana, isLoading } = useQuery({
    enabled: !!id,
    queryKey: ['campana', id],
    queryFn: () => campanasService.getById(String(id)),
  });

  const [form, setForm] = useState({ nombre: '', descripcion: '', ubicacion: '', comision: '', fecha_inicio: '', fecha_fin: '' });
  useEffect(() => {
    if (campana) {
      setForm({
        nombre: (campana as any).nombre || '',
        descripcion: (campana as any).descripcion || '',
        ubicacion: (campana as any).ubicacion || '',
        comision: String((campana as any).comision || ''),
        fecha_inicio: (campana as any).fecha_inicio || '',
        fecha_fin: (campana as any).fecha_fin || '',
      });
    }
  }, [campana]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!usuarioEmpresaId) throw new Error('Usuario inválido');
      const payload: any = { ...form, usuarioEmpresaId };
      return campanasService.update(String(id), payload);
    },
    onSuccess: () => { toast.success('Campaña actualizada'); navigate('/empresa/campanas'); },
    onError: () => toast.error('No se pudo actualizar')
  });

  const deleteMutation = useMutation({
    mutationFn: async () => campanasService.delete(String(id)),
    onSuccess: () => { toast.success('Campaña desactivada'); navigate('/empresa/campanas'); },
    onError: () => toast.error('No se pudo desactivar')
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-[--color-bg]">
      <header className="bg-[--color-surface] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/empresa/campanas')} iconStart={<ArrowLeft className="h-4 w-4" />}>
              Volver
            </Button>
            <h1 className="text-[--color-text]">Editar campaña</h1>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => deleteMutation.mutate()} loading={deleteMutation.isPending} iconStart={<Trash className="h-4 w-4" />}>Desactivar</Button>
            <Button size="sm" onClick={() => updateMutation.mutate()} loading={updateMutation.isPending} iconStart={<Check className="h-4 w-4" />}>Guardar</Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {isLoading ? <div className="text-gray-400">Cargando...</div> : (
          <div className="bg-[--color-surface] rounded-lg border border-gray-800 p-6 space-y-5">
            <div>
              <label className="block text-sm mb-2 text-[--color-text]">Nombre *</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} className="w-full px-3 py-2 bg-[--color-bg] border border-gray-700 rounded-lg text-[--color-text]" />
            </div>
            <div>
              <label className="block text-sm mb-2 text-[--color-text]">Descripción</label>
              <textarea name="descripcion" value={form.descripcion} onChange={handleChange} className="w-full px-3 py-2 bg-[--color-bg] border border-gray-700 rounded-lg text-[--color-text]" />
            </div>
            <div>
              <label className="block text-sm mb-2 text-[--color-text]">Ubicación</label>
              <input name="ubicacion" value={form.ubicacion} onChange={handleChange} className="w-full px-3 py-2 bg-[--color-bg] border border-gray-700 rounded-lg text-[--color-text]" />
            </div>
            <div>
              <label className="block text-sm mb-2 text-[--color-text]">Comisión (S/)</label>
              <input name="comision" value={form.comision} onChange={handleChange} type="number" step="0.01" className="w-full px-3 py-2 bg-[--color-bg] border border-gray-700 rounded-lg text-[--color-text]" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2 text-[--color-text]">Fecha inicio</label>
                <input name="fecha_inicio" value={form.fecha_inicio} onChange={handleChange} type="date" className="w-full px-3 py-2 bg-[--color-bg] border border-gray-700 rounded-lg text-[--color-text]" />
              </div>
              <div>
                <label className="block text-sm mb-2 text-[--color-text]">Fecha fin</label>
                <input name="fecha_fin" value={form.fecha_fin} onChange={handleChange} type="date" className="w-full px-3 py-2 bg-[--color-bg] border border-gray-700 rounded-lg text-[--color-text]" />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default CampanaEditEmpresa;

