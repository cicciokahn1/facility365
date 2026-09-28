'use client';

import { RelatedList } from '@/components/module/related-list';
import { useT } from '@/lib/i18n/provider';

export function ToolHistory({ toolId }: { toolId: string }) {
  const t = useT();
  const sections = [
    ['module.maintenances.singular', 'maintenances'],
    ['module.orders.singular', 'orders'],
    ['module.damages.singular', 'damages'],
    ['module.reports.singular', 'reports'],
  ] as const;

  return (
    <div className="grid gap-4">
      {sections.map(([labelKey, collection]) => (
        <section key={collection}>
          <h2 className="mb-2 text-sm font-semibold">{t(labelKey)}</h2>
          <RelatedList collection={collection} field="toolId" value={toolId} />
        </section>
      ))}
    </div>
  );
}
