import { jwtDecode } from 'jwt-decode';

export interface TokenPayload {
  sub: string;
  type: 'empresa' | 'freeler';
  email: string;
  role?: string;
  exp?: number;
}

export const getToken = (): string | null => {
  return localStorage.getItem('access_token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('access_token', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('access_token');
};

export const decodeToken = (): TokenPayload | null => {
  const token = getToken();
  if (!token) return null;
  
  try {
    return jwtDecode<TokenPayload>(token);
  } catch {
    return null;
  }
};

export const isTokenExpired = (): boolean => {
  const decoded = decodeToken();
  if (!decoded || !decoded.exp) return true;
  
  return decoded.exp * 1000 < Date.now();
};

export const isAuthenticated = (): boolean => {
  const token = getToken();
  return !!token && !isTokenExpired();
};

export const getUserType = (): 'empresa' | 'freeler' | null => {
  const decoded = decodeToken();
  return decoded?.type || null;
};

export const getUserRole = (): string | null => {
  const decoded = decodeToken();
  return decoded?.role || null;
};

export const hasRole = (requiredRole: string): boolean => {
  const role = getUserRole();
  return role === requiredRole;
};

export const isAdmin = (): boolean => {
  return hasRole('admin');
};

export const isSupervisor = (): boolean => {
  const role = getUserRole();
  return role === 'admin' || role === 'supervisor';
};
