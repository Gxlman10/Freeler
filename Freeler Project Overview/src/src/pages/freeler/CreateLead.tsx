import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '../../components/base/Button';
import { campanasService } from '../../services/campanas.service';
import { leadsService } from '../../services/leads.service';
import { toast } from 'sonner@2.0.3';

export function CreateLead() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre_cliente: '',
    email: '',
    telefono: '',
    empresa: '',
    cargo: '',
    notas: '',
    campana_id: '',
  });

  const { data: campanasData } = useQuery({
    queryKey: ['campanas'],
    queryFn: () => campanasService.getAll({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => leadsService.create(data),
    onSuccess: () => {
      toast.success('Lead creado exitosamente');
      navigate('/freeler/leads');
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: (data: typeof formData) => leadsService.createDraft(data),
    onSuccess: () => {
      toast.success('Borrador guardado');
      navigate('/freeler/leads');
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleSaveDraft = () => {
    saveDraftMutation.mutate(formData);
  };

  const campanas = campanasData?.data.filter(c => c.activa) || [];

  return (
    <div className="min-h-screen bg-[--color-bg]">
      {/* Header */}
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

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-[--color-surface] rounded-lg border border-gray-800 p-6 space-y-6">
          {/* Campaña */}
          <div>
            <label htmlFor="campana_id" className="block text-sm mb-2 text-[--color-text]">
              Campaña *
            </label>
            <select
              id="campana_id"
              name="campana_id"
              value={formData.campana_id}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
              required
            >
              <option value="">Seleccionar campaña</option>
              {campanas.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          {/* Nombre Cliente */}
          <div>
            <label htmlFor="nombre_cliente" className="block text-sm mb-2 text-[--color-text]">
              Nombre del Cliente *
            </label>
            <input
              id="nombre_cliente"
              name="nombre_cliente"
              type="text"
              value={formData.nombre_cliente}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm mb-2 text-[--color-text]">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label htmlFor="telefono" className="block text-sm mb-2 text-[--color-text]">
              Teléfono
            </label>
            <input
              id="telefono"
              name="telefono"
              type="tel"
              value={formData.telefono}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
            />
          </div>

          {/* Empresa */}
          <div>
            <label htmlFor="empresa" className="block text-sm mb-2 text-[--color-text]">
              Empresa
            </label>
            <input
              id="empresa"
              name="empresa"
              type="text"
              value={formData.empresa}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
            />
          </div>

          {/* Cargo */}
          <div>
            <label htmlFor="cargo" className="block text-sm mb-2 text-[--color-text]">
              Cargo
            </label>
            <input
              id="cargo"
              name="cargo"
              type="text"
              value={formData.cargo}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
            />
          </div>

          {/* Notas */}
          <div>
            <label htmlFor="notas" className="block text-sm mb-2 text-[--color-text]">
              Notas
            </label>
            <textarea
              id="notas"
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="submit"
              loading={createMutation.isPending}
            >
              Crear Lead
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSaveDraft}
              loading={saveDraftMutation.isPending}
              iconStart={<Save className="h-4 w-4" />}
            >
              Guardar Borrador
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
