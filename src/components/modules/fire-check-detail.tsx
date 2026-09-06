'use client';

/**
 * Detailansicht einer Brandschutzkontrolle.
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
import {
  FIRE_CONDITION_OPTIONS,
  FIRE_TYPE_OPTIONS,
  FIRING_FUEL_OPTIONS,
  FIRING_SCOPE_OPTIONS,
  RCD_STATUS_OPTIONS,
} from '@/lib/schema';
import { useSettings } from '@/lib/settings/provider';
import { FireCheck } from '@/lib/types';
import { formatDate, today } from '@/lib/utils/format';

const labelOf = (
  options: { value: string; labelKey: string }[],
  value: string,
  t: ReturnType<typeof useT>,
): string => {
  const option = options.find((entry) => entry.value === value);
  return option ? t(option.labelKey as Parameters<typeof t>[0]) : value;
};

export function FireCheckDetail({ id }: { id: string }) {
  const t = useT();
  const router = useRouter();
  const { settings } = useSettings();
  const damages = useCollection('damages');
  const orders = useCollection('orders');
  const properties = useCollection('properties');
  const buildings = useCollection('buildings');

  const kindOf = (check: FireCheck): string =>
    check.type === 'custom' && check.customType
      ? check.customType
      : labelOf(FIRE_TYPE_OPTIONS, check.type, t);

  const locationText = (check: FireCheck): string =>
    [
      properties.items.find((item) => item.id === check.propertyId)?.name,
      buildings.items.find((item) => item.id === check.buildingId)?.name,
      check.area,
    ]
      .filter(Boolean)
      .join(' · ');

  /** Sicherheitsmaengel wiegen schwerer als andere Beanstandungen. */
  const priorityOf = (check: FireCheck) =>
    check.condition === 'critical' ? 'critical' : check.condition === 'defect' ? 'high' : 'medium';

  const toDamage = (
    check: FireCheck,
    update: (values: Partial<FireCheck>, action?: string) => void,
  ) => {
    if (!check.defects.trim()) {
      toast.error(t('fire.needDefects'));
      return;
    }
    const damage = damages.create({
      title: `${t('fire.reportTitle')}: ${check.title}`,
      description: [check.defects, check.measures].filter(Boolean).join('\n\n'),
      propertyId: check.propertyId,
      buildingId: check.buildingId,
      roomId: check.roomId,
      assetId: check.assetId,
      assigneeUserId: check.assigneeUserId,
      assigneeTeam: check.assigneeTeam,
      reportedBy: check.inspector,
      reportedAt: check.date || today(),
      priority: priorityOf(check),
    });
    update({ damageId: damage.id }, 'fire.damageCreated');
    toast.success(t('fire.damageCreated'));
    router.push(`/damages/${damage.id}`);
  };

  const toOrder = (
    check: FireCheck,
    update: (values: Partial<FireCheck>, action?: string) => void,
  ) => {
    if (!check.defects.trim()) {
      toast.error(t('fire.needDefects'));
      return;
    }
    const order = orders.create({
      title: `${t('fire.reportTitle')}: ${check.title}`,
      description: [check.defects, check.measures].filter(Boolean).join('\n\n'),
      propertyId: check.propertyId,
      buildingId: check.buildingId,
      roomId: check.roomId,
      assetId: check.assetId,
      supplierId: check.supplierId,
      assigneeUserId: check.assigneeUserId,
      assigneeTeam: check.assigneeTeam,
      dueDate: check.dueDate || check.nextDate,
      priority: priorityOf(check),
    });
    update({ orderId: order.id }, 'fire.orderCreated');
    toast.success(t('fire.orderCreated'));
    router.push(`/orders/${order.id}`);
  };

  const createPdf = async (check: FireCheck) => {
    const { downloadAuditPdf } = await import('@/lib/audit/audit-pdf');
    const tone =
      check.condition === 'good' ? 'green' : check.condition === 'minor' ? 'amber' : 'red';

    /** Bei der Feuerungskontrolle gehoeren Anlage, Brennstoff und Messwerte in den Bericht. */
    const firingLines =
      check.type === 'firing'
        ? [
            `${t('firing.system')}: ${check.firingSystem || '–'}`,
            `${t('firing.fuel')}: ${labelOf(FIRING_FUEL_OPTIONS, check.fuel, t)}`,
            `${t('firing.sweeper')}: ${check.sweeper || '–'}`,
            `${t('firing.scope')}: ${labelOf(FIRING_SCOPE_OPTIONS, check.firingScope, t)}`,
            `${t('firing.co')}: ${check.coValue || '–'}`,
            `${t('firing.soot')}: ${check.sootNumber || '–'}`,
            `${t('firing.exhaust')}: ${check.exhaustTemperature || '–'}`,
            `${t('firing.efficiency')}: ${check.efficiency || '–'}`,
            ...(check.measurements ? [`${t('firing.measurements')}: ${check.measurements}`] : []),
          ]
        : [];

    downloadAuditPdf(
      {
        location: locationText(check) || check.title,
        period: formatDate(check.date, settings.language),
        createdAt: formatDate(today(), settings.language),
        green: 0,
        amber: 0,
        red: 0,
        showSummary: false,
        fileBaseName: check.type === 'firing' ? 'Feuerungskontrolle' : 'Brandschutzkontrolle',
        infoLines: [
          `${t('fire.kind')}: ${kindOf(check)}`,
          ...firingLines,
          `${t('fire.area')}: ${check.area || '–'}`,
          `${t('fire.inspector')}: ${check.inspector || '–'}`,
          `${t('fire.conditionLabel')}: ${labelOf(FIRE_CONDITION_OPTIONS, check.condition, t)}`,
          `${t('fire.dueDate')}: ${check.dueDate ? formatDate(check.dueDate, settings.language) : '–'}`,
          `${t('fire.nextControl')}: ${check.nextDate ? formatDate(check.nextDate, settings.language) : '–'}`,
        ],
        notes: { title: t('common.notes'), text: check.notes },
        sections: [
          {
            title: check.type === 'firing' ? t('firing.report') : t('fire.reportTitle'),
            rows: [
              {
                tone: tone as 'green' | 'amber' | 'red',
                number: check.number,
                title: check.title,
                date: formatDate(check.date, settings.language),
                status: labelOf(RCD_STATUS_OPTIONS, check.status, t),
                detail: labelOf(FIRE_CONDITION_OPTIONS, check.condition, t),
              },
            ],
          },
          {
            title: t('fire.defects'),
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
        title: t('fire.reportTitle'),
        location: t('audit.location'),
        period: t('fire.date'),
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
      collection="firechecks"
      id={id}
      headerExtra={(check, update) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void createPdf(check)} data-testid="fire-pdf">
            <FileDown className="size-4" aria-hidden />
            {t('fire.report')}
          </Button>
          <Button variant="outline" onClick={() => toDamage(check, update)} data-testid="fire-damage">
            <TriangleAlert className="size-4" aria-hidden />
            {t('fire.toDamage')}
          </Button>
          <Button variant="outline" onClick={() => toOrder(check, update)} data-testid="fire-order">
            <Hammer className="size-4" aria-hidden />
            {t('fire.toOrder')}
          </Button>
        </div>
      )}
    />
  );
}
