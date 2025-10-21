import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ProtectedRoute } from './src/components/ProtectedRoute';

// Pages
import { Landing } from './src/pages/Landing';
import { LoginEmpresa } from './src/pages/auth/LoginEmpresa';
import { LoginFreeler } from './src/pages/auth/LoginFreeler';
import { RegisterEmpresa } from './src/pages/auth/RegisterEmpresa';
import { RegisterFreeler } from './src/pages/auth/RegisterFreeler';
import { DashboardFreeler } from './src/pages/freeler/DashboardFreeler';
import { LeadsListFreeler } from './src/pages/freeler/LeadsListFreeler';
import { CreateLead } from './src/pages/freeler/CreateLead';
import { LeadDetailFreeler } from './src/pages/freeler/LeadDetailFreeler';
import { CampanasFreeler } from './src/pages/freeler/CampanasFreeler';
import { DashboardEmpresa } from './src/pages/empresa/DashboardEmpresa';
import { LeadsListEmpresa } from './src/pages/empresa/LeadsListEmpresa';
import { CampanasListEmpresa } from './src/pages/empresa/CampanasListEmpresa';
import { UsuariosEmpresa } from './src/pages/empresa/UsuariosEmpresa';
import { CampanaCreateEmpresa } from './src/pages/empresa/CampanaCreateEmpresa';
import { UsuarioEmpresaCreate } from './src/pages/empresa/UsuarioEmpresaCreate';
import { CampanaEditEmpresa } from './src/pages/empresa/CampanaEditEmpresa';
import { LeadDetailEmpresa } from './src/pages/empresa/LeadDetailEmpresa';
import { UsuarioEmpresaEdit } from './src/pages/empresa/UsuarioEmpresaEdit';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth/empresa" element={<LoginEmpresa />} />
          <Route path="/auth/empresa/register" element={<RegisterEmpresa />} />
          <Route path="/auth/freeler" element={<LoginFreeler />} />
          <Route path="/auth/freeler/register" element={<RegisterFreeler />} />

          {/* Freeler Routes */}
          <Route
            path="/freeler"
            element={
              <ProtectedRoute requiredType="freeler">
                <DashboardFreeler />
              </ProtectedRoute>
            }
          />
          <Route
            path="/freeler/leads"
            element={
              <ProtectedRoute requiredType="freeler">
                <LeadsListFreeler />
              </ProtectedRoute>
            }
          />
          <Route
            path="/freeler/leads/new"
            element={
              <ProtectedRoute requiredType="freeler">
                <CreateLead />
              </ProtectedRoute>
            }
          />
          <Route
            path="/freeler/leads/:id"
            element={
              <ProtectedRoute requiredType="freeler">
                <LeadDetailFreeler />
              </ProtectedRoute>
            }
          />
          <Route
            path="/freeler/campanas"
            element={
              <ProtectedRoute requiredType="freeler">
                <CampanasFreeler />
              </ProtectedRoute>
            }
          />

          {/* Empresa Routes */}
          <Route
            path="/empresa"
            element={
              <ProtectedRoute requiredType="empresa">
                <DashboardEmpresa />
              </ProtectedRoute>
            }
          />
          <Route
            path="/empresa/leads"
            element={
              <ProtectedRoute requiredType="empresa">
                <LeadsListEmpresa />
              </ProtectedRoute>
            }
          />
          <Route
            path="/empresa/campanas"
            element={
              <ProtectedRoute requiredType="empresa">
                <CampanasListEmpresa />
              </ProtectedRoute>
            }
          />
          <Route
            path="/empresa/campanas/new"
            element={
              <ProtectedRoute requiredType="empresa">
                <CampanaCreateEmpresa />
              </ProtectedRoute>
            }
          />
          <Route
            path="/empresa/campanas/:id/edit"
            element={
              <ProtectedRoute requiredType="empresa">
                <CampanaEditEmpresa />
              </ProtectedRoute>
            }
          />
          <Route
            path="/empresa/usuarios"
            element={
              <ProtectedRoute requiredType="empresa">
                <UsuariosEmpresa />
              </ProtectedRoute>
            }
          />
          <Route
            path="/empresa/usuarios/new"
            element={
              <ProtectedRoute requiredType="empresa">
                <UsuarioEmpresaCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/empresa/usuarios/:id/edit"
            element={
              <ProtectedRoute requiredType="empresa">
                <UsuarioEmpresaEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/empresa/leads/:id"
            element={
              <ProtectedRoute requiredType="empresa">
                <LeadDetailEmpresa />
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
