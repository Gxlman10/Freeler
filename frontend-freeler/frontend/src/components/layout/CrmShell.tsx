import { FormEvent, Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  Building2,
  Kanban,
  LayoutDashboard,
  LogOut,
  UserCog,
  Users2,
  Waypoints,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/useTheme';
import { APP_ROUTES, Role, ROLE_LABELS } from '@/utils/constants';
import { getRoleBadgeVariant } from '@/utils/badges';
import { cn } from '@/utils/cn';
import { useToast } from '@/components/common/Toasts';
import { AuthService } from '@/services/auth.service';
import { UserService, Empresa, UsuarioEmpresa } from '@/services/user.service';
import { storage } from '@/utils/helpers';

type NavItem = {
  to: string;
  label: string;
  icon: JSX.Element;
};

type SessionEmpresaProfile = UsuarioEmpresa & {
  empresa?: Empresa | null;
};

type ProfileFormState = {
  nombres: string;
  apellidos: string;
  email: string;
};

type CompanyFormState = {
  razon_social: string;
  ruc: string;
  direccion: string;
  telefono: string;
  email: string;
  representante_legal: string;
};

const emptyProfileForm: ProfileFormState = {
  nombres: '',
  apellidos: '',
  email: '',
};

const emptyCompanyForm: CompanyFormState = {
  razon_social: '',
  ruc: '',
  direccion: '',
  telefono: '',
  email: '',
  representante_legal: '',
};

const buildNavItems = (role: Role | null | undefined): NavItem[] => {
  switch (role) {
    case Role.ADMIN:
      return [
        { to: APP_ROUTES.crm.home, label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
        { to: APP_ROUTES.crm.empresas, label: 'Empresas', icon: <Building2 className="h-4 w-4" /> },
        { to: APP_ROUTES.crm.campanas, label: 'Campanas', icon: <Waypoints className="h-4 w-4" /> },
        { to: APP_ROUTES.crm.leads, label: 'Leads', icon: <Users2 className="h-4 w-4" /> },
        { to: APP_ROUTES.crm.usuarios, label: 'Usuarios', icon: <UserCog className="h-4 w-4" /> },
        { to: APP_ROUTES.crm.analitica, label: 'Analitica', icon: <BarChart3 className="h-4 w-4" /> },
      ];
    case Role.SUPERVISOR:
      return [
        { to: APP_ROUTES.crm.supervisor.home, label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
        { to: APP_ROUTES.crm.campanas, label: 'Campanas', icon: <Waypoints className="h-4 w-4" /> },
        { to: APP_ROUTES.crm.supervisor.leads, label: 'Leads', icon: <Users2 className="h-4 w-4" /> },
        { to: APP_ROUTES.crm.usuarios, label: 'Usuarios', icon: <UserCog className="h-4 w-4" /> },
        { to: APP_ROUTES.crm.analitica, label: 'Analitica', icon: <BarChart3 className="h-4 w-4" /> },
      ];
    case Role.VENDEDOR:
      return [
        { to: APP_ROUTES.crm.vendedor.home, label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
        { to: APP_ROUTES.crm.vendedor.leads, label: 'Leads', icon: <Kanban className="h-4 w-4" /> },
      ];
    case Role.ANALISTA:
      return [{ to: APP_ROUTES.crm.analitica, label: 'Analitica', icon: <BarChart3 className="h-4 w-4" /> }];
    default:
      return [];
  }
};

const getInitials = (value?: string | null) => {
  if (!value) return 'UX';
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!parts.length) return value.charAt(0).toUpperCase();
  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('FILE_READ_ERROR'));
    reader.readAsDataURL(file);
  });

const AvatarCircle = ({
  name,
  imageUrl,
  size = 'md',
  className,
}: {
  name?: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) => {
  const sizeClasses =
    size === 'lg'
      ? 'h-16 w-16 text-xl'
      : size === 'sm'
        ? 'h-9 w-9 text-sm'
        : 'h-12 w-12 text-base';

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name ? `Avatar de ${name}` : 'Avatar'}
        className={cn(
          'rounded-full border border-border-subtle object-cover shadow-sm',
          sizeClasses,
          className,
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        'flex items-center justify-center rounded-full bg-primary-600/15 font-semibold text-primary-700 shadow-sm',
        sizeClasses,
        className,
      )}
      aria-hidden
    >
      {getInitials(name)}
    </span>
  );
};

