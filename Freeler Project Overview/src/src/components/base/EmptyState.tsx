import { FileX } from 'lucide-react';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 text-gray-400">
        {icon || <FileX className="h-16 w-16" />}
      </div>
      <h3 className="mb-2 text-gray-700 dark:text-gray-300">{title}</h3>
      {description && (
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400 max-w-md">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
