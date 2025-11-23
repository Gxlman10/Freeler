import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CommissionService } from '@/services/commission.service';
import type { Commission } from '@/services/commission.service';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/common/Toasts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { t } from '@/i18n';

export const ComisionesAdmin = () => {
  const [statusFilter, setStatusFilter] = useState<'all' | '1' | '2' | '3'>('all');
  const queryClient = useQueryClient();
  const { push } = useToast();
  const statusLabelMap: Record<number, string> = {
    1: t('crmCommissions.status.pending'),
    2: t('crmCommissions.status.requested'),
    3: t('crmCommissions.status.paid'),
  };
  const statusOptions = [
    { label: t('crmCommissions.filters.status.all'), value: 'all' },
    { label: statusLabelMap[1], value: '1' },
    { label: statusLabelMap[2], value: '2' },
    { label: statusLabelMap[3], value: '3' },
  ];
  const resolveLabel = (status?: number | null) =>
    statusLabelMap[Number(status) as 1 | 2 | 3] ?? statusLabelMap[1];

  const commissionsQuery = useQuery({
    queryKey: ['admin-commissions', statusFilter],
    queryFn: () =>
      CommissionService.list(statusFilter === 'all' ? {} : { id_estado_comision: statusFilter }),
    select: (payload): Commission[] => {
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.data)) return payload.data;
      return [];
    },
  });

  const commissions = commissionsQuery.data ?? [];

  const totals = useMemo(() => {
    return commissions.reduce(
      (acc, commission) => {
        const amount = Number(commission.monto ?? 0);
        const status = Number(commission.id_estado_comision ?? 1);
        if (status === 3) {
          acc.pagado += amount;
        } else if (status === 2) {
          acc.solicitada += amount;
        } else {
          acc.pendiente += amount;
        }
        acc.total += amount;
        return acc;
      },
      { pendiente: 0, solicitada: 0, pagado: 0, total: 0 },
    );
  }, [commissions]);
  const summaryCards = [
    { key: 'pending', label: t('crmCommissions.cards.pending'), value: totals.pendiente },
    { key: 'requested', label: t('crmCommissions.cards.requested'), value: totals.solicitada },
    { key: 'paid', label: t('crmCommissions.cards.paid'), value: totals.pagado },
    { key: 'total', label: t('crmCommissions.cards.total'), value: totals.total },
  ];

  const resolveMutation = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: 'pagado' | 'pendiente' }) =>
      CommissionService.resolvePayment(id, { estado }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-commissions'] });
      push({
        title: t('crmCommissions.toasts.updateSuccess.title'),
        description: t('crmCommissions.toasts.updateSuccess.description'),
      });
    },
    onError: () => {
      push({
        title: t('crmCommissions.toasts.updateError.title'),
        description: t('crmCommissions.toasts.updateError.description'),
        variant: 'danger',
      });
    },
  });

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-content">{t('crmCommissions.title')}</h1>
          <p className="text-sm text-content-muted">{t('crmCommissions.subtitle')}</p>
        </div>
        <Select
          className="max-w-xs"
          label={t('crmCommissions.filters.status.label')}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
          options={statusOptions}
        />
      </header>

      <div className="flex flex-wrap gap-3">
        {summaryCards.map((card) => (
          <div
            key={card.key}
            className="flex basis-1/2 flex-col rounded-lg border border-border bg-surface p-4 shadow-sm sm:basis-1/2 lg:basis-1/4"
          >
            <p className="text-sm text-content-muted">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold text-content">{formatCurrency(card.value)}</p>
          </div>
        ))}
      </div>


      <Table minWidthClass="min-w-[720px]">
        <TableHeader>
          <TableRow className="text-xs uppercase tracking-wide text-content-muted">
            <TableHead>{t('crmCommissions.table.freeler')}</TableHead>
            <TableHead>{t('crmCommissions.table.campaign')}</TableHead>
            <TableHead>{t('crmCommissions.table.amount')}</TableHead>
            <TableHead>{t('crmCommissions.table.status')}</TableHead>
            <TableHead>{t('crmCommissions.table.paymentDate')}</TableHead>
            <TableHead className="text-right">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {commissions.map((commission) => (
            <TableRow key={commission.id_comision}>
              <TableCell>
                {commission?.freeler
                  ? `${commission.freeler.nombres ?? ''} ${commission.freeler.apellidos ?? ''}`.trim() ||
                    commission.freeler.email ||
                    `Freeler ${commission.freeler.id_usuario_freeler}`
                  : t('crmCommissions.table.noFreeler')}
              </TableCell>
              <TableCell>{commission.campania?.nombre ?? t('crmCommissions.table.noCampaign')}</TableCell>
              <TableCell className="font-semibold text-content">
                {formatCurrency(Number(commission.monto ?? 0))}
              </TableCell>
              <TableCell>{resolveLabel(commission.id_estado_comision)}</TableCell>
              <TableCell>{formatDate(commission.fecha_pago)}</TableCell>
              <TableCell className="text-right">
                {Number(commission.id_estado_comision) === 3 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={resolveMutation.isPending}
                    onClick={() =>
                      resolveMutation.mutate({
                        id: commission.id_comision,
                        estado: 'pendiente',
                      })
                    }
                  >
                    {t('crmCommissions.table.markPending')}
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={resolveMutation.isPending}
                    onClick={() =>
                      resolveMutation.mutate({
                        id: commission.id_comision,
                        estado: 'pagado',
                      })
                    }
                  >
                    {t('crmCommissions.table.markPaid')}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {!commissions.length && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-content-muted">
                {t('crmCommissions.table.empty')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </section>
  );
};

export default ComisionesAdmin;
