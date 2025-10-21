import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus, Search, Pencil } from 'lucide-react';
import { Button } from '../../components/base/Button';
import { EmptyState } from '../../components/base/EmptyState';
import { campanasService } from '../../services/campanas.service';

export function CampanasListEmpresa() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['empresa-campanas', page, search],
    queryFn: () => campanasService.getAll({ page, limit, search }),
    staleTime: 30000,
  });

  const campanas = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-[--color-bg]">
      <header className="bg-[--color-surface] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/empresa')} iconStart={<ArrowLeft className="h-4 w-4" />}>
              Volver
            </Button>
            <h1 className="text-[--color-text]">CampaÃ±as</h1>
          </div>
          <Button size="sm" iconStart={<Plus className="h-4 w-4" />} onClick={() => navigate('/empresa/campanas/new')}>Nueva campaÃ±a</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar campaÃ±a..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : campanas.length === 0 ? (
          <EmptyState title="No hay campaÃ±as" description="Crea tu primera campaÃ±a" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campanas.map((c) => (
              <div key={c.id} className="bg-[--color-surface] rounded-lg border border-gray-800 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-[--color-text] mb-1">{c.nombre}</h3>
                    {c.descripcion && <p className="text-sm text-gray-400 line-clamp-2">{c.descripcion}</p>}
                  </div>
                  <Button variant="ghost" size="sm" iconStart={<Pencil className="h-4 w-4" />} onClick={() => navigate(`/empresa/campanas/${(c as any).id_campania ?? c.id}/edit`)}>Editar</Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Anterior</Button>
            <span className="text-sm text-gray-400">PÃ¡gina {page} de {totalPages}</span>
            <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Siguiente</Button>
          </div>
        )}
      </main>
    </div>
  );
}

export default CampanasListEmpresa;

