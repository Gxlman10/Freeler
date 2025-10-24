import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

type LeadDetailDrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export const LeadDetailDrawer = ({
  open,
  onClose,
  title,
  children,
  footer,
}: LeadDetailDrawerProps) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    // Drawer lateral con fondo difuminado coherente en ambos temas
    <div className="bg-overlay-blur fixed inset-0 z-[var(--z-drawer)] flex justify-end">
      <div className="bg-surface-translucent h-full w-full max-w-xl overflow-y-auto border-l border-border shadow-card-strong">
        <header className="bg-surface-header flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <h2 className="text-lg font-semibold text-content">{title}</h2>
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        </header>
        <div className={cn('px-6 py-4 text-sm text-content')}>{children}</div>
        {footer && (
          <footer className="border-t border-border-subtle px-6 py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
};
