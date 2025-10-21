import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, Users, LogOut, List } from 'lucide-react';
import { Button } from '../../components/base/Button';
import { removeToken, decodeToken } from '../../utils/auth';
import { campanasService } from '../../services/campanas.service';
import { usuariosEmpresaService } from '../../services/usuarios-empresa.service';

export function DashboardEmpresa() {
  const navigate = useNavigate();
  const user = decodeToken();

  const { data: campanasStats } = useQuery({
    queryKey: ['campanas-stats'],
    queryFn: () => campanasService.getStats(),
  });

  const { data: usuariosEmpresa } = useQuery({
    queryKey: ['usuarios-empresa-count'],
    queryFn: () => usuariosEmpresaService.list({ page: 1, limit: 1 }),
  });

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
            <span className="text-xs bg-[--color-primary]/20 text-[--color-primary] px-2 py-1 rounded">
              {user?.role}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout} iconStart={<LogOut className="h-4 w-4" />}>
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-[--color-text] mb-2">Dashboard Empresa</h2>
          <p className="text-gray-400">Resumen de campañas y leads</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-[--color-surface] rounded-lg p-6 border border-gray-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[--color-primary]/10 rounded-lg">
                <Briefcase className="h-6 w-6 text-[--color-primary]" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Campañas activas</p>
                <p className="text-2xl text-[--color-text]">{campanasStats?.campanas_activas || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-[--color-surface] rounded-lg p-6 border border-gray-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[--color-secondary]/10 rounded-lg">
                <Users className="h-6 w-6 text-[--color-secondary]" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total leads</p>
                <p className="text-2xl text-[--color-text]">{campanasStats?.total_leads || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-[--color-surface] rounded-lg p-6 border border-gray-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[--color-secondary]/10 rounded-lg">
                <Users className="h-6 w-6 text-[--color-secondary]" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Usuarios de empresa</p>
                <p className="text-2xl text-[--color-text]">{usuariosEmpresa?.total || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            onClick={() => navigate('/empresa/campanas')}
            className="bg-[--color-surface] rounded-lg p-6 border border-gray-800 hover:border-[--color-primary] transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[--color-primary]/10 rounded-lg">
                <Briefcase className="h-6 w-6 text-[--color-primary]" />
              </div>
              <div>
                <h3 className="text-[--color-text] mb-1">Campañas</h3>
                <p className="text-sm text-gray-400">Gestionar campañas</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigate('/empresa/leads')}
            className="bg-[--color-surface] rounded-lg p-6 border border-gray-800 hover:border-[--color-secondary] transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[--color-secondary]/10 rounded-lg">
                <List className="h-6 w-6 text-[--color-secondary]" />
              </div>
              <div>
                <h3 className="text-[--color-text] mb-1">Leads</h3>
                <p className="text-sm text-gray-400">Ver y gestionar leads</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigate('/empresa/usuarios')}
            className="bg-[--color-surface] rounded-lg p-6 border border-gray-800 hover:border-[--color-secondary] transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[--color-secondary]/10 rounded-lg">
                <Users className="h-6 w-6 text-[--color-secondary]" />
              </div>
              <div>
                <h3 className="text-[--color-text] mb-1">Usuarios de empresa</h3>
                <p className="text-sm text-gray-400">Gestionar usuarios</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

