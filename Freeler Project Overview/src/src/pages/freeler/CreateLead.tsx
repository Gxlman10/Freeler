import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '../../components/base/Button';
import { campanasService } from '../../services/campanas.service';
import { leadsService } from '../../services/leads.service';
import { toast } from 'sonner';
import { decodeToken } from '../../utils/auth';

const ORIGEN_COMPLETO = 'freeler-app';
const ORIGEN_BORRADOR = 'freeler-app-draft';

type LeadFormState = {
  id_campania: string;
  nombres: string;
  apellidos: string;
  dni: string;
  email: string;
  telefono: string;
  ocupacion: string;
  ciudad: string;
  descripcion: string;
};

const emptyForm: LeadFormState = {
  id_campania: '',
  nombres: '',
  apellidos: '',
  dni: '',
  email: '',
  telefono: '',
  ocupacion: '',
  ciudad: '',
  descripcion: '',
};

export function CreateLead() {
  const navigate = useNavigate();
  const token = decodeToken();
  const usuarioFreelerId = token?.type === 'freeler' ? Number(token.sub) : null;

  const [form, setForm] = useState<LeadFormState>(emptyForm);

  const { data: campanasData } = useQuery({
    queryKey: ['campanas', 'freeler'],
    queryFn: () => campanasService.getAll({ limit: 100 }),
  });

  const campanas = useMemo(() => {
    const list = campanasData?.data ?? [];
    return list.filter((c: any) => (c as any).estado !== 0);
  }, [campanasData]);

  const resetForm = () => setForm(emptyForm);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!usuarioFreelerId) throw new Error('No se pudo identificar al freeler autenticado');
      if (!form.id_campania) throw new Error('Selecciona una campaña');
      if (!form.nombres.trim() || !form.apellidos.trim()) throw new Error('Completa nombres y apellidos');

      return leadsService.create({
        usuarioFreelerId,
        id_campania: Number(form.id_campania),
        origen: ORIGEN_COMPLETO,
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        dni: form.dni.trim() || undefined,
        email: form.email.trim() || undefined,
        telefono: form.telefono.trim() || undefined,
        ocupacion: form.ocupacion.trim() || undefined,
        ciudad: form.ciudad.trim() || undefined,
        descripcion: form.descripcion.trim() || undefined,
        estado_completo: true,
      });
    },
    onSuccess: () => {
      toast.success('Lead creado exitosamente');
      resetForm();
      navigate('/freeler/leads');
    },
    onError: (error) => {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    },
  });

  const draftMutation = useMutation({
    mutationFn: async () => {
      if (!usuarioFreelerId) throw new Error('No se pudo identificar al freeler autenticado');

      return leadsService.createDraft({
        usuarioFreelerId,
        origen: ORIGEN_BORRADOR,
        id_campania: form.id_campania ? Number(form.id_campania) : undefined,
        nombres: form.nombres.trim() || undefined,
        apellidos: form.apellidos.trim() || undefined,
        dni: form.dni.trim() || undefined,
        email: form.email.trim() || undefined,
        telefono: form.telefono.trim() || undefined,
        ocupacion: form.ocupacion.trim() || undefined,
        ciudad: form.ciudad.trim() || undefined,
        descripcion: form.descripcion.trim() || undefined,
        estado_completo: false,
      });
    },
    onSuccess: () => {
      toast.success('Borrador guardado');
      resetForm();
      navigate('/freeler/leads');
    },
    onError: (error) => {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  if (!usuarioFreelerId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[--color-bg] px-4 py-8">
        <div className="text-[--color-text]">Tu sesión ha expirado, inicia sesión nuevamente.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[--color-bg]">
      <header className="bg-[--color-surface] border-b border-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/freeler')} iconStart={<ArrowLeft className="h-4 w-4" />}>
              Volver
            </Button>
            <h1 className="text-[--color-text]">Crear Lead</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-[--color-surface] rounded-lg border border-gray-800 p-6 space-y-6">
          <div>
            <label htmlFor="id_campania" className="block text-sm mb-2 text-[--color-text]">
              Campaña *
            </label>
            <select
              id="id_campania"
              name="id_campania"
              value={form.id_campania}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
              required
            >
              <option value="">Selecciona una campaña</option>
              {campanas.map((camp: any) => (
                <option key={(camp as any).id_campania ?? camp.id} value={(camp as any).id_campania ?? camp.id}>
                  {camp.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="nombres" className="block text-sm mb-2 text-[--color-text]">
                Nombres *
              </label>
              <input
                id="nombres"
                name="nombres"
                value={form.nombres}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
                required
              />
            </div>
            <div>
              <label htmlFor="apellidos" className="block text-sm mb-2 text-[--color-text]">
                Apellidos *
              </label>
              <input
                id="apellidos"
                name="apellidos"
                value={form.apellidos}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
                required
              />
            </div>
            <div>
              <label htmlFor="dni" className="block text-sm mb-2 text-[--color-text]">
                DNI
              </label>
              <input
                id="dni"
                name="dni"
                value={form.dni}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
                maxLength={12}
              />
            </div>
            <div>
              <label htmlFor="telefono" className="block text-sm mb-2 text-[--color-text]">
                Teléfono
              </label>
              <input
                id="telefono"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
                placeholder="999 999 999"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm mb-2 text-[--color-text]">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
                placeholder="cliente@correo.com"
              />
            </div>
            <div>
              <label htmlFor="ocupacion" className="block text-sm mb-2 text-[--color-text]">
                Ocupación
              </label>
              <input
                id="ocupacion"
                name="ocupacion"
                value={form.ocupacion}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
              />
            </div>
            <div>
              <label htmlFor="ciudad" className="block text-sm mb-2 text-[--color-text]">
                Ciudad
              </label>
              <input
                id="ciudad"
                name="ciudad"
                value={form.ciudad}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="descripcion" className="block text-sm mb-2 text-[--color-text]">
              Notas
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text] resize-none"
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" loading={createMutation.isPending}>
              Crear Lead
            </Button>
            <Button
              type="button"
              variant="secondary"
              loading={draftMutation.isPending}
              onClick={() => draftMutation.mutate()}
              iconStart={<Save className="h-4 w-4" />}
            >
              Guardar borrador
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default CreateLead;

