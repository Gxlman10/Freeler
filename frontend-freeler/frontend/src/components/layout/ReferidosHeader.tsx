import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun, LogIn, UserPlus, LogOut, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/theme/useTheme';
import { useAuth } from '@/store/auth';
import { APP_ROUTES } from '@/utils/constants';

export const ReferidosHeader = () => {
  const { resolvedMode, setMode } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setMenuOpen] = useState(false);

  const themeLabel = resolvedMode === 'dark' ? 'Modo claro' : 'Modo oscuro';
  const toggleTheme = () => setMode(resolvedMode === 'dark' ? 'light' : 'dark');
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'text-primary-600' : 'text-content-muted transition hover:text-primary-600';

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface shadow-card transition-colors">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <button
            type="button"
            className="text-2xl font-semibold text-primary-600 md:text-3xl"
            onClick={() => navigate(APP_ROUTES.referidos.home)}
          >
            Freeler
          </button>
          <nav className="hidden items-center gap-4 text-sm font-medium text-content sm:flex">
            <NavLink to={APP_ROUTES.referidos.home} className={linkClass}>
              Campanias
            </NavLink>
            {user && (
              <>
                <NavLink to={APP_ROUTES.referidos.misReferidos} className={linkClass}>
                  Mis referidos
                </NavLink>
                <NavLink to={APP_ROUTES.referidos.dashboard} className={linkClass}>
                  Dashboard
                </NavLink>
                <NavLink to={APP_ROUTES.referidos.capacitacion} className={linkClass}>
                  Capacitacion
                </NavLink>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="md:hidden">
            <Button
              variant="ghost"
              onClick={() => setMenuOpen((prev) => !prev)}
              leftIcon={isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              aria-label={isMenuOpen ? 'Cerrar menu' : 'Abrir menu'}
            />
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Button
              variant="ghost"
              onClick={toggleTheme}
              leftIcon={resolvedMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            >
              {themeLabel}
            </Button>

            {user ? (
              <Button variant="outline" onClick={logout} leftIcon={<LogOut className="h-4 w-4" />}>
                Salir
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate(APP_ROUTES.referidos.login)}
                  leftIcon={<LogIn className="h-4 w-4" />}
                >
                  Iniciar sesion
                </Button>
                <Button
                  onClick={() => navigate(APP_ROUTES.referidos.register)}
                  leftIcon={<UserPlus className="h-4 w-4" />}
                >
                  Registrarse
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t border-border bg-surface shadow-card md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 text-sm text-content">
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => {
                toggleTheme();
                closeMenu();
              }}
              leftIcon={resolvedMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            >
              {themeLabel}
            </Button>
            <NavLink to={APP_ROUTES.referidos.home} className={linkClass} onClick={closeMenu}>
              Campanias
            </NavLink>
            {user ? (
              <>
                <NavLink to={APP_ROUTES.referidos.misReferidos} className={linkClass} onClick={closeMenu}>
                  Mis referidos
                </NavLink>
                <NavLink to={APP_ROUTES.referidos.dashboard} className={linkClass} onClick={closeMenu}>
                  Dashboard
                </NavLink>
                <NavLink to={APP_ROUTES.referidos.capacitacion} className={linkClass} onClick={closeMenu}>
                  Capacitacion
                </NavLink>
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => {
                    closeMenu();
                    logout();
                  }}
                  leftIcon={<LogOut className="h-4 w-4" />}
                >
                  Salir
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => {
                    closeMenu();
                    navigate(APP_ROUTES.referidos.login);
                  }}
                  leftIcon={<LogIn className="h-4 w-4" />}
                >
                  Iniciar sesion
                </Button>
                <Button
                  className="justify-start"
                  onClick={() => {
                    closeMenu();
                    navigate(APP_ROUTES.referidos.register);
                  }}
                  leftIcon={<UserPlus className="h-4 w-4" />}
                >
                  Registrarse
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default ReferidosHeader;
