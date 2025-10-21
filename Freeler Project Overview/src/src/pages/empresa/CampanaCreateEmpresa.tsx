import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '../../components/base/Button';
import { campanasService } from '../../services/campanas.service';
import { usuariosEmpresaService } from '../../services/usuarios-empresa.service';
import { decodeToken } from '../../utils/auth';
import { toast } from 'sonner';

export function CampanaCreateEmpresa() {
  const navigate = useNavigate();
  const token = decodeToken();
  const usuarioEmpresaId = token?.sub ? parseInt(token.sub, 10) : undefined;

  const { data: usuarioEmpresa } = useQuery({
    enabled: !!usuarioEmpresaId,
    queryKey: ['usuario-empresa', usuarioEmpresaId],
    queryFn: () => usuariosEmpresaService.getById(usuarioEmpresaId!),
  });

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    ubicacion: '',
    comision: '',
    fecha_inicio: '',
    fecha_fin: '',
  });

  useEffect(() => {
    // Prefill fechas básicas
    const today = new Date();
    const ymd = today.toISOString().slice(0, 10);
    setForm((f) => ({ ...f, fecha_inicio: ymd }));
  }, []);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!usuarioEmpresaId || !usuarioEmpresa?.id_empresa) throw new Error('Usuario empresa inválido');
      const payload = {
        id_empresa: Number(usuarioEmpresa.id_empresa),
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
        ubicacion: form.ubicacion || undefined,
        comision: form.comision,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin || form.fecha_inicio,
        estado: 1,
        usuarioEmpresaId: usuarioEmpresaId,
      } as const;
      return campanasService.create(payload as any);
    },
    onSuccess: () => {
      toast.success('Campaña creada');
      navigate('/empresa/campanas');
    },
    onError: () => {
      toast.error('No se pudo crear la campaña');
    },
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
            <h1 className="text-[--color-text]">Nueva campaña</h1>
          </div>
          <Button size="sm" onClick={() => createMutation.mutate()} loading={createMutation.isPending} iconStart={<Check className="h-4 w-4" />}>Guardar</Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
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
      </main>
    </div>
  );
}

export default CampanaCreateEmpresa;

