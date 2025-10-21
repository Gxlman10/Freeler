interface StatusBadgeProps {
  status: number;
  labels: Record<number, string>;
  colors?: Record<number, string>;
}

export function StatusBadge({ status, labels, colors }: StatusBadgeProps) {
  const defaultColors: Record<number, string> = {
    1: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    2: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    3: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  
  const colorMap = colors || defaultColors;
  const label = labels[status] || 'Desconocido';
  const colorClass = colorMap[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${colorClass}`}>
      {label}
    </span>
  );
}

export function LeadStatusBadge({ status }: { status: number }) {
  const labels = {
    1: 'En Gestión',
    2: 'Ganado',
    3: 'Perdido',
  };
  
  return <StatusBadge status={status} labels={labels} />;
}

export function CommissionStatusBadge({ status }: { status: number }) {
  const labels = {
    2: 'Por Cobrar',
    3: 'Cobrada',
  };
  
  const colors = {
    2: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    3: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  };
  
  return <StatusBadge status={status} labels={labels} colors={colors} />;
}
