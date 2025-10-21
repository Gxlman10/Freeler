import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Search, Plus, Pencil, Trash } from 'lucide-react';
import { Button } from '../../components/base/Button';
import { EmptyState } from '../../components/base/EmptyState';
import { usuariosEmpresaService } from '../../services/usuarios-empresa.service';

export function UsuariosEmpresa() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['usuarios-empresa', page, search],
    queryFn: () => usuariosEmpresaService.list({ page, limit, search }),
    staleTime: 30000,
  });

  const users = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const removeMutation = useMutation({
    mutationFn: async (id: number) => usuariosEmpresaService.remove(id),
    onSuccess: () => { window.location.reload(); },
  });

  return (
    <div className="min-h-screen bg-[--color-bg]">
      <header className="bg-[--color-surface] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/empresa')} iconStart={<ArrowLeft className="h-4 w-4" />}>
              Volver
            </Button>
            <h1 className="text-[--color-text]">Usuarios de empresa</h1>
          </div>
          <Button size="sm" iconStart={<Plus className="h-4 w-4" />} onClick={() => navigate('/empresa/usuarios/new')}>Nuevo usuario</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuario..."
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
        ) : users.length === 0 ? (
          <EmptyState title="No hay usuarios" description="Crea usuarios para tu empresa" />
        ) : (
          <div className="bg-[--color-surface] rounded-lg border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm text-gray-400">Nombre</th>
                  <th className="px-4 py-3 text-left text-sm text-gray-400">Email</th>
                  <th className="px-4 py-3 text-left text-sm text-gray-400">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {users.map((u) => (
                  <tr key={(u as any).id || (u as any).id_usuario_empresa} className="hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-[--color-text]">
                      {(u as any).nombres && (u as any).apellidos ? `${(u as any).nombres} ${(u as any).apellidos}` : (u as any).nombre_empresa || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{(u as any).email || '-'}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <Button variant="ghost" size="sm" iconStart={<Pencil className="h-4 w-4" />} onClick={() => navigate(`/empresa/usuarios/${(u as any).id_usuario_empresa}/edit`)}>Editar</Button>
                      <Button variant="ghost" size="sm" iconStart={<Trash className="h-4 w-4" />} onClick={() => removeMutation.mutate((u as any).id_usuario_empresa)}>Desactivar</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Anterior</Button>
            <span className="text-sm text-gray-400">Página {page} de {totalPages}</span>
            <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Siguiente</Button>
          </div>
        )}
      </main>
    </div>
  );
}

export default UsuariosEmpresa;
