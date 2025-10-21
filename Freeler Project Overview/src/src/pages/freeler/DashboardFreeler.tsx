import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PlusCircle, List, LogOut, Briefcase, Users } from 'lucide-react';
import { Button } from '../../components/base/Button';
import { removeToken, decodeToken } from '../../utils/auth';
import { leadsService } from '../../services/leads.service';
import { campanasService } from '../../services/campanas.service';

export function DashboardFreeler() {
  const navigate = useNavigate();
  const user = decodeToken();
  const usuarioFreelerId = user?.type === 'freeler' ? user.sub : null;

  const { data: leadsSummary } = useQuery({
    enabled: !!usuarioFreelerId,
    queryKey: ['freeler-leads-summary', usuarioFreelerId],
    queryFn: () => leadsService.getMine(usuarioFreelerId ?? '', { page: 1, limit: 1 }),
    staleTime: 15000,
  });

  const { data: campanasData } = useQuery({
    queryKey: ['campanas', 'freeler-dashboard'],
    queryFn: () => campanasService.getAll({ limit: 1 }),
    staleTime: 15000,
  });

  const totalLeads = leadsSummary?.total ?? 0;
  const totalCampanas = campanasData?.total ?? 0;

  const handleLogout = () => {
    removeToken();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[--color-bg]">
      <header className="bg-[--color-surface] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-[--color-primary]">Freeler</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} iconStart={<LogOut className="h-4 w-4" />}>
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h2 className="text-[--color-text] mb-2">Tu panel</h2>
          <p className="text-gray-400">Gestiona tus leads y descubre nuevas campañas</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[--color-surface] rounded-lg p-6 border border-gray-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[--color-secondary]/10 rounded-lg">
                <Users className="h-6 w-6 text-[--color-secondary]" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Leads registrados</p>
                <p className="text-2xl text-[--color-text]">{totalLeads}</p>
              </div>
            </div>
          </div>

          <div className="bg-[--color-surface] rounded-lg p-6 border border-gray-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[--color-primary]/10 rounded-lg">
                <Briefcase className="h-6 w-6 text-[--color-primary]" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Campañas activas</p>
                <p className="text-2xl text-[--color-text]">{totalCampanas}</p>
              </div>
            </div>
          </div>

          <div className="bg-[--color-surface] rounded-lg p-6 border border-gray-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[--color-warning]/10 rounded-lg">
                <List className="h-6 w-6 text-[--color-warning]" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Leads en curso</p>
                <p className="text-2xl text-[--color-text]">{totalLeads}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            onClick={() => navigate('/freeler/leads/new')}
            className="bg-[--color-surface] rounded-lg p-6 border border-gray-800 hover:border-[--color-primary] transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[--color-primary]/10 rounded-lg">
                <PlusCircle className="h-6 w-6 text-[--color-primary]" />
              </div>
              <div>
                <h3 className="text-[--color-text] mb-1">Crear lead</h3>
                <p className="text-sm text-gray-400">Registra un nuevo prospecto</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate('/freeler/leads')}
            className="bg-[--color-surface] rounded-lg p-6 border border-gray-800 hover:border-[--color-secondary] transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[--color-secondary]/10 rounded-lg">
                <List className="h-6 w-6 text-[--color-secondary]" />
              </div>
              <div>
                <h3 className="text-[--color-text] mb-1">Mis leads</h3>
                <p className="text-sm text-gray-400">Gestiona la información de tus referidos</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate('/freeler/campanas')}
            className="bg-[--color-surface] rounded-lg p-6 border border-gray-800 hover:border-[--color-warning] transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[--color-warning]/10 rounded-lg">
                <Briefcase className="h-6 w-6 text-[--color-warning]" />
              </div>
              <div>
                <h3 className="text-[--color-text] mb-1">Campañas</h3>
                <p className="text-sm text-gray-400">Conoce oportunidades disponibles</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardFreeler;

