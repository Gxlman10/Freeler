import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Search, Filter, Eye } from 'lucide-react';
import { Button } from '../../components/base/Button';
import { EmptyState } from '../../components/base/EmptyState';
import { LeadStatusBadge } from '../../components/base/StatusBadge';
import { leadsService } from '../../services/leads.service';
import { campanasService } from '../../services/campanas.service';
import { formatDate } from '../../utils/formatters';

export function LeadsListEmpresa() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [campaniaFilter, setCampaniaFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: campanasData } = useQuery({
    queryKey: ['campanas'],
    queryFn: () => campanasService.getAll({ limit: 100 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['empresa-leads', page, search, campaniaFilter, estadoFilter],
    queryFn: () => leadsService.getAll({ 
      page, 
      limit, 
      search,
      campana_id: campaniaFilter || undefined,
      estado_lead_id: estadoFilter ? parseInt(estadoFilter) : undefined,
    }),
    staleTime: 30000,
  });

  const leads = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);
  const campanas = campanasData?.data || [];

  return (
    <div className="min-h-screen bg-[--color-bg]">
      {/* Header */}
      <header className="bg-[--color-surface] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/empresa')} iconStart={<ArrowLeft className="h-4 w-4" />}>
              Volver
            </Button>
            <h1 className="text-[--color-text]">Gestión de Leads</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-6 bg-[--color-surface] rounded-lg border border-gray-800 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-400">Filtros</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
              />
            </div>

            {/* Campaña */}
            <select
              value={campaniaFilter}
              onChange={(e) => {
                setCampaniaFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
            >
              <option value="">Todas las campañas</option>
              {campanas.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>

            {/* Estado */}
            <select
              value={estadoFilter}
              onChange={(e) => {
                setEstadoFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
            >
              <option value="">Todos los estados</option>
              <option value="1">En Gestión</option>
              <option value="2">Ganado</option>
              <option value="3">Perdido</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : leads.length === 0 ? (
          <EmptyState
            title="No se encontraron leads"
            description="Ajusta los filtros o espera a que los freelers creen nuevos leads"
          />
        ) : (
          <>
            <div className="bg-[--color-surface] rounded-lg border border-gray-800 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm text-gray-400">Cliente</th>
                    <th className="px-4 py-3 text-left text-sm text-gray-400">Campaña</th>
                    <th className="px-4 py-3 text-left text-sm text-gray-400">Freeler</th>
                    <th className="px-4 py-3 text-left text-sm text-gray-400">Estado</th>
                    <th className="px-4 py-3 text-left text-sm text-gray-400">Fecha</th>
                    <th className="px-4 py-3 text-left text-sm text-gray-400">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-800/30">
                      <td className="px-4 py-3 text-[--color-text]">
                        <div>
                          <div>{lead.nombre_cliente}</div>
                          {lead.email && <div className="text-sm text-gray-400">{lead.email}</div>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[--color-text]">
                        {lead.campana?.nombre || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {lead.usuario_freeler ? 
                          `${lead.usuario_freeler.nombre} ${lead.usuario_freeler.apellido}` 
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <LeadStatusBadge status={lead.estado_lead_id} />
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {formatDate(lead.fecha_creacion)}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/empresa/leads/${lead.id}`)}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
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
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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
