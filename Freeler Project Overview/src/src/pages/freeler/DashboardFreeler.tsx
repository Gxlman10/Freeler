import { useNavigate } from 'react-router-dom';
import { PlusCircle, List, LogOut, Briefcase } from 'lucide-react';
import { Button } from '../../components/base/Button';
import { removeToken, decodeToken } from '../../utils/auth';

export function DashboardFreeler() {
  const navigate = useNavigate();
  const user = decodeToken();

  const handleLogout = () => {
    removeToken();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[--color-bg]">
      {/* Header */}
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-[--color-text] mb-2">Bienvenido a tu panel</h2>
          <p className="text-gray-400">Gestiona tus leads y campañas desde aquí</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card: Crear Lead */}
          <div 
            onClick={() => navigate('/freeler/leads/new')}
            className="bg-[--color-surface] rounded-lg p-6 border border-gray-800 hover:border-[--color-primary] transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[--color-primary]/10 rounded-lg">
                <PlusCircle className="h-6 w-6 text-[--color-primary]" />
              </div>
              <div>
                <h3 className="text-[--color-text] mb-1">Crear Lead</h3>
                <p className="text-sm text-gray-400">Registra un nuevo cliente potencial</p>
              </div>
            </div>
          </div>

          {/* Card: Mis Leads */}
          <div 
            onClick={() => navigate('/freeler/leads')}
            className="bg-[--color-surface] rounded-lg p-6 border border-gray-800 hover:border-[--color-secondary] transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[--color-secondary]/10 rounded-lg">
                <List className="h-6 w-6 text-[--color-secondary]" />
              </div>
              <div>
                <h3 className="text-[--color-text] mb-1">Mis Leads</h3>
                <p className="text-sm text-gray-400">Ver todos tus leads registrados</p>
              </div>
            </div>
          </div>

          {/* Card: Campañas */}
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
                <p className="text-sm text-gray-400">Explora campañas disponibles</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
