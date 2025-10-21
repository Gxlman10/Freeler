import { Navigate } from 'react-router-dom';
import { isAuthenticated, getUserType, getUserRole } from '../utils/auth';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredType?: 'empresa' | 'freeler';
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredType, requiredRole }: ProtectedRouteProps) {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const userType = getUserType();
  const userRole = getUserRole();

  if (requiredType && userType !== requiredType) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && userRole !== requiredRole && userRole !== 'admin') {
    return <Navigate to={userType === 'empresa' ? '/empresa' : '/freeler'} replace />;
  }

  return <>{children}</>;
}
