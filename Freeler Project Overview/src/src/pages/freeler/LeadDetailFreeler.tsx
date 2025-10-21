import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '../../components/base/Button';
import { leadsService } from '../../services/leads.service';
import { decodeToken } from '../../utils/auth';
import { toast } from 'sonner';

type EditableLeadState = {
  nombres: string;
  apellidos: string;
  dni: string;
  email: string;
  telefono: string;
  ocupacion: string;
  ciudad: string;
  descripcion: string;
};

export function LeadDetailFreeler() {
  const navigate = useNavigate();
  const { id } = useParams();
  const token = decodeToken();
  const usuarioFreelerId = token?.type === 'freeler' ? Number(token.sub) : null;

  const { data: lead, isLoading } = useQuery({
    enabled: !!id,
    queryKey: ['lead', 'freeler', id],
    queryFn: () => leadsService.getById(String(id)),
  });

  const [form, setForm] = useState<EditableLeadState>({
    nombres: '',
    apellidos: '',
    dni: '',
    email: '',
    telefono: '',
    ocupacion: '',
    ciudad: '',
    descripcion: '',
  });

  useEffect(() => {
    if (lead) {
      setForm({
        nombres: lead.nombres ?? '',
        apellidos: lead.apellidos ?? '',
        dni: lead.dni ?? '',
        email: lead.email ?? '',
        telefono: lead.telefono ?? '',
        ocupacion: lead.ocupacion ?? '',
        ciudad: lead.ciudad ?? '',
        descripcion: lead.descripcion ?? '',
      });
    }
  }, [lead]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!usuarioFreelerId) throw new Error('No se pudo identificar al freeler autenticado');
      return leadsService.update(String(id), {
        usuarioFreelerId,
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        dni: form.dni.trim() || undefined,
        email: form.email.trim() || undefined,
        telefono: form.telefono.trim() || undefined,
        ocupacion: form.ocupacion.trim() || undefined,
        ciudad: form.ciudad.trim() || undefined,
        descripcion: form.descripcion.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Lead actualizado');
    },
    onError: (error) => {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/freeler/leads')} iconStart={<ArrowLeft className="h-4 w-4" />}>
              Volver
            </Button>
            <h1 className="text-[--color-text]">Detalle del Lead</h1>
          </div>
          <Button size="sm" onClick={() => updateMutation.mutate()} loading={updateMutation.isPending} iconStart={<Check className="h-4 w-4" />}>
            Guardar cambios
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {isLoading || !lead ? (
          <div className="text-gray-400">Cargando...</div>
        ) : (
          <div className="bg-[--color-surface] rounded-lg border border-gray-800 p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2 text-[--color-text]">Nombres</label>
                <input
                  name="nombres"
                  value={form.nombres}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[--color-bg] border border-gray-700 rounded-lg text-[--color-text]"
                />
              </div>
              <div>
                <label className="block text-sm mb-2 text-[--color-text]">Apellidos</label>
                <input
                  name="apellidos"
                  value={form.apellidos}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[--color-bg] border border-gray-700 rounded-lg text-[--color-text]"
                />
              </div>
              <div>
                <label className="block text-sm mb-2 text-[--color-text]">DNI</label>
                <input
                  name="dni"
                  value={form.dni}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[--color-bg] border border-gray-700 rounded-lg text-[--color-text]"
                />
              </div>
              <div>
                <label className="block text-sm mb-2 text-[--color-text]">Teléfono</label>
                <input
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[--color-bg] border border-gray-700 rounded-lg text-[--color-text]"
                />
              </div>
              <div>
                <label className="block text-sm mb-2 text-[--color-text]">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[--color-bg] border border-gray-700 rounded-lg text-[--color-text]"
                />
              </div>
              <div>
                <label className="block text-sm mb-2 text-[--color-text]">Ocupación</label>
                <input
                  name="ocupacion"
                  value={form.ocupacion}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[--color-bg] border border-gray-700 rounded-lg text-[--color-text]"
                />
              </div>
              <div>
                <label className="block text-sm mb-2 text-[--color-text]">Ciudad</label>
                <input
                  name="ciudad"
                  value={form.ciudad}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[--color-bg] border border-gray-700 rounded-lg text-[--color-text]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 text-[--color-text]">Notas</label>
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 bg-[--color-bg] border border-gray-700 rounded-lg text-[--color-text]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Campaña</div>
                <div className="text-[--color-text]">{lead.campania?.nombre || '-'}</div>
              </div>
              <div>
                <div className="text-gray-400">Origen</div>
                <div className="text-[--color-text]">{lead.origen}</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default LeadDetailFreeler;

