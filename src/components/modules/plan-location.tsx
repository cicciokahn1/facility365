'use client';

/**
 * Planposition einer Anlage oder eines Raums.
 *
 * Gesucht werden die Markierungen in den Gebaeude- und Liegenschaftsplaenen;
 * der Plan oeffnet sich in derselben Ansicht wie im Gebaeude, damit es keine
 * zweite Planverwaltung gibt.
 */
import { useMemo, useState } from 'react';
import { Map } from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';
import { PlanViewer } from '@/components/modules/plan-viewer';
import { Button } from '@/components/ui/button';
import { useCollection } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { Plan } from '@/lib/types';

interface Hit {
  /** Traeger des Plans: Gebaeude oder Liegenschaft. */
  owner: 'buildings' | 'properties';
  ownerId: string;
  ownerName: string;
  plan: Plan;
}

export function PlanLocation({
  assetId = '',
  roomId = '',
  outdoorAreaId = '',
}: {
  assetId?: string;
  roomId?: string;
  outdoorAreaId?: string;
}) {
  const t = useT();
  const buildings = useCollection('buildings');
  const properties = useCollection('properties');
  const [openPlan, setOpenPlan] = useState('');

  const hits = useMemo(() => {
    const matches = (plan: Plan) =>
      plan.markers.some(
        (marker) =>
          (assetId && marker.assetId === assetId) ||
          (roomId && marker.roomId === roomId) ||
          (outdoorAreaId && marker.outdoorAreaId === outdoorAreaId),
      );
    const found: Hit[] = [];
    buildings.items.forEach((building) =>
      building.plans.filter(matches).forEach((plan) =>
        found.push({
          owner: 'buildings',
          ownerId: building.id,
          ownerName: building.name,
          plan,
        }),
      ),
    );
    properties.items.forEach((property) =>
      property.plans.filter(matches).forEach((plan) =>
        found.push({
          owner: 'properties',
          ownerId: property.id,
          ownerName: property.name,
          plan,
        }),
      ),
    );
    return found;
  }, [assetId, buildings.items, outdoorAreaId, properties.items, roomId]);

  if (hits.length === 0) return <EmptyState icon={Map} titleKey="plan.empty" />;

  /** Aenderungen am Plan laufen zurueck in das Gebaeude bzw. die Liegenschaft. */
  const savePlan = (hit: Hit, plan: Plan) => {
    if (hit.owner === 'buildings') {
      const building = buildings.get(hit.ownerId);
      if (!building) return;
      buildings.update(hit.ownerId, {
        plans: building.plans.map((entry) => (entry.id === plan.id ? plan : entry)),
      });
      return;
    }
    const property = properties.get(hit.ownerId);
    if (!property) return;
    properties.update(hit.ownerId, {
      plans: property.plans.map((entry) => (entry.id === plan.id ? plan : entry)),
    });
  };

  return (
    <ul className="divide-y rounded-xl border bg-card" data-testid="plan-location">
      {hits.map((hit) => (
        <li key={hit.plan.id} className="flex items-center gap-3 p-3">
          <Map className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-xs text-muted-foreground">{hit.ownerName}</span>
            <span className="block truncate text-sm font-medium">{hit.plan.title}</span>
          </span>
          <Button
            size="sm"
            variant="outline"
            data-testid="plan-location-open"
            onClick={() => setOpenPlan(hit.plan.id)}
          >
            {t('plan.onPlan')}
          </Button>
          <PlanViewer
            plan={hit.plan}
            open={openPlan === hit.plan.id}
            onOpenChange={(value) => setOpenPlan(value ? hit.plan.id : '')}
            onChange={(plan) => savePlan(hit, plan)}
          />
        </li>
      ))}
    </ul>
  );
}
