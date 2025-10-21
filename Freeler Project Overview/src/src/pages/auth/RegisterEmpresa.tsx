import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Building2, Phone, MapPin, FileText } from 'lucide-react';
import { Button } from '../../components/base/Button';
import { authService, RegisterEmpresaData } from '../../services/auth.service';
import { setToken } from '../../utils/auth';
import { toast } from 'sonner';

export function RegisterEmpresa() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterEmpresaData>({
    nombre_empresa: '',
    ruc: '',
    email: '',
    password: '',
    telefono: '',
    direccion: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.ruc.length !== 11) {
      toast.error('El RUC debe tener 11 dígitos');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.registerEmpresa(formData);
      setToken(response.access_token);
      toast.success('¡Registro exitoso! Bienvenido');
      navigate('/empresa');
    } catch (error) {
      // Error manejado por interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[--color-bg] px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="bg-[--color-surface] rounded-lg shadow-lg p-8">
          <div className="mb-8 text-center">
            <h1 className="text-[--color-primary] mb-2">Freeler</h1>
            <h2 className="text-[--color-text] mb-2">Registro de Empresa</h2>
            <p className="text-sm text-gray-400">Crea tu cuenta para comenzar a gestionar leads</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre Empresa */}
              <div>
                <label htmlFor="nombre_empresa" className="block text-sm mb-2 text-[--color-text]">
                  Nombre de la Empresa *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="nombre_empresa"
                    name="nombre_empresa"
                    type="text"
                    value={formData.nombre_empresa}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
                    placeholder="Mi Empresa S.A.C."
                    required
                  />
                </div>
              </div>

              {/* RUC */}
              <div>
                <label htmlFor="ruc" className="block text-sm mb-2 text-[--color-text]">
                  RUC *
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="ruc"
                    name="ruc"
                    type="text"
                    value={formData.ruc}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
                    placeholder="20123456789"
                    maxLength={11}
                    pattern="[0-9]{11}"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">11 dígitos</p>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm mb-2 text-[--color-text]">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
                    placeholder="contacto@empresa.com"
                    required
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label htmlFor="telefono" className="block text-sm mb-2 text-[--color-text]">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
                    placeholder="999 999 999"
                  />
                </div>
              </div>

              {/* Dirección */}
              <div className="md:col-span-2">
                <label htmlFor="direccion" className="block text-sm mb-2 text-[--color-text]">
                  Dirección
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="direccion"
                    name="direccion"
                    type="text"
                    value={formData.direccion}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
                    placeholder="Av. Principal 123, Lima"
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label htmlFor="password" className="block text-sm mb-2 text-[--color-text]">
                  Contraseña *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
              </div>

              {/* Confirmar Contraseña */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm mb-2 text-[--color-text]">
                  Confirmar Contraseña *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              Crear Cuenta
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <button
              onClick={() => navigate('/auth/empresa')}
              className="text-sm text-[--color-primary] hover:underline"
            >
              ¿Ya tienes cuenta? Inicia sesión
            </button>
            <div className="text-gray-600">|</div>
            <button
              onClick={() => navigate('/auth/freeler/register')}
              className="text-sm text-[--color-secondary] hover:underline"
            >
              ¿Eres Freeler? Regístrate aquí
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
