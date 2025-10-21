import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users } from 'lucide-react';
import { Button } from '../components/base/Button';
import { isAuthenticated, getUserType } from '../utils/auth';

export function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      const userType = getUserType();
      if (userType === 'empresa') {
        navigate('/empresa');
      } else if (userType === 'freeler') {
        navigate('/freeler');
      }
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[--color-bg] flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-[--color-primary] mb-4">Freeler</h1>
          <p className="text-xl text-gray-400">
            Plataforma de gestión de leads y comisiones
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Empresa */}
          <div className="bg-[--color-surface] rounded-lg p-8 border border-gray-800">
            <div className="mb-6 flex justify-center">
              <div className="p-4 bg-[--color-primary]/10 rounded-full">
                <Building2 className="h-12 w-12 text-[--color-primary]" />
              </div>
            </div>
            <h2 className="text-center text-[--color-text] mb-4">Empresas</h2>
            <p className="text-center text-gray-400 mb-6">
              Gestiona campañas, leads y comisiones de tus referidores
            </p>
            <div className="space-y-3">
              <Button
                className="w-full"
                onClick={() => navigate('/auth/empresa')}
              >
                Iniciar Sesión
              </Button>
              <Button
                className="w-full"
                variant="ghost"
                onClick={() => navigate('/auth/empresa/register')}
              >
                Registrarse
              </Button>
            </div>
          </div>

          {/* Freeler */}
          <div className="bg-[--color-surface] rounded-lg p-8 border border-gray-800">
            <div className="mb-6 flex justify-center">
              <div className="p-4 bg-[--color-secondary]/10 rounded-full">
                <Users className="h-12 w-12 text-[--color-secondary]" />
              </div>
            </div>
            <h2 className="text-center text-[--color-text] mb-4">Freelers</h2>
            <p className="text-center text-gray-400 mb-6">
              Refiere clientes potenciales y gana comisiones
            </p>
            <div className="space-y-3">
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => navigate('/auth/freeler')}
              >
                Iniciar Sesión
              </Button>
              <Button
                className="w-full"
                variant="ghost"
                onClick={() => navigate('/auth/freeler/register')}
              >
                Registrarse
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
