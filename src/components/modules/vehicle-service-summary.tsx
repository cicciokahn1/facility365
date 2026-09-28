"use client";

import { CalendarClock, CircleDollarSign, Gauge, Wrench } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/lib/i18n/provider";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { Vehicle } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/utils/format";
import { useSettings } from "@/lib/settings/provider";
import { calculatedNextService, serviceHoursDue } from "@/lib/fleet/maintenance";

export function VehicleServiceSummary({ vehicle }: { vehicle: Vehicle }) {
  const t = useT();
  const { settings } = useSettings();
  const serviceKey = `vehicle.service.${vehicle.serviceType}` as TranslationKey;
  const nextService = calculatedNextService(vehicle);
  const dates = [
    ["vehicle.lastService", vehicle.lastService],
    ["vehicle.nextService", nextService],
    ["vehicle.tireChange", vehicle.tireChange],
    ["vehicle.nextInspection", vehicle.nextInspection],
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="size-4 text-primary" aria-hidden />
            {t("tab.service")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <InfoRow label={t("vehicle.serviceType")} value={t(serviceKey)} />
          <InfoRow label={t("vehicle.serviceProvider")} value={vehicle.serviceProvider || "–"} />
          <InfoRow
            label={t("vehicle.serviceCost")}
            value={vehicle.serviceCost ? formatMoney(vehicle.serviceCost, "CHF") : "–"}
            icon={<CircleDollarSign className="size-4" aria-hidden />}
          />
          <InfoRow
            label={t("vehicle.mileage")}
            value={vehicle.mileage ? `${vehicle.mileage.toLocaleString(settings.language)} km` : "–"}
            icon={<Gauge className="size-4" aria-hidden />}
          />
          <InfoRow
            label={t("vehicle.operatingHours")}
            value={vehicle.operatingHours ? `${vehicle.operatingHours} h` : "–"}
          />
          <InfoRow
            label={t("fleet.serviceHoursDue")}
            value={serviceHoursDue(vehicle) ? t("fleet.due") : t("fleet.notDue")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="size-4 text-primary" aria-hidden />
            {t("common.date")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {dates.map(([labelKey, value]) => (
            <InfoRow
              key={labelKey}
              label={t(labelKey as TranslationKey)}
              value={value ? formatDate(value, settings.language) : "–"}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b pb-2 last:border-0 last:pb-0">
      <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
