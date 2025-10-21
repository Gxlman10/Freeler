import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/base/Button';
import { campanasService } from '../../services/campanas.service';
import { formatDate } from '../../utils/formatters';

export function CampanasFreeler() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['campanas', 'freeler-list'],
    queryFn: () => campanasService.getAll({ limit: 100 }),
    staleTime: 30000,
  });

  const campanas = data?.data ?? [];

  return (
    <div className="min-h-screen bg-[--color-bg]">
      <header className="bg-[--color-surface] border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/freeler')} iconStart={<ArrowLeft className="h-4 w-4" />}>
            Volver
          </Button>
          <h1 className="text-[--color-text]">Campañas disponibles</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-gray-400">Cargando campañas...</div>
        ) : campanas.length === 0 ? (
          <div className="text-gray-400">No hay campañas activas en este momento.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campanas.map((camp: any) => (
              <div key={(camp as any).id_campania ?? camp.id} className="bg-[--color-surface] rounded-lg border border-gray-800 p-6 space-y-4">
                <div>
                  <h2 className="text-[--color-text] text-lg mb-1">{camp.nombre}</h2>
                  {camp.descripcion && <p className="text-sm text-gray-400 line-clamp-3">{camp.descripcion}</p>}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <DollarSign className="h-4 w-4 text-[--color-success]" />
                  <span>Comisión: S/ {Number(camp.comision ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {camp.fecha_inicio ? formatDate(camp.fecha_inicio) : 'Sin fecha'}
                    {camp.fecha_fin ? ` - ${formatDate(camp.fecha_fin)}` : ''}
                  </span>
                </div>
                {camp.ubicacion && <div className="text-sm text-gray-400">Ubicación: {camp.ubicacion}</div>}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default CampanasFreeler;

