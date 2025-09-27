import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="p-6">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  return <>{children}</>;
};

export default ProtectedRoute;
