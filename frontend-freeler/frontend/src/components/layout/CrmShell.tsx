import { FormEvent, Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  Kanban,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  UserCog,
  Users2,
  Waypoints,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/store/auth';
import { APP_ROUTES, Role, ROLE_LABELS } from '@/utils/constants';
import { getRoleBadgeVariant } from '@/utils/badges';
import { cn } from '@/utils/cn';
import { useToast } from '@/components/common/Toasts';
import { AuthService } from '@/services/auth.service';
import { UserService, Empresa, UsuarioEmpresa } from '@/services/user.service';
import { storage } from '@/utils/helpers';
import { ThemeSwitch } from '@/components/common/ThemeSwitch';
import freelerLogo from '/freeler_logo.svg';
import { t } from '@/i18n';
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
  const labels = {
    dashboard: t('nav.dashboard'),
    campaigns: t('nav.campaigns'),
    leads: t('nav.leads'),
    users: t('nav.users'),
    analytics: t('nav.analytics'),
    kanban: t('nav.leads'),
  };
  switch (role) {
    case Role.ADMIN:
      return [
        { to: APP_ROUTES.crm.home, label: labels.dashboard, icon: <LayoutDashboard className="h-5 w-5" /> },
        { to: APP_ROUTES.crm.campanas, label: labels.campaigns, icon: <Waypoints className="h-5 w-5" /> },
        { to: APP_ROUTES.crm.leads, label: labels.leads, icon: <Users2 className="h-5 w-5" /> },
        { to: APP_ROUTES.crm.usuarios, label: labels.users, icon: <UserCog className="h-5 w-5" /> },
        { to: APP_ROUTES.crm.analitica, label: labels.analytics, icon: <BarChart3 className="h-5 w-5" /> },
      ];
    case Role.SUPERVISOR:
      return [
        { to: APP_ROUTES.crm.supervisor.home, label: labels.dashboard, icon: <LayoutDashboard className="h-5 w-5" /> },
        { to: APP_ROUTES.crm.campanas, label: labels.campaigns, icon: <Waypoints className="h-5 w-5" /> },
        { to: APP_ROUTES.crm.supervisor.leads, label: labels.leads, icon: <Users2 className="h-5 w-5" /> },
        { to: APP_ROUTES.crm.usuarios, label: labels.users, icon: <UserCog className="h-5 w-5" /> },
        { to: APP_ROUTES.crm.analitica, label: labels.analytics, icon: <BarChart3 className="h-5 w-5" /> },
      ];
    case Role.VENDEDOR:
      return [
        { to: APP_ROUTES.crm.vendedor.home, label: labels.dashboard, icon: <LayoutDashboard className="h-5 w-5" /> },
        { to: APP_ROUTES.crm.vendedor.leads, label: labels.kanban, icon: <Kanban className="h-5 w-5" /> },
      ];
    case Role.ANALISTA:
      return [{ to: APP_ROUTES.crm.analitica, label: labels.analytics, icon: <BarChart3 className="h-5 w-5" /> }];
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
        alt={name ? t('common.avatarAlt', { name }) : t('common.avatar')}
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
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { push } = useToast();
  const [isProfileDialogOpen, setProfileDialogOpen] = useState(false);
  const [isCompanyDialogOpen, setCompanyDialogOpen] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement | null>(null);
  const [isHeaderMenuOpen, setHeaderMenuOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileFormState>(emptyProfileForm);
  const [companyForm, setCompanyForm] = useState<CompanyFormState>(emptyCompanyForm);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const navItems = useMemo(() => buildNavItems(user?.role ?? null), [user?.role]);

  useEffect(() => {
    if (!isLoading && (!user || user.type !== 'empresa')) {
      navigate(APP_ROUTES.crm.login, { replace: true });
    }
  }, [isLoading, user, navigate]);
  const empresaUserId = useMemo(() => {
    if (!user || user.type !== 'empresa') return null;
    const parsed = Number(user.id);
    return Number.isFinite(parsed) ? parsed : null;
  }, [user]);
  const sessionProfileQuery = useQuery({
    queryKey: ['session-profile', empresaUserId],
    queryFn: () => AuthService.fetchEmpresaProfile(empresaUserId!) as Promise<SessionEmpresaProfile>,
    enabled: empresaUserId !== null,
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
      telefono: company.telefono ?? '',
      email: company.email ?? '',
      representante_legal: company.representante_legal ?? '',
    });
  }, [company, isCompanyDialogOpen]);
  useEffect(() => {
    if (!isHeaderMenuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target as Node)) {
        setHeaderMenuOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setHeaderMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isHeaderMenuOpen]);
  const handleAvatarFile = useCallback(
    async (file?: File | null) => {
      if (!file) return;
      try {
        const dataUrl = await readFileAsDataUrl(file);
        setProfileAvatar(dataUrl);
        if (avatarStorageKey) storage.set(avatarStorageKey, dataUrl);
        push({
          title: t('crmShell.avatarUpdated'),
          description: t('crmShell.avatarUpdatedDescription'),
        });
      } catch {
        push({
          title: t('crmShell.avatarUpdateError'),
          description: t('crmShell.avatarUpdateErrorDescription'),
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
          title: t('crmShell.logoUpdated'),
          description: t('crmShell.logoUpdatedDescription'),
        });
      } catch {
        push({
          title: t('crmShell.logoUpdateError'),
          description: t('crmShell.logoUpdateErrorDescription'),
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
      push({
        title: t('crmShell.profileUpdated'),
        description: t('crmShell.profileUpdatedDescription'),
      });
      await queryClient.invalidateQueries({ queryKey: ['session-profile'] });
      setProfileDialogOpen(false);
    },
    onError: () => {
      push({
        title: t('crmShell.profileUpdateError'),
        description: t('crmShell.profileUpdateErrorDescription'),
        variant: 'danger',
      });
    },
  });
  const updateCompany = useMutation({
    mutationFn: ({ companyId, payload }: { companyId: number; payload: Partial<Empresa> }) =>
      UserService.updateEmpresa(companyId, payload),
    onSuccess: async () => {
      push({
        title: t('crmShell.companyUpdated'),
        description: t('crmShell.companyUpdatedDescription'),
      });
      await queryClient.invalidateQueries({ queryKey: ['session-profile'] });
      setCompanyDialogOpen(false);
    },
    onError: () => {
      push({
        title: t('crmShell.companyUpdateError'),
        description: t('crmShell.companyUpdateErrorDescription'),
        variant: 'danger',
      });
    },
  });
  const roleLabel = user?.role ? ROLE_LABELS[user.role] : t('crmShell.noRole');
  const roleBadgeVariant = getRoleBadgeVariant(user?.role);
  const profileName =
    profile
      ? `${profile.nombres ?? ''} ${profile.apellidos ?? ''}`.trim() || profile.email
      : user?.email ?? t('crmShell.profileEmailFallback');
  const companyName = company?.razon_social ?? t('crmShell.noAssignedCompany');
  const companySecondary = company?.email ?? t('crmShell.companyPlaceholder');
  const activeCampaignLabel = t('common.allCampaigns');
  const closeHeaderMenu = () => setHeaderMenuOpen(false);
  const headerMenuContent = (
    <>
      <div className="space-y-3 border-b border-border-subtle px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-content-muted">{t('common.profile')}</p>
          <p className="text-sm font-semibold text-content">{profileName}</p>
          <p className="text-xs text-content-subtle">{user.email}</p>
        </div>
        <div className="grid gap-2 text-xs text-content-subtle">
          <div>
            <p className="uppercase tracking-wide">{t('crmShell.roleLabel')}</p>
            <p className="text-content">{roleLabel}</p>
          </div>
          <div>
            <p className="uppercase tracking-wide">{t('common.company')}</p>
            <p className="text-content">{companyName}</p>
            <p className="text-content-subtle">{companySecondary}</p>
          </div>
          <div>
            <p className="uppercase tracking-wide">{t('common.campaign')}</p>
            <p className="text-content">{activeCampaignLabel}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1 px-4 py-3">
        <Button
          variant="ghost"
          className="justify-start"
        onClick={() => {
          closeHeaderMenu();
          setProfileDialogOpen(true);
        }}
      >
          {t('common.editProfile')}
        </Button>
        {(user.role === Role.ADMIN || user.role === Role.SUPERVISOR) && (
          <Button
            variant="ghost"
            className="justify-start"
            onClick={() => {
              closeHeaderMenu();
              navigate(APP_ROUTES.crm.usuarios);
            }}
          >
            {t('nav.manageUsers')}
          </Button>
        )}
        <Button
          variant="ghost"
          className="justify-start text-red-500 hover:bg-red-500/10 hover:text-red-500"
          onClick={() => {
            closeHeaderMenu();
            handleLogout();
          }}
          leftIcon={<LogOut className="h-4 w-4" />}
        >
          {t('crmShell.logoutConfirm')}
        </Button>
      </div>
    </>
  );
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
    setHeaderMenuOpen(false);
    logout();
    navigate(APP_ROUTES.crm.login);
  }, [logout, navigate]);
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-content">
        <p className="text-sm text-content-muted">{t('crmShell.loading')}</p>
      </div>
    );
  }

  if (!user || user.type !== 'empresa') {
    return null;
  }
  return (
    <Fragment>
      <div className="min-h-screen bg-background text-content transition-colors">
        <div className="flex min-h-screen">
          <aside
            className={cn(
              'relative hidden flex-shrink-0 border-r border-border bg-surface-elevated shadow-card transition-all duration-200 md:flex md:flex-col',
              isSidebarCollapsed ? 'w-20 px-3 py-6' : 'w-72 px-5 py-6 lg:w-80',
            )}
          >
            <button
              type="button"
              aria-label={isSidebarCollapsed ? 'Expandir menu' : 'Contraer menu'}
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="absolute top-6 -right-3 z-20 hidden h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-surface shadow-card transition hover:border-primary-400 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 md:flex"
            >
              {isSidebarCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            </button>
            <div className="flex flex-1 flex-col gap-6">
              <div
                className={cn(
                  'rounded-xl border border-border-subtle bg-surface-elevated px-4 py-3 shadow-card',
                  isSidebarCollapsed && 'flex h-12 items-center justify-center border-none bg-transparent px-0 py-0 shadow-none',
                )}
              >
                {isSidebarCollapsed ? (
                  <div className="flex justify-center">
                    <img src={freelerLogo} alt="Freeler CRM" className="h-9 w-auto" />
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <img src={freelerLogo} alt="Freeler CRM" className="h-9 w-auto" />
                    <div>
                      <p className="text-sm font-semibold text-content">{t('common.freelerCrm')}</p>
                      <p className="text-xs text-content-muted">{t('crmShell.dashboardSubtitle')}</p>
                    </div>
                  </div>
                )}
              </div>
              {isSidebarCollapsed ? (
                <div className="flex justify-center">
                  <div className="relative inline-flex">
                    <AvatarCircle name={companyName} imageUrl={companyLogo} size="md" />
                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface text-primary-600 shadow-card">
                      <Building2 className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border-subtle bg-surface px-4 py-4 shadow-card">
                  <div className="flex items-start gap-3">
                    <div className="relative inline-flex">
                      <AvatarCircle name={companyName} imageUrl={companyLogo} size="md" />
                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface text-primary-600 shadow-card">
                        <Building2 className="h-3 w-3" />
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-content">{companyName}</p>
                      <p className="text-xs text-content-muted">{companySecondary}</p>
                    </div>
                  </div>
                </div>
              )}
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
                        isSidebarCollapsed && 'justify-center px-2',
                      )
                    }
                  >
                    <span
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg border border-transparent bg-primary-500/15 text-primary-500 transition-colors group-hover:bg-primary-500/20 dark:bg-primary-400/20 dark:text-primary-200 dark:group-hover:bg-primary-400/25',
                        isSidebarCollapsed && 'h-9 w-9',
                      )}
                    >
                      {item.icon}
                    </span>
                    {!isSidebarCollapsed && <span>{item.label}</span>}
                  </NavLink>
                ))}
              </nav>
              <div className="mt-auto flex w-full items-center gap-3 rounded-xl border border-border-subtle bg-surface px-3 py-3 text-left shadow-card transition">
                <div className="relative inline-flex">
                  <AvatarCircle name={profileName} imageUrl={profileAvatar} size="sm" />
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-surface text-primary-600 shadow-card">
                    <UserIcon className="h-3 w-3" />
                  </span>
                </div>
                {!isSidebarCollapsed && (
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-content">{profileName}</p>
                    <p className="text-xs text-content-subtle">{user.email}</p>
                    <Badge variant={roleBadgeVariant} className="mt-2">
                      {roleLabel}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </aside>
          <div className="flex flex-1 flex-col">
            <header className="flex flex-col gap-3 border-b border-border bg-surface px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-6 md:px-6">
              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-3 sm:flex">
                  <img src={freelerLogo} alt="Freeler CRM" className="h-8 w-auto" />
                  <div>
                    <h1 className="text-xl font-semibold text-content">{t('common.freelerCrm')}</h1>
                    <p className="text-xs text-content-muted">{companyName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:hidden">
                  <img src={freelerLogo} alt="Freeler CRM" className="h-8 w-auto" />
                  <div>
                    <h1 className="text-lg font-semibold text-content">{t('common.freelerCrm')}</h1>
                    <p className="text-xs text-content-muted">{companyName}</p>
                  </div>
                </div>
              </div>
              <div className="relative flex items-center gap-3" ref={headerMenuRef}>
                <ThemeSwitch />
                <button
                  type="button"
                  onClick={() => setHeaderMenuOpen((prev) => !prev)}
                  className="flex items-center gap-3 rounded-full border border-border-subtle bg-surface px-2 py-1.5 transition hover:border-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white">
                    {getInitials(profileName || user?.email)}
                  </span>
                  <span className="hidden flex-col items-start text-left sm:flex">
                    <span className="text-xs text-content-muted">{t('crmShell.myProfile')}</span>
                    <span className="text-sm font-medium text-content">{profileName || user?.email}</span>
                  </span>
                </button>
                {isHeaderMenuOpen && (
                  <div className="absolute right-0 top-full z-40 mt-2 w-72 rounded-xl border border-border bg-surface shadow-lg">
                    {headerMenuContent}
                  </div>
                )}
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
              </div>
            </nav>
          </div>
        </div>
      </div>
      {/* Hoja de acciones simplificada pensada para navegacin mvil */}
      <Dialog
        open={isProfileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        title={t('crmShell.profileDialogTitle')}
        description={t('crmShell.profileDialogDescription')}
      >
        <form className="space-y-5" onSubmit={handleProfileSubmit}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
            <AvatarCircle name={profileName} imageUrl={profileAvatar} size="lg" />
            <div className="flex-1 space-y-2">
              <p className="text-sm text-content-muted">
                {t('crmShell.uploadAvatarHint')}
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
                  {t('crmShell.changePhoto')}
                </label>
                {profileAvatar && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 px-3 text-xs"
                    onClick={clearAvatar}
                  >
                    {t('crmShell.remove')}
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label={t('crmShell.fields.firstName')}
              value={profileForm.nombres}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, nombres: event.target.value }))}
              required
            />
            <Input
              label={t('crmShell.fields.lastName')}
              value={profileForm.apellidos}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, apellidos: event.target.value }))}
              required
            />
            <Input
              label={t('crmShell.fields.email')}
              type="email"
              value={profileForm.email}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
            <Input
              label={t('crmShell.fields.role')}
              value={roleLabel}
              disabled
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setProfileDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" isLoading={updateProfile.isLoading}>
              {t('common.saveChanges')}
            </Button>
          </div>
        </form>
      </Dialog>
      <Dialog
        open={isCompanyDialogOpen}
        onOpenChange={setCompanyDialogOpen}
        title={t('crmShell.companyDialogTitle')}
        description={t('crmShell.companyDialogDescription')}
        size="lg"
      >
        <form className="space-y-5" onSubmit={handleCompanySubmit}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
            <AvatarCircle name={companyName} imageUrl={companyLogo} size="lg" />
            <div className="flex-1 space-y-2">
              <p className="text-sm text-content-muted">
                {t('crmShell.uploadLogoHint')}
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
                  {t('crmShell.changeLogo')}
                </label>
                {companyLogo && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 px-3 text-xs"
                    onClick={clearCompanyLogo}
                  >
                    {t('crmShell.remove')}
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label={t('crmShell.fields.businessName')}
              value={companyForm.razon_social}
              onChange={(event) =>
                setCompanyForm((prev) => ({ ...prev, razon_social: event.target.value }))
              }
              required
            />
            <Input
              label={t('crmShell.fields.ruc')}
              value={companyForm.ruc}
              onChange={(event) => setCompanyForm((prev) => ({ ...prev, ruc: event.target.value }))}
              required
            />
            <Input
              label={t('crmShell.fields.contactEmail')}
              type="email"
              value={companyForm.email}
              onChange={(event) => setCompanyForm((prev) => ({ ...prev, email: event.target.value }))}
            />
            <Input
              label={t('crmShell.fields.phone')}
              value={companyForm.telefono}
              onChange={(event) => setCompanyForm((prev) => ({ ...prev, telefono: event.target.value }))}
            />
            <Input
              label={t('crmShell.fields.address')}
              value={companyForm.direccion}
              onChange={(event) =>
                setCompanyForm((prev) => ({ ...prev, direccion: event.target.value }))
              }
            />
            <Input
              label={t('crmShell.fields.legalRepresentative')}
              value={companyForm.representante_legal}
              onChange={(event) =>
                setCompanyForm((prev) => ({ ...prev, representante_legal: event.target.value }))
              }
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCompanyDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" isLoading={updateCompany.isLoading} disabled={!company}>
              {t('common.saveChanges')}
            </Button>
          </div>
        </form>
      </Dialog>
    </Fragment>
  );
};
export default CrmShell;
