import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner@2.0.3';
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
import { DashboardEmpresa } from './src/pages/empresa/DashboardEmpresa';
import { LeadsListEmpresa } from './src/pages/empresa/LeadsListEmpresa';

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

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
