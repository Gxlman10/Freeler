import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

type TableRootProps = {
  children: ReactNode;
  className?: string;
};

export const Table = ({ children, className }: TableRootProps) => (
  // Contenedor con bordes consistentes y sin transparencias
  <div className={cn('w-full overflow-x-auto rounded-lg border border-border-subtle bg-surface', className)}>
    <table className="min-w-full divide-y divide-border-subtle text-sm">{children}</table>
  </div>
);

type TableSectionProps = {
  children: ReactNode;
  className?: string;
};

export const TableHeader = ({ children, className }: TableSectionProps) => (
  <thead
    className={cn(
      'bg-surface-muted text-left text-xs font-semibold uppercase tracking-wide text-content-subtle',
      className,
    )}
  >
    {children}
  </thead>
);

export const TableBody = ({ children, className }: TableSectionProps) => (
  <tbody className={cn('divide-y divide-border-subtle', className)}>{children}</tbody>
);

type TableRowProps = {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
};

export const TableRow = ({ children, className, onClick }: TableRowProps) => (
  <tr
    onClick={onClick}
    className={cn(
      'transition hover:bg-surface-muted',
      onClick && 'cursor-pointer',
      className,
    )}
  >
    {children}
  </tr>
);

type CellProps = {
  children: ReactNode;
  className?: string;
};

export const TableHead = ({ children, className }: CellProps) => (
  <th
    scope="col"
    className={cn('px-4 py-3 text-xs font-semibold text-content-muted first:pl-6 last:pr-6', className)}
  >
    {children}
  </th>
);

export const TableCell = ({ children, className }: CellProps) => (
  <td className={cn('px-4 py-3 text-sm text-content first:pl-6 last:pr-6', className)}>
    {children}
  </td>
);
