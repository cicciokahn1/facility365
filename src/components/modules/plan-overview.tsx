'use client';

import Link from 'next/link';
import { Map } from 'lucide-react';
import { useMemo, useState } from 'react';

import { EmptyState } from '@/components/common/empty-state';
import { PlanManager } from '@/components/modules/plan-manager';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollection } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { Building, Property } from '@/lib/types';

type Owner = { kind: 'building'; item: Building } | { kind: 'property'; item: Property };

export function PlanOverview() {
  const t = useT();
  const buildings = useCollection('buildings');
  const properties = useCollection('properties');
  const [selectedKey, setSelectedKey] = useState('');

  const owners = useMemo<Owner[]>(
    () => [
      ...buildings.items.map((item) => ({ kind: 'building' as const, item })),
      ...properties.items.map((item) => ({ kind: 'property' as const, item })),
    ],
    [buildings.items, properties.items],
  );
  const selected = owners.find((owner) => `${owner.kind}:${owner.item.id}` === selectedKey) ?? owners[0];
  const selectedValue = selected ? `${selected.kind}:${selected.item.id}` : '';
  const plans = selected?.item.plans ?? [];
  const totalPlans = owners.reduce((sum, owner) => sum + owner.item.plans.length, 0);
  const totalMarkers = owners.reduce(
    (sum, owner) => sum + owner.item.plans.reduce((count, plan) => count + plan.markers.length, 0),
    0,
  );

  const updatePlans = (nextPlans: typeof plans) => {
    if (!selected) return;
    if (selected.kind === 'building') {
      buildings.update(selected.item.id, { plans: nextPlans });
    } else {
      properties.update(selected.item.id, { plans: nextPlans });
    }
  };

  if (owners.length === 0) {
    return <EmptyState icon={Map} titleKey="plan.empty" textKey="plan.allowed" />;
  }

  return (
    <div className="flex flex-col gap-4" data-testid="plan-overview">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('module.plans')}</h1>
        <p className="text-sm text-muted-foreground">{t('plan.overviewSubtitle')}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-semibold">{totalPlans}</p>
            <p className="text-sm text-muted-foreground">{t('plan.total')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-semibold">{buildings.items.filter((item) => item.plans.length > 0).length}</p>
            <p className="text-sm text-muted-foreground">{t('plan.buildingsWithPlans')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-semibold">{totalMarkers}</p>
            <p className="text-sm text-muted-foreground">{t('plan.markers')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">{t('plan.selectOwner')}</CardTitle>
          <Select value={selectedValue} onValueChange={setSelectedKey}>
            <SelectTrigger className="w-full sm:w-80" data-testid="plan-owner-select">
              <SelectValue placeholder={`${t('plan.building')} / ${t('plan.property')}`} />
            </SelectTrigger>
            <SelectContent>
              {owners.map((owner) => (
                <SelectItem key={`${owner.kind}:${owner.item.id}`} value={`${owner.kind}:${owner.item.id}`}>
                  {owner.kind === 'building' ? t('plan.building') : t('plan.property')} · {owner.item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {selected ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {selected.kind === 'building' ? t('plan.building') : t('plan.property')}
                </Badge>
                <span className="font-medium">{selected.item.name}</span>
                <Button asChild variant="link" size="sm" className="h-auto px-1">
                  <Link href={`/${selected.kind === 'building' ? 'buildings' : 'properties'}/${selected.item.id}`}>
                    {t('plan.openMaster')}
                  </Link>
                </Button>
              </div>
              <PlanManager
                plans={plans}
                floors={selected.kind === 'building' ? selected.item.floors : []}
                onChange={updatePlans}
              />
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
