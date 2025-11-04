import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, LogIn, UserPlus, LogOut, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeSwitch } from '@/components/common/ThemeSwitch';
import { useAuth } from '@/store/auth';
import { APP_ROUTES } from '@/utils/constants';

const getInitials = (value?: string | null) => {
  if (!value) return 'FR';
  const parts = value
    .split('@')[0]
    .replace(/[\W_]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return value.substring(0, 2).toUpperCase();
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
};

export const ReferidosHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isNavOpen, setNavOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'text-primary-600' : 'text-content-muted transition hover:text-primary-600';

  const closeNav = () => setNavOpen(false);
  const closeProfile = () => setProfileOpen(false);
  const closeAll = () => {
    closeNav();
    closeProfile();
  };

  const userInitials = getInitials(user?.email ?? user?.type ?? null);
  const userLabel = user?.email ?? 'Freeler';

  const handleLogout = () => {
    logout();
    closeAll();
  };

  const handleEditProfile = () => {
    closeProfile();
    navigate(APP_ROUTES.referidos.dashboard);
  };

  const profileMenuContent = !user
    ? null
    : (
      <>
        <div className="space-y-3 border-b border-border-subtle px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-content-muted">Perfil</p>
            <p className="text-sm font-semibold text-content">{userLabel}</p>
            <p className="text-xs text-content-subtle">
              Rol: {user.type === 'freeler' ? 'Freeler' : user.type}
            </p>
          </div>
          <div className="grid gap-2 text-xs text-content-subtle">
            <div>
              <p className="uppercase tracking-wide">Empresa</p>
              <p className="text-content">
                {user.companyId ? `ID ${user.companyId}` : 'No asignada'}
              </p>
            </div>
            <div>
              <p className="uppercase tracking-wide">Campaña</p>
              <p className="text-content">Selecciona desde el CRM</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1 px-4 py-3">
          <Button variant="ghost" className="justify-start" onClick={handleEditProfile}>
            Editar perfil
          </Button>
          <Button
            variant="ghost"
            className="justify-start text-red-500 hover:bg-red-500/10 hover:text-red-500"
            onClick={handleLogout}
            leftIcon={<LogOut className="h-4 w-4" />}
          >
            Cerrar sesión
          </Button>
        </div>
      </>
    );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface shadow-card transition-colors">
      <div className="mx-auto w-full max-w-7xl px-4 py-3 md:py-0">
        <div className="flex items-center justify-between gap-3 md:h-16">
          <div className="flex flex-1 items-center gap-4 md:gap-6">
            <button
              type="button"
              className="text-2xl font-semibold text-primary-600 md:text-3xl"
              onClick={() => {
                closeAll();
                navigate(APP_ROUTES.referidos.home);
              }}
            >
              Freeler
            </button>
            <nav className="hidden items-center gap-4 text-sm font-medium text-content md:flex">
              <NavLink to={APP_ROUTES.referidos.home} className={linkClass}>
                Campañas
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
                    Capacitación
                  </NavLink>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeSwitch />

            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen((prev) => !prev);
                    closeNav();
                  }}
                  className="flex items-center gap-3 rounded-full border border-border-subtle bg-surface px-2 py-1.5 transition hover:border-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white">
                    {userInitials}
                  </span>
                  <span className="hidden flex-col items-start text-left md:flex">
                    <span className="text-xs text-content-muted">Mi perfil</span>
                    <span className="text-sm font-medium text-content">{userLabel}</span>
                  </span>
                </button>
                {isProfileOpen && profileMenuContent && (
                  <div className="absolute right-0 top-full z-40 mt-2 w-64 rounded-xl border border-border bg-surface shadow-lg">
                    {profileMenuContent}
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Button
                  variant="ghost"
                  onClick={() => navigate(APP_ROUTES.referidos.login)}
                  leftIcon={<LogIn className="h-4 w-4" />}
                >
                  Iniciar sesión
                </Button>
                <Button
                  onClick={() => navigate(APP_ROUTES.referidos.register)}
                  leftIcon={<UserPlus className="h-4 w-4" />}
                >
                  Registrarse
                </Button>
              </div>
            )}

            <div className="relative md:hidden">
              <button
                type="button"
                onClick={() => {
                  setNavOpen((prev) => !prev);
                  closeProfile();
                }}
                aria-label={isNavOpen ? 'Cerrar menú' : 'Abrir menú'}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-surface transition hover:border-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                {isNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              {isNavOpen && (
                <div className="absolute right-0 top-full z-40 mt-2 w-64 rounded-xl border border-border bg-surface shadow-lg p-3 text-sm text-content">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      closeAll();
                      navigate(APP_ROUTES.referidos.home);
                    }}
                  >
                    Campañas
                  </Button>
                  {user ? (
                    <>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          closeAll();
                          navigate(APP_ROUTES.referidos.misReferidos);
                        }}
                      >
                        Mis referidos
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          closeAll();
                          navigate(APP_ROUTES.referidos.dashboard);
                        }}
                      >
                        Dashboard
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          closeAll();
                          navigate(APP_ROUTES.referidos.capacitacion);
                        }}
                      >
                        Capacitación
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          setProfileOpen(true);
                          closeNav();
                        }}
                      >
                        Mi perfil
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-red-500 hover:bg-red-500/10 hover:text-red-500"
                        onClick={handleLogout}
                        leftIcon={<LogOut className="h-4 w-4" />}
                      >
                        Cerrar sesión
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          closeAll();
                          navigate(APP_ROUTES.referidos.login);
                        }}
                        leftIcon={<LogIn className="h-4 w-4" />}
                      >
                        Iniciar sesión
                      </Button>
                      <Button
                        className="w-full justify-start"
                        onClick={() => {
                          closeAll();
                          navigate(APP_ROUTES.referidos.register);
                        }}
                        leftIcon={<UserPlus className="h-4 w-4" />}
                      >
                        Registrarse
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-1 md:hidden">
          <h1 className="text-xl font-semibold text-content">Campañas disponibles</h1>
          <p className="text-xs text-content-muted">
            Explora oportunidades y registra tus referidos para ganar comisiones.
          </p>
        </div>
      </div>
      {isProfileOpen && profileMenuContent && (
        <div className="md:hidden">
          {/* anchorless fallback for mobile ensures menu visible when opened from burger */}
          <div className="fixed inset-0 z-[var(--z-drawer)] bg-black/30" onClick={closeProfile} />
          <div className="fixed inset-x-4 top-24 z-[var(--z-drawer)] rounded-xl border border-border bg-surface shadow-card">
            {profileMenuContent}
          </div>
        </div>
      )}
    </header>
  );
};

export default ReferidosHeader;
