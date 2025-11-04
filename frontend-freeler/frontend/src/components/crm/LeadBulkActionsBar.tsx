import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { cn } from '@/utils/cn';

export type LeadBulkAction = 'assign' | 'change-status' | null;

export type BulkVendorOption = {
  id: number;
  label: string;
};

export type BulkStatusOption = {
  id: number;
  label: string;
};

type LeadBulkActionsBarProps = {
  selectedCount: number;
  action: LeadBulkAction;
  onActionChange: (action: LeadBulkAction) => void;
  vendors: BulkVendorOption[];
  statuses: BulkStatusOption[];
  selectedVendorId?: number | null;
  onVendorSelect: (id: number | null) => void;
  selectedStatusId?: number | null;
  onStatusSelect: (id: number | null) => void;
  onClear: () => void;
  onConfirm: () => void;
  disabled?: boolean;
};

const ACTION_BUTTONS: Array<{ key: Exclude<LeadBulkAction, null>; label: string }> = [
  { key: 'assign', label: 'Asignar' },
  { key: 'change-status', label: 'Cambiar estado' },
];

export const LeadBulkActionsBar = ({
  selectedCount,
  action,
  onActionChange,
  vendors,
  statuses,
  selectedVendorId,
  onVendorSelect,
  selectedStatusId,
  onStatusSelect,
  onClear,
  onConfirm,
  disabled = false,
}: LeadBulkActionsBarProps) => {
  if (!selectedCount) return null;

  const currentAction: Exclude<LeadBulkAction, null> | null = action ?? null;

  const requiresVendor = currentAction === 'assign';
  const requiresStatus = currentAction === 'change-status';
  const confirmDisabled =
    disabled ||
    !currentAction ||
    (requiresVendor && !selectedVendorId) ||
    (requiresStatus && !selectedStatusId);

  return (
    <div className="fixed bottom-6 left-1/2 z-[var(--z-toast)] w-[94%] max-w-4xl -translate-x-1/2 rounded-xl border border-border bg-surface-elevated px-4 py-3 shadow-card-strong">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-content">
            {selectedCount} {selectedCount === 1 ? 'lead seleccionado' : 'leads seleccionados'}
          </p>
          <p className="text-xs text-content-muted">Selecciona una accion para aplicar en bloque.</p>
        </div>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          {ACTION_BUTTONS.map((item) => (
            <Button
              key={item.key}
              type="button"
              variant={currentAction === item.key ? 'primary' : 'ghost'}
              onClick={() => onActionChange(item.key)}
              className={cn('h-9 px-3 text-xs font-medium', currentAction === item.key && 'shadow-sm')}
            >
              {item.label}
            </Button>
          ))}

          {requiresVendor && (
            <Select
              name="bulk-vendor"
              value={selectedVendorId ? String(selectedVendorId) : ''}
              onChange={(event) =>
                onVendorSelect(event.target.value ? Number(event.target.value) : null)
              }
              className="w-48 whitespace-nowrap"
              options={[
                { value: '', label: 'Selecciona un vendedor' },
                ...vendors.map((vendor) => ({ value: vendor.id, label: vendor.label })),
              ]}
            />
          )}

          {requiresStatus && (
            <Select
              name="bulk-status"
              value={selectedStatusId ? String(selectedStatusId) : ''}
              onChange={(event) =>
                onStatusSelect(event.target.value ? Number(event.target.value) : null)
              }
              className="w-48 whitespace-nowrap"
              options={[
                { value: '', label: 'Selecciona un estado' },
                ...statuses.map((status) => ({ value: status.id, label: status.label })),
              ]}
            />
          )}

          <Button type="button" variant="ghost" onClick={onClear} className="h-9 px-3 text-xs">
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className="h-9 px-4 text-xs"
          >
            Aplicar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LeadBulkActionsBar;
