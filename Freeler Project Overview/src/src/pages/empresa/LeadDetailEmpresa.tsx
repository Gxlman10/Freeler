import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check, UserPlus, Flag } from 'lucide-react';
import { Button } from '../../components/base/Button';
import { leadsService } from '../../services/leads.service';
import { decodeToken } from '../../utils/auth';
import { toast } from 'sonner';

export function LeadDetailEmpresa() {
  const navigate = useNavigate();
  const { id } = useParams();
  const token = decodeToken();
  const usuarioEmpresaId = token?.type === 'empresa' ? String(token.sub) : '';

  const { data: lead, refetch, isLoading } = useQuery({
    enabled: !!id,
    queryKey: ['lead', 'empresa', id],
    queryFn: () => leadsService.getById(String(id)),
  });

  const [estado, setEstado] = useState<number | ''>('' as any);

  useEffect(() => {
    if (lead?.id_estado_lead) setEstado(lead.id_estado_lead);
  }, [lead]);

  const assignSelf = useMutation({
    mutationFn: async () => {
      if (!usuarioEmpresaId) throw new Error('No se pudo identificar al usuario empresa');
      return leadsService.assignSelf(String(id), usuarioEmpresaId);
    },
    onSuccess: () => {
      toast.success('Lead asignado');
      refetch();
    },
    onError: () => toast.error('No se pudo asignar el lead'),
  });

  const changeStatus = useMutation({
    mutationFn: async () => {
      if (!estado || !usuarioEmpresaId) throw new Error('Selecciona un estado válido');
      return leadsService.updateStatus(String(id), Number(estado), usuarioEmpresaId);
    },
    onSuccess: () => {
      toast.success('Estado actualizado');
      refetch();
    },
    onError: () => toast.error('No se pudo actualizar el estado'),
  });

  const markSold = useMutation({
    mutationFn: async () => {
      if (!usuarioEmpresaId) throw new Error('No se pudo identificar al usuario empresa');
      return leadsService.markSold(String(id), usuarioEmpresaId);
    },
    onSuccess: () => {
      toast.success('Lead marcado como vendido');
      refetch();
    },
    onError: () => toast.error('No se pudo marcar como vendido'),
  });

  return (
    <div className="min-h-screen bg-[--color-bg]">
      <header className="bg-[--color-surface] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/empresa/leads')} iconStart={<ArrowLeft className="h-4 w-4" />}>
              Volver
            </Button>
            <h1 className="text-[--color-text]">Detalle de lead</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {isLoading || !lead ? (
          <div className="text-gray-400">Cargando...</div>
        ) : (
          <>
            <div className="bg-[--color-surface] rounded-lg border border-gray-800 p-6">
              <h2 className="text-[--color-text] mb-4">Información</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Cliente</div>
                  <div className="text-[--color-text]">{`${lead.nombres} ${lead.apellidos}`}</div>
                </div>
                <div>
                  <div className="text-gray-400">Campaña</div>
                  <div className="text-[--color-text]">{lead.campania?.nombre || '-'}</div>
                </div>
                <div>
                  <div className="text-gray-400">Email</div>
                  <div className="text-[--color-text]">{lead.email || '-'}</div>
                </div>
                <div>
                  <div className="text-gray-400">Teléfono</div>
                  <div className="text-[--color-text]">{lead.telefono || '-'}</div>
                </div>
                <div>
                  <div className="text-gray-400">Ocupación</div>
                  <div className="text-[--color-text]">{lead.ocupacion || '-'}</div>
                </div>
                <div>
                  <div className="text-gray-400">Ciudad</div>
                  <div className="text-[--color-text]">{lead.ciudad || '-'}</div>
                </div>
              </div>
            </div>

            <div className="bg-[--color-surface] rounded-lg border border-gray-800 p-6">
              <h2 className="text-[--color-text] mb-4">Acciones</h2>
              <div className="flex flex-wrap gap-3 items-end">
                <Button
                  size="sm"
                  onClick={() => assignSelf.mutate()}
                  loading={assignSelf.isPending}
                  iconStart={<UserPlus className="h-4 w-4" />}
                >
                  Autoasignar
                </Button>

                <div>
                  <label className="block text-sm mb-1 text-[--color-text]">Estado</label>
                  <select
                    value={estado as number | ''}
                    onChange={(e) => setEstado(parseInt(e.target.value, 10))}
                    className="px-3 py-2 bg-[--color-bg] border border-gray-700 rounded text-[--color-text]"
                  >
                    <option value="1">En gestión</option>
                    <option value="2">Ganado</option>
                    <option value="3">Perdido</option>
                  </select>
                </div>

                <Button
                  size="sm"
                  onClick={() => changeStatus.mutate()}
                  loading={changeStatus.isPending}
                  iconStart={<Check className="h-4 w-4" />}
                >
                  Actualizar estado
                </Button>

                <Button
                  size="sm"
                  onClick={() => markSold.mutate()}
                  loading={markSold.isPending}
                  variant="secondary"
                  iconStart={<Flag className="h-4 w-4" />}
                >
                  Marcar vendido
                </Button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default LeadDetailEmpresa;

