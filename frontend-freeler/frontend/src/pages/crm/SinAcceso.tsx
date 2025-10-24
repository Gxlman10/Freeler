import { EmptyState } from '@/components/common/EmptyState';
import { APP_ROUTES } from '@/utils/constants';
import { Link } from 'react-router-dom';

export const SinAcceso = () => (
  <EmptyState
    title="No tienes acceso a esta seccin"
    description="Solicita a un administrador que actualice tu rol o regresa al panel principal."
    actionLabel="Ir al inicio"
    onAction={() => {
      window.location.href = APP_ROUTES.crm.home;
    }}
  />
);

export default SinAcceso;
