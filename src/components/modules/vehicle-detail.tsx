'use client';

import { EntityDetail } from '@/components/module/entity-detail';
import { FleetControlPanel } from '@/components/modules/fleet-control-panel';
import { VehicleHistory } from '@/components/modules/vehicle-history';
import { VehicleServiceSummary } from '@/components/modules/vehicle-service-summary';

export function VehicleDetail({ id }: { id: string }) {
  return (
    <EntityDetail
      collection="vehicles"
      id={id}
      extraTabs={(vehicle, update) => [
        {
          value: 'service',
          labelKey: 'tab.service',
          content: <VehicleServiceSummary vehicle={vehicle} />,
        },
        {
          value: 'history',
          labelKey: 'tab.history',
          content: <VehicleHistory vehicleId={vehicle.id} />,
        },
        {
          value: 'controls',
          labelKey: 'fleet.controls',
          content: <FleetControlPanel entity={vehicle} onChange={update} />,
        },
      ]}
    />
  );
}
