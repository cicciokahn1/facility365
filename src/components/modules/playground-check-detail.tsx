'use client';

/**
 * Detailansicht einer Spielplatzkontrolle.
 *
 * Zusaetzlich zu den Stammdaten: Kontrollbericht als PDF sowie die Uebernahme
 * der festgestellten Maengel in einen bestehenden Schaden oder Auftrag. Fotos,
 * Dokumente und Historie kommen aus der allgemeinen Detailansicht.
 */
import { useRouter } from 'next/navigation';
import { FileDown, Hammer, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';

import { EntityDetail } from '@/components/module/entity-detail';
import { Button } from '@/components/ui/button';
import { useCollection } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { logoOf } from '@/lib/branding/logo';
import { PLAYGROUND_CONDITION_OPTIONS, PLAYGROUND_TYPE_OPTIONS, RCD_STATUS_OPTIONS } from '@/lib/schema';
import { useSettings } from '@/lib/settings/provider';
import { PlaygroundCheck } from '@/lib/types';
import { formatDate, today } from '@/lib/utils/format';

const labelOf = (
  options: { value: string; labelKey: string }[],
  value: string,
  t: ReturnType<typeof useT>,
): string => {
  const option = options.find((entry) => entry.value === value);
  return option ? t(option.labelKey as Parameters<typeof t>[0]) : value;
};

export function PlaygroundCheckDetail({ id }: { id: string }) {
  const t = useT();
  const router = useRouter();
  const { settings } = useSettings();
  const damages = useCollection('damages');
  const orders = useCollection('orders');
  const properties = useCollection('properties');
  const buildings = useCollection('buildings');

  const locationText = (check: PlaygroundCheck): string =>
    [
      properties.items.find((item) => item.id === check.propertyId)?.name,
      buildings.items.find((item) => item.id === check.buildingId)?.name,
      check.location,
    ]
      .filter(Boolean)
      .join(' · ');

  const toDamage = (
    check: PlaygroundCheck,
    update: (values: Partial<PlaygroundCheck>, action?: string) => void,
  ) => {
    if (!check.defects.trim()) {
      toast.error(t('playground.needDefects'));
      return;
    }
    const damage = damages.create({
      title: `${t('playground.reportTitle')}: ${check.title}`,
      description: [check.defects, check.measures].filter(Boolean).join('\n\n'),
      propertyId: check.propertyId,
      buildingId: check.buildingId,
      assigneeUserId: check.assigneeUserId,
      assigneeTeam: check.assigneeTeam,
      reportedBy: check.inspector,
      reportedAt: check.date || today(),
      priority: check.condition === 'closed' || check.condition === 'defect' ? 'high' : 'medium',
    });
    update({ damageId: damage.id }, 'playground.damageCreated');
    toast.success(t('playground.damageCreated'));
    router.push(`/damages/${damage.id}`);
  };

  const toOrder = (
    check: PlaygroundCheck,
    update: (values: Partial<PlaygroundCheck>, action?: string) => void,
  ) => {
    if (!check.defects.trim()) {
      toast.error(t('playground.needDefects'));
      return;
    }
    const order = orders.create({
      title: `${t('playground.reportTitle')}: ${check.title}`,
      description: [check.defects, check.measures].filter(Boolean).join('\n\n'),
      propertyId: check.propertyId,
      buildingId: check.buildingId,
      supplierId: check.supplierId,
      assigneeUserId: check.assigneeUserId,
      assigneeTeam: check.assigneeTeam,
      dueDate: check.nextDate,
      priority: check.condition === 'closed' || check.condition === 'defect' ? 'high' : 'medium',
    });
    update({ orderId: order.id }, 'playground.orderCreated');
    toast.success(t('playground.orderCreated'));
    router.push(`/orders/${order.id}`);
  };

  const createPdf = async (check: PlaygroundCheck) => {
    const { downloadAuditPdf } = await import('@/lib/audit/audit-pdf');
    const tone =
      check.condition === 'good' ? 'green' : check.condition === 'minor' ? 'amber' : 'red';

    downloadAuditPdf(
      {
        location: locationText(check) || check.title,
        period: formatDate(check.date, settings.language),
        createdAt: formatDate(today(), settings.language),
        green: 0,
        amber: 0,
        red: 0,
        showSummary: false,
        fileBaseName: 'Spielplatzkontrolle',
        infoLines: [
          `${t('playground.name')}: ${check.title}`,
          `${t('playground.kind')}: ${labelOf(PLAYGROUND_TYPE_OPTIONS, check.type, t)}`,
          `${t('playground.inspector')}: ${check.inspector || '–'}`,
          `${t('playground.conditionLabel')}: ${labelOf(PLAYGROUND_CONDITION_OPTIONS, check.condition, t)}`,
          `${t('playground.nextControl')}: ${check.nextDate ? formatDate(check.nextDate, settings.language) : '–'}`,
        ],
        notes: { title: t('common.notes'), text: check.notes },
        sections: [
          {
            title: t('playground.reportTitle'),
            rows: [
              {
                tone: tone as 'green' | 'amber' | 'red',
                number: check.number,
                title: check.title,
                date: formatDate(check.date, settings.language),
                status: labelOf(RCD_STATUS_OPTIONS, check.status, t),
                detail: labelOf(PLAYGROUND_CONDITION_OPTIONS, check.condition, t),
              },
            ],
          },
          {
            title: t('playground.defects'),
            rows: check.defects
              ? check.defects
                  .split('\n')
                  .filter((line) => line.trim())
                  .map((line) => ({
                    tone: 'red' as const,
                    number: '',
                    title: line.trim(),
                    date: '',
                    status: '',
                    detail: '',
                  }))
              : [],
          },
          {
            title: t('legionella.measures'),
            rows: check.measures
              ? check.measures
                  .split('\n')
                  .filter((line) => line.trim())
                  .map((line) => ({
                    tone: 'green' as const,
                    number: '',
                    title: line.trim(),
                    date: '',
                    status: '',
                    detail: '',
                  }))
              : [],
          },
        ],
      },
      {
        title: t('playground.reportTitle'),
        location: t('audit.location'),
        period: t('playground.date'),
        createdAt: t('common.date'),
        summary: t('audit.summary'),
        green: t('audit.green'),
        amber: t('audit.amber'),
        red: t('audit.red'),
        number: t('common.number'),
        subject: t('common.title'),
        date: t('common.date'),
        status: t('common.status'),
        empty: t('audit.sectionEmpty'),
      },
      {
        companyName: settings.companyName || 'Facility365',
        companyAddress: [
          settings.companyAddress.street,
          [settings.companyAddress.zip, settings.companyAddress.city].filter(Boolean).join(' '),
        ]
          .filter(Boolean)
          .join(', '),
        companyContact: [settings.companyPhone, settings.companyEmail].filter(Boolean).join(' · '),
        logo: logoOf(settings.companyLogo),
      },
    );
  };

  return (
    <EntityDetail
      collection="playgroundchecks"
      id={id}
      headerExtra={(check, update) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void createPdf(check)} data-testid="playground-pdf">
            <FileDown className="size-4" aria-hidden />
            {t('playground.report')}
          </Button>
          <Button variant="outline" onClick={() => toDamage(check, update)} data-testid="playground-damage">
            <TriangleAlert className="size-4" aria-hidden />
            {t('playground.toDamage')}
          </Button>
          <Button variant="outline" onClick={() => toOrder(check, update)} data-testid="playground-order">
            <Hammer className="size-4" aria-hidden />
            {t('playground.toOrder')}
          </Button>
        </div>
      )}
    />
  );
}
