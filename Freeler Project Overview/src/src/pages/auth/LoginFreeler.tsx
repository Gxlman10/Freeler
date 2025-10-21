import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { Button } from '../../components/base/Button';
import { authService } from '../../services/auth.service';
import { setToken } from '../../utils/auth';
import { toast } from 'sonner';

export function LoginFreeler() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.loginFreeler(email, password);
      setToken(response.access_token);
      toast.success('¡Bienvenido!');
      navigate('/freeler');
    } catch (error) {
      // El interceptor ya muestra el error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[--color-bg] px-4">
      <div className="w-full max-w-md">
        <div className="bg-[--color-surface] rounded-lg shadow-lg p-8">
          <div className="mb-8 text-center">
            <h1 className="text-[--color-primary] mb-2">Freeler</h1>
            <h2 className="text-[--color-text]">Acceso Freelers</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm mb-2 text-[--color-text]">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
                  placeholder="freeler@ejemplo.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm mb-2 text-[--color-text]">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              Iniciar Sesión
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <button
              onClick={() => navigate('/auth/freeler/register')}
              className="text-sm text-[--color-secondary] hover:underline"
            >
              ¿No tienes cuenta? Regístrate
            </button>
            <div className="text-gray-600">|</div>
            <button
              onClick={() => navigate('/auth/empresa')}
              className="text-sm text-[--color-primary] hover:underline"
            >
              ¿Eres Empresa? Ingresa aquí
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginFreeler;

