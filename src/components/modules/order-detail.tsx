'use client';

import { useRouter } from 'next/navigation';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';

import { ChecklistEditor } from '@/components/module/checklist-editor';
import { EntityDetail } from '@/components/module/entity-detail';
import { MaterialEditor } from '@/components/module/material-editor';
import { RelatedList } from '@/components/module/related-list';
import { WorkTimePanel } from '@/components/modules/work-time-panel';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';
import { useReportFromOrder } from '@/lib/reports/from-order';
import { hourlyRateFor } from '@/lib/reports/hourly-rate';
import { useCollectionItems } from '@/lib/data/store';
import { useSettings } from '@/lib/settings/provider';

export function OrderDetail({ id }: { id: string }) {
  const t = useT();
  const router = useRouter();
  const reports = useReportFromOrder();
  const users = useCollectionItems('users');
  const suppliers = useCollectionItems('suppliers');
  const { settings } = useSettings();

  return (
    <EntityDetail
      collection="orders"
      id={id}
      headerExtra={(order) => {
        const existing = reports.existing(order.id);
        return (
          <>
            <Button
              size="sm"
              variant={existing ? 'outline' : 'default'}
              onClick={() => {
                if (existing) {
                  router.push(`/reports/${existing.id}`);
                  return;
                }
                const report = reports.create(order);
                toast.success(t('report.created'));
                router.push(`/reports/${report.id}`);
              }}
              data-testid="order-create-report"
            >
              <FileText className="size-4" aria-hidden />
              {existing ? t('report.openExisting') : t('report.fromOrder')}
            </Button>
          </>
        );
      }}
      extraTabs={(order, update) => [
        {
          value: 'workTime',
          labelKey: 'tab.workTime',
          content: (
            <WorkTimePanel
              values={{
                workDate: order.workDate,
                workStart: order.workStart,
                workEnd: order.workEnd,
                breakMinutes: order.breakMinutes,
              }}
              onChange={(values) => {
                update({
                  ...values,
                  hourlyRate: hourlyRateFor({
                    explicit: order.hourlyRate,
                    user: users.find((user) => user.id === order.assigneeUserId),
                    supplier: suppliers.find((supplier) => supplier.id === order.supplierId),
                    settings,
                  }),
                });
                toast.success(t('toast.saved'));
              }}
            />
          ),
        },
        {
          value: 'checklist',
          labelKey: 'tab.checklist',
          content: (
            <ChecklistEditor items={order.checklist} onChange={(checklist) => update({ checklist })} />
          ),
        },
        {
          value: 'materials',
          labelKey: 'tab.material',
          content: (
            <MaterialEditor items={order.materials} onChange={(materials) => update({ materials })} />
          ),
        },
        {
          value: 'reports',
          labelKey: 'module.reports',
          content: <RelatedList collection="reports" field="orderId" value={order.id} />,
        },
      ]}
    />
  );
}
