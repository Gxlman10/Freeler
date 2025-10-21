import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, CreditCard } from 'lucide-react';
import { Button } from '../../components/base/Button';
import { authService, RegisterFreelerData } from '../../services/auth.service';
import { setToken } from '../../utils/auth';
import { toast } from 'sonner@2.0.3';

export function RegisterFreeler() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterFreelerData>({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    dni: '',
    telefono: '',
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
      toast.error('Las contrase��as no coinciden');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('La contrase��a debe tener al menos 8 caracteres');
      return;
    }

    if (formData.dni.length !== 8) {
      toast.error('El DNI debe tener 8 d��gitos');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.registerFreeler(formData);
      setToken(response.access_token);
      toast.success('��Registro exitoso! Bienvenido');
      navigate('/freeler');
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
            <h2 className="text-[--color-text] mb-2">Registro de Freeler</h2>
            <p className="text-sm text-gray-400">�snete y comienza a ganar comisiones por tus referidos</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre */}
              <div>
                <label htmlFor="nombre" className="block text-sm mb-2 text-[--color-text]">
                  Nombre *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    value={formData.nombre}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
                    placeholder="Juan"
                    required
                  />
                </div>
              </div>

              {/* Apellido */}
              <div>
                <label htmlFor="apellido" className="block text-sm mb-2 text-[--color-text]">
                  Apellido *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="apellido"
                    name="apellido"
                    type="text"
                    value={formData.apellido}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
                    placeholder="PǸrez"
                    required
                  />
                </div>
              </div>

              {/* DNI */}
              <div>
                <label htmlFor="dni" className="block text-sm mb-2 text-[--color-text]">
                  DNI *
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="dni"
                    name="dni"
                    type="text"
                    value={formData.dni}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
                    placeholder="12345678"
                    maxLength={8}
                    pattern="[0-9]{8}"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">8 d��gitos</p>
              </div>

              {/* TelǸfono */}
              <div>
                <label htmlFor="telefono" className="block text-sm mb-2 text-[--color-text]">
                  TelǸfono
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

              {/* Email */}
              <div className="md:col-span-2">
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
                    placeholder="juan.perez@ejemplo.com"
                    required
                  />
                </div>
              </div>

              {/* Contrase��a */}
              <div>
                <label htmlFor="password" className="block text-sm mb-2 text-[--color-text]">
                  Contrase��a *
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
                    placeholder="�?��?��?��?��?��?��?��?�"
                    minLength={8}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">M��nimo 8 caracteres</p>
              </div>

              {/* Confirmar Contrase��a */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm mb-2 text-[--color-text]">
                  Confirmar Contrase��a *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[--color-bg] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary] text-[--color-text]"
                    placeholder="�?��?��?��?��?��?��?��?�"
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
              onClick={() => navigate('/auth/freeler')}
              className="text-sm text-[--color-secondary] hover:underline"
            >
              ��Ya tienes cuenta? Inicia sesi��n
            </button>
            <div className="text-gray-600">|</div>
            <button
              onClick={() => navigate('/auth/empresa/register')}
              className="text-sm text-[--color-primary] hover:underline"
            >
              ��Eres Empresa? Reg��strate aqu��
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

