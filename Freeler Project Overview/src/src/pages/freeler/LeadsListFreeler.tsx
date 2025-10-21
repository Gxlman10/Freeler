import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Search, Eye } from 'lucide-react';
import { Button } from '../../components/base/Button';
import { EmptyState } from '../../components/base/EmptyState';
import { LeadStatusBadge } from '../../components/base/StatusBadge';
import { leadsService } from '../../services/leads.service';
import { decodeToken } from '../../utils/auth';
import { formatDate } from '../../utils/formatters';

export function LeadsListFreeler() {
  const navigate = useNavigate();
  const token = decodeToken();
  const usuarioFreelerId = token?.type === 'freeler' ? token.sub : null;
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useQuery({
    enabled: !!usuarioFreelerId,
    queryKey: ['freeler-leads', usuarioFreelerId, page, search],
    queryFn: () => leadsService.getMine(usuarioFreelerId ?? '', { page, limit, search }),
    staleTime: 30000,
  });

  const leads = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

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
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/freeler')} iconStart={<ArrowLeft className="h-4 w-4" />}>
              Volver
            </Button>
            <h1 className="text-[--color-text]">Mis Leads</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre de cliente..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-[--color-surface] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : leads.length === 0 ? (
          <EmptyState
            title="No tienes leads registrados"
            description="Comienza creando tu primer lead desde el dashboard"
            action={<Button onClick={() => navigate('/freeler/leads/new')}>Crear Lead</Button>}
          />
        ) : (
          <>
            <div className="bg-[--color-surface] rounded-lg border border-gray-800 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm text-gray-400">Cliente</th>
                    <th className="px-4 py-3 text-left text-sm text-gray-400">Campaña</th>
                    <th className="px-4 py-3 text-left text-sm text-gray-400">Estado</th>
                    <th className="px-4 py-3 text-left text-sm text-gray-400">Fecha</th>
                    <th className="px-4 py-3 text-left text-sm text-gray-400">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {leads.map((lead) => (
                    <tr key={lead.id_lead} className="hover:bg-gray-800/30">
                      <td className="px-4 py-3 text-[--color-text]">
                        <div>
                          <div>{`${lead.nombres} ${lead.apellidos}`}</div>
                          {lead.email && <div className="text-sm text-gray-400">{lead.email}</div>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[--color-text]">
                        {lead.campania?.nombre || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <LeadStatusBadge status={lead.id_estado_lead ?? 0} />
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {formatDate(lead.fecha_creacion)}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/freeler/leads/${lead.id_lead}`)}
                          iconStart={<Eye className="h-4 w-4" />}
                        >
                          Ver
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-400">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default LeadsListFreeler;