export const CrmShell = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { push } = useToast();
  const { resolvedMode, setMode } = useTheme(); // Control central del tema (light/dark)

  const [isProfileDialogOpen, setProfileDialogOpen] = useState(false);
  const [isCompanyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [isAccountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const [isMobileAccountOpen, setMobileAccountOpen] = useState(false); // Men inferior en mviles

  const toggleTheme = useCallback(
    () => setMode(resolvedMode === 'dark' ? 'light' : 'dark'),
    [resolvedMode, setMode],
  ); // Cambiamos el modo sin depender del valor anterior
  const themeLabel = resolvedMode === 'dark' ? 'Modo claro' : 'Modo oscuro';

  const [profileForm, setProfileForm] = useState<ProfileFormState>(emptyProfileForm);
  const [companyForm, setCompanyForm] = useState<CompanyFormState>(emptyCompanyForm);

  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  const navItems = useMemo(() => buildNavItems(user?.role ?? null), [user?.role]);

  const sessionProfileQuery = useQuery({
    queryKey: ['session-profile', user?.id],
    queryFn: () => AuthService.fetchEmpresaProfile(user!.id) as Promise<SessionEmpresaProfile>,
    enabled: Boolean(user && user.type === 'empresa'),
    staleTime: 1000 * 60 * 3,
  });

  const profile = sessionProfileQuery.data ?? null;
  const company = profile?.empresa ?? null;

  const avatarStorageKey = user ? `freeler:avatar:${user.id}` : null;
  const companyLogoStorageKey = company?.id_empresa ? `freeler:company-logo:${company.id_empresa}` : null;

  useEffect(() => {
    if (!avatarStorageKey) {
      setProfileAvatar(null);
      return;
    }
    const stored = storage.get<string>(avatarStorageKey);
    setProfileAvatar(stored ?? null);
  }, [avatarStorageKey]);

  useEffect(() => {
    if (!companyLogoStorageKey) {
      setCompanyLogo(null);
      return;
    }
    const stored = storage.get<string>(companyLogoStorageKey);
    setCompanyLogo(stored ?? null);
  }, [companyLogoStorageKey]);

  useEffect(() => {
    if (!profile || isProfileDialogOpen) return;
    setProfileForm({
      nombres: profile.nombres ?? '',
      apellidos: profile.apellidos ?? '',
      email: profile.email ?? '',
    });
  }, [profile, isProfileDialogOpen]);

  useEffect(() => {
    if (!company || isCompanyDialogOpen) {
      if (!company) setCompanyForm(emptyCompanyForm);
      return;
    }
    setCompanyForm({
      razon_social: company.razon_social ?? '',
      ruc: company.ruc ?? '',
      direccion: company.direccion ?? '',
      telefono: company.telefono ?? '',
      email: company.email ?? '',
      representante_legal: company.representante_legal ?? '',
    });
  }, [company, isCompanyDialogOpen]);

  useEffect(() => {
    if (!isAccountMenuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccountMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isAccountMenuOpen]);

  const handleAvatarFile = useCallback(
    async (file?: File | null) => {
      if (!file) return;
      try {
        const dataUrl = await readFileAsDataUrl(file);
        setProfileAvatar(dataUrl);
        if (avatarStorageKey) storage.set(avatarStorageKey, dataUrl);
        push({ title: 'Avatar actualizado', description: 'La imagen se guardara en este navegador.' });
      } catch {
        push({
          title: 'No se pudo cargar la imagen',
          description: 'El archivo parece estar danado o no es compatible.',
          variant: 'danger',
        });
      }
    },
    [avatarStorageKey, push],
  );

  const handleCompanyLogoFile = useCallback(
    async (file?: File | null) => {
      if (!file) return;
      try {
        const dataUrl = await readFileAsDataUrl(file);
        setCompanyLogo(dataUrl);
        if (companyLogoStorageKey) storage.set(companyLogoStorageKey, dataUrl);
        push({
          title: 'Logo actualizado',
          description: 'El logo se guardara en este navegador hasta conectarlo con el backend.',
        });
      } catch {
        push({
          title: 'No se pudo cargar el logo',
          description: 'El archivo parece estar danado o no es compatible.',
          variant: 'danger',
        });
      }
    },
    [companyLogoStorageKey, push],
  );

  const clearAvatar = useCallback(() => {
    setProfileAvatar(null);
    if (avatarStorageKey) storage.remove(avatarStorageKey);
  }, [avatarStorageKey]);

  const clearCompanyLogo = useCallback(() => {
    setCompanyLogo(null);
    if (companyLogoStorageKey) storage.remove(companyLogoStorageKey);
  }, [companyLogoStorageKey]);

  const updateProfile = useMutation({
    mutationFn: (payload: Partial<UsuarioEmpresa>) =>
      UserService.updateUsuarioEmpresa(user!.id, payload),
    onSuccess: async () => {
      push({ title: 'Perfil actualizado', description: 'Tus datos se guardaron correctamente.' });
      await queryClient.invalidateQueries({ queryKey: ['session-profile'] });
      setProfileDialogOpen(false);
    },
    onError: () => {
      push({
        title: 'No se pudo actualizar el perfil',
        description: 'Intenta nuevamente en unos segundos.',
        variant: 'danger',
      });
    },
  });

  const updateCompany = useMutation({
    mutationFn: ({ companyId, payload }: { companyId: number; payload: Partial<Empresa> }) =>
      UserService.updateEmpresa(companyId, payload),
    onSuccess: async () => {
      push({ title: 'Empresa actualizada', description: 'La informacion se guardo correctamente.' });
      await queryClient.invalidateQueries({ queryKey: ['session-profile'] });
      setCompanyDialogOpen(false);
    },
    onError: () => {
      push({
        title: 'No se pudo actualizar la empresa',
        description: 'Revisa los datos e intentalo otra vez.',
        variant: 'danger',
      });
    },
  });

    const roleLabel = user?.role ? ROLE_LABELS[user.role] : 'Sin rol';
    const roleBadgeVariant = getRoleBadgeVariant(user?.role);
  const profileName = profile ? `${profile.nombres ?? ''} ${profile.apellidos ?? ''}`.trim() || profile.email : user?.email ?? 'Usuario';
  const companyName = company?.razon_social ?? 'Empresa sin asignar';
  const companySecondary =
    company?.ruc ? `RUC ${company.ruc}` : company?.email ?? 'Actualiza los datos de tu empresa.';

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateProfile.mutate({
      nombres: profileForm.nombres.trim(),
      apellidos: profileForm.apellidos.trim(),
      email: profileForm.email.trim(),
    });
  };

  const handleCompanySubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!company) return;
    updateCompany.mutate({
      companyId: company.id_empresa,
      payload: {
        razon_social: companyForm.razon_social.trim(),
        ruc: companyForm.ruc.trim(),
        direccion: companyForm.direccion.trim() || undefined,
        telefono: companyForm.telefono.trim() || undefined,
        email: companyForm.email.trim() || undefined,
        representante_legal: companyForm.representante_legal.trim() || undefined,
      },
    });
  };

  const handleLogout = useCallback(() => {
    setAccountMenuOpen(false);
    logout();
    navigate(APP_ROUTES.crm.login);
  }, [logout, navigate]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-content">
        <p className="text-sm text-content-muted">Cargando sesion...</p>
      </div>
    );
  }

  return (
    <Fragment>
      <div className="min-h-screen bg-background text-content transition-colors">
        <div className="flex min-h-screen">
          <aside className="hidden w-72 flex-shrink-0 border-r border-border bg-surface-elevated px-5 py-6 shadow-card md:flex md:flex-col lg:w-80">
            <div className="flex flex-1 flex-col gap-6">
                <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface-elevated px-4 py-3 shadow-card">
                  <div>
                    <h1 className="text-xs font-semibold uppercase tracking-wide text-content-subtle">
                      Freeler CRM
                    </h1>
                  </div>
                </div>

              <div className="rounded-xl border border-border-subtle bg-surface px-4 py-4 shadow-card">
                <div className="flex items-start gap-3">
                  <AvatarCircle name={companyName} imageUrl={companyLogo} size="md" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-content">{companyName}</p>
                    <p className="text-xs text-content-muted">{companySecondary}</p>
                  </div>
                </div>
                {company?.direccion && (
                  <p className="mt-3 text-xs text-content-subtle">
                    {company.direccion}
                    {company.telefono ? `  Tel. ${company.telefono}` : ''}
                  </p>
                )}
              </div>

              <nav className="flex flex-1 flex-col gap-1 text-sm font-medium text-content-muted">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'group inline-flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
                        isActive
                          ? 'bg-primary-50 text-primary-700 shadow-card'
                          : 'hover:bg-surface-muted hover:text-content',
                      )
                    }
                  >
                    <span
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-md border border-transparent bg-primary-600/10 text-primary-700 transition-colors group-hover:bg-primary-600/15',
                      )}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div ref={accountMenuRef} className="relative mt-auto">
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((prev) => !prev)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border-subtle bg-surface px-3 py-3 text-left shadow-card transition hover:bg-surface-muted"
                >
                  <AvatarCircle name={profileName} imageUrl={profileAvatar} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-content">{profileName}</p>
                    <p className="text-xs text-content-subtle">{user.email}</p>
                    <Badge variant={roleBadgeVariant} className="mt-2">
                      {roleLabel}
                    </Badge>
                  </div>
                </button>
                {isAccountMenuOpen && (
                  <div className="absolute bottom-[calc(100%+0.75rem)] left-0 w-full rounded-xl border border-border bg-surface-elevated p-2 shadow-card-strong">
                    <button
                      type="button"
                      onClick={() => {
                        toggleTheme();
                        setAccountMenuOpen(false);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-content hover:bg-surface-muted"
                    >
                      {themeLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        setProfileDialogOpen(true);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-content hover:bg-surface-muted"
                    >
                      Editar perfil
                    </button>
                    {(user.role === Role.ADMIN || user.role === Role.SUPERVISOR) && (
                      <button
                        type="button"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          navigate(APP_ROUTES.crm.usuarios);
                        }}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm text-content hover:bg-surface-muted"
                      >
                        Gestionar usuarios
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-500 hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesion
                    </button>
                  </div>
                )}
              </div>
            </div>
          </aside>

          <div className="flex flex-1 flex-col">
            <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 shadow-sm md:hidden">
              <div className="flex items-center gap-3">
                <AvatarCircle name={profileName} imageUrl={profileAvatar} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-content">{profileName}</p>
                    <p className="text-xs text-content-subtle">{companyName}</p>
                    <Badge variant={roleBadgeVariant} className="mt-1">
                      {roleLabel}
                    </Badge>
                  </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 px-3 text-xs"
                  onClick={toggleTheme}
                >
                  {themeLabel}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 px-3 text-xs"
                  onClick={() => setProfileDialogOpen(true)}
                >
                  Editar perfil
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 px-3 text-xs text-red-500 hover:bg-red-500/10 hover:text-red-500"
                  onClick={handleLogout}
                  leftIcon={<LogOut className="h-4 w-4" />}
                >
                  Salir
                </Button>
              </div>
            </header>

            <main className="flex-1 bg-background-subtle px-4 py-8 pb-28 transition-colors md:px-8 md:pb-8">
              <div className="mx-auto max-w-6xl">
                <Outlet />
              </div>
            </main>

            {/* Barra inferior para navegacin en dispositivos mviles */}
            <nav className="fixed inset-x-0 bottom-0 z-[var(--z-drawer)] border-t border-border bg-surface-elevated shadow-card md:hidden">
              <div className="mx-auto flex max-w-4xl items-center justify-around px-4 py-2">
                {navItems.map((item) => (
                  <NavLink
                    key={`mobile-${item.to}`}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'flex flex-col items-center gap-1 text-xs font-medium transition-colors',
                        isActive ? 'text-primary-600' : 'text-content-muted hover:text-content',
                      )
                    }
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-primary-600">
                      {item.icon}
                    </span>
                    <span className="max-w-[5rem] truncate">{item.label}</span>
                  </NavLink>
                ))}
                <button
                  type="button"
                  onClick={() => setMobileAccountOpen(true)}
                  className="flex flex-col items-center gap-1 text-xs font-medium text-content hover:text-primary-600"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-primary-600">
                    <UserCog className="h-5 w-5" />
                  </span>
                  Cuenta
                </button>
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Hoja de acciones simplificada pensada para navegacin mvil */}
      <Dialog
        open={isProfileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        title="Editar perfil"
        description="Actualiza tus datos y la imagen que se muestra en tu cuenta."
      >
        <form className="space-y-5" onSubmit={handleProfileSubmit}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
            <AvatarCircle name={profileName} imageUrl={profileAvatar} size="lg" />
            <div className="flex-1 space-y-2">
              <p className="text-sm text-content-muted">
                Sube una foto en formato JPG o PNG (maximo 2&nbsp;MB). De momento la imagen se conserva de forma local.
              </p>
              <div className="flex flex-wrap gap-2">
                <label className="relative inline-flex cursor-pointer items-center rounded-md border border-border-subtle bg-surface px-3 py-2 text-xs font-semibold text-content hover:bg-surface-muted">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      void handleAvatarFile(file ?? null);
                      event.target.value = '';
                    }}
                  />
                  Cambiar foto
                </label>
                {profileAvatar && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 px-3 text-xs"
                    onClick={clearAvatar}
                  >
                    Quitar
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Nombres"
              value={profileForm.nombres}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, nombres: event.target.value }))}
              required
            />
            <Input
              label="Apellidos"
              value={profileForm.apellidos}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, apellidos: event.target.value }))}
              required
            />
            <Input
              label="Correo electronico"
              type="email"
              value={profileForm.email}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
            <Input
              label="Rol"
              value={roleLabel}
              disabled
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setProfileDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={updateProfile.isLoading}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={isCompanyDialogOpen}
        onOpenChange={setCompanyDialogOpen}
        title="Editar empresa"
        description="Manten actualizada la informacion corporativa visible para tu equipo."
        size="lg"
      >
        <form className="space-y-5" onSubmit={handleCompanySubmit}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
            <AvatarCircle name={companyName} imageUrl={companyLogo} size="lg" />
            <div className="flex-1 space-y-2">
              <p className="text-sm text-content-muted">
                Puedes cargar un logo en formato SVG, PNG o JPG. Por ahora se almacenara localmente hasta conectar con tu backend.
              </p>
              <div className="flex flex-wrap gap-2">
                <label className="relative inline-flex cursor-pointer items-center rounded-md border border-border-subtle bg-surface px-3 py-2 text-xs font-semibold text-content hover:bg-surface-muted">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      void handleCompanyLogoFile(file ?? null);
                      event.target.value = '';
                    }}
                  />
                  Cambiar logo
                </label>
                {companyLogo && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 px-3 text-xs"
                    onClick={clearCompanyLogo}
                  >
                    Quitar
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Razon social"
              value={companyForm.razon_social}
              onChange={(event) =>
                setCompanyForm((prev) => ({ ...prev, razon_social: event.target.value }))
              }
              required
            />
            <Input
              label="RUC"
              value={companyForm.ruc}
              onChange={(event) => setCompanyForm((prev) => ({ ...prev, ruc: event.target.value }))}
              required
            />
            <Input
              label="Correo de contacto"
              type="email"
              value={companyForm.email}
              onChange={(event) => setCompanyForm((prev) => ({ ...prev, email: event.target.value }))}
            />
            <Input
              label="Telefono"
              value={companyForm.telefono}
              onChange={(event) => setCompanyForm((prev) => ({ ...prev, telefono: event.target.value }))}
            />
            <Input
              label="Direccion"
              value={companyForm.direccion}
              onChange={(event) =>
                setCompanyForm((prev) => ({ ...prev, direccion: event.target.value }))
              }
            />
            <Input
              label="Representante legal"
              value={companyForm.representante_legal}
              onChange={(event) =>
                setCompanyForm((prev) => ({ ...prev, representante_legal: event.target.value }))
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCompanyDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={updateCompany.isLoading} disabled={!company}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={isMobileAccountOpen}
        onOpenChange={setMobileAccountOpen}
        title="Accesos de cuenta"
        description="Atajos pensados para pantallas pequenas."
        size="sm"
      >
        <div className="space-y-2">
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-between"
            onClick={() => {
              toggleTheme();
              setMobileAccountOpen(false);
            }}
          >
            {themeLabel}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-between"
            onClick={() => {
              setMobileAccountOpen(false);
              setProfileDialogOpen(true);
            }}
          >
            Editar perfil
          </Button>
          {(user.role === Role.ADMIN || user.role === Role.SUPERVISOR) && (
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-between"
              onClick={() => {
                setMobileAccountOpen(false);
                navigate(APP_ROUTES.crm.usuarios);
              }}
            >
              Gestionar usuarios
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-between text-red-500 hover:bg-red-500/10 hover:text-red-500"
            onClick={() => {
              setMobileAccountOpen(false);
              handleLogout();
            }}
          >
            Cerrar sesion
          </Button>
        </div>
      </Dialog>
    </Fragment>
  );
};

export default CrmShell;
