import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/store/auth';
import { Role } from '@/utils/constants';

type Props = {
  children: ReactNode;
  allow: Role[];
};

export const GuardedRoute = ({ children, allow }: Props) => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Validando sesion...</div>;
  }
  if (!user) return <Navigate to="/crm/login" replace />;
  if (!user.role || !allow.includes(user.role)) {
    return <Navigate to="/crm/sin-acceso" replace />;
  }
  return <>{children}</>;
};
