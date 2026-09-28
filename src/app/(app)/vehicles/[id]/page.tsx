import { EntityDetail } from '@/components/module/entity-detail';
import { VehicleHistory } from '@/components/modules/vehicle-history';
import { VehicleServiceSummary } from '@/components/modules/vehicle-service-summary';
import { FleetControlPanel } from '@/components/modules/fleet-control-panel';

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <EntityDetail
      collection="vehicles"
      id={id}
      extraTabs={(vehicle) => [
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
