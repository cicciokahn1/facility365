'use client';

/**
 * Auswertung der Photovoltaikanlagen.
 *
 * Zeigt Monats- und Jahreswerte der erfassten Solarertraege: Produktion,
 * Eigenverbrauch, Einspeisung, Erloese, CO2-Einsparung und den Vergleich mit
 * dem im Energie-Modul erfassten Stromverbrauch. Es werden ausschliesslich
 * erfasste Werte gerechnet; ohne Daten bleiben die Bereiche leer.
 */
import { useCallback, useMemo, useState } from 'react';

import { BarChart } from '@/components/common/bar-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';
import { EnergyEntry, SolarPlant, SolarYield } from '@/lib/types';
import { formatMoney, formatMonth, formatNumber } from '@/lib/utils/format';

const ALL = 'all';

/** Standardwert der CO2-Einsparung je Kilowattstunde in Gramm. */
const DEFAULT_CO2_FACTOR = 128;

const sum = (values: (number | undefined)[]): number =>
  values.reduce((total: number, value) => total + (typeof value === 'number' ? value : 0), 0);

const percent = (part: number, total: number): string =>
  total > 0 ? `${Math.round((part / total) * 100)}%` : '–';

export function SolarOverview() {
  const t = useT();
  const { settings } = useSettings();
  const plants = useCollectionItems('solarplants');
  const yields = useCollectionItems('solaryields');
  const energy = useCollectionItems('energy');

  const years = useMemo(
    () =>
      [...new Set(yields.map((entry) => entry.month.slice(0, 4)).filter(Boolean))].sort((a, b) =>
        b.localeCompare(a),
      ),
    [yields],
  );
  const [year, setYear] = useState(years[0] ?? String(new Date().getFullYear()));
  const [plant, setPlant] = useState(ALL);

  const activeYear = years.includes(year) ? year : (years[0] ?? year);
  const plantIds = useMemo(() => new Set(plants.map((item) => item.id)), [plants]);

  const scopedPlants = useMemo(
    () => (plant === ALL ? plants : plants.filter((item) => item.id === plant)),
    [plant, plants],
  );

  const scoped = useMemo(
    () =>
      yields.filter(
        (entry) =>
          entry.month.startsWith(activeYear) &&
          (plant === ALL ? plantIds.has(entry.plantId) || !entry.plantId : entry.plantId === plant),
      ),
    [activeYear, plant, plantIds, yields],
  );

  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => `${activeYear}-${String(index + 1).padStart(2, '0')}`),
    [activeYear],
  );
  const monthLabels = useMemo(
    () => months.map((month) => formatMonth(month, settings.language).slice(0, 3)),
    [months, settings.language],
  );

  const ofMonth = useCallback(
    (month: string): SolarYield[] => scoped.filter((entry) => entry.month === month),
    [scoped],
  );

  /** Stromverbrauch der Liegenschaften/Gebaeude der gewaehlten Anlagen. */
  const electricity = useMemo(() => {
    const properties = new Set(scopedPlants.map((item) => item.propertyId).filter(Boolean));
    const buildings = new Set(scopedPlants.map((item) => item.buildingId).filter(Boolean));
    const relevant = (entry: EnergyEntry): boolean => {
      if (entry.type !== 'electricity') return false;
      if (!entry.unit.trim().toLowerCase().startsWith('kwh')) return false;
      if (plant === ALL && properties.size === 0 && buildings.size === 0) return true;
      if (buildings.size > 0 && entry.buildingId && buildings.has(entry.buildingId)) return true;
      if (properties.size > 0 && entry.propertyId && properties.has(entry.propertyId)) return true;
      return false;
    };
    const perMonth = months.map((month) =>
      sum(
        energy
          .filter((entry) => relevant(entry) && entry.month === month)
          .map((entry) => entry.consumption),
      ),
    );
    return { perMonth, total: sum(perMonth) };
  }, [energy, months, plant, scopedPlants]);

  const totals = useMemo(() => {
    const production = sum(scoped.map((entry) => entry.production));
    const selfUse = sum(scoped.map((entry) => entry.selfUse));
    const feedIn = sum(scoped.map((entry) => entry.feedIn));
    const batteryUse = sum(scoped.map((entry) => entry.batteryUse));
    const revenue = sum(scoped.map((entry) => entry.revenue));
    const savings = sum(scoped.map((entry) => entry.savings));
    const cost = sum(scoped.map((entry) => entry.cost));
    const power = sum(scopedPlants.map((item) => item.power));
    const factor = (item: SolarPlant): number =>
      typeof item.co2Factor === 'number' ? item.co2Factor : DEFAULT_CO2_FACTOR;
    /** CO2 je Anlage mit deren eigenem Faktor; ohne Anlage gilt der Standard. */
    const co2 = scoped.reduce((total, entry) => {
      const own = plants.find((item) => item.id === entry.plantId);
      const grams = (entry.production ?? 0) * (own ? factor(own) : DEFAULT_CO2_FACTOR);
      return total + grams / 1000;
    }, 0);
    return {
      production,
      selfUse,
      feedIn,
      batteryUse,
      revenue,
      savings,
      cost,
      power,
      co2,
      result: revenue + savings - cost,
    };
  }, [plants, scoped, scopedPlants]);

  const chart = useMemo(
    () => ({
      production: months.map((month) => sum(ofMonth(month).map((entry) => entry.production))),
      selfUse: months.map((month) => sum(ofMonth(month).map((entry) => entry.selfUse))),
      feedIn: months.map((month) => sum(ofMonth(month).map((entry) => entry.feedIn))),
    }),
    [months, ofMonth],
  );

  const usedMonths = useMemo(
    () => months.filter((month) => ofMonth(month).length > 0),
    [months, ofMonth],
  );

  const kwh = useCallback(
    (value: number) => `${formatNumber(Math.round(value), settings.language)} kWh`,
    [settings.language],
  );

  return (
    <Card data-testid="solar-overview">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base">{t('solar.overview')}</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Select value={activeYear} onValueChange={setYear}>
            <SelectTrigger className="w-[120px]" data-testid="solar-year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(years.length > 0 ? years : [activeYear]).map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={plant} onValueChange={setPlant}>
            <SelectTrigger className="w-[200px]" data-testid="solar-plant">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('solar.allPlants')}</SelectItem>
              {plants.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name || item.number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {plants.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('solar.noPlants')}</p>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="solar-kpis">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">{t('solar.installedPower')}</p>
            <p className="text-lg font-semibold" data-testid="solar-power">
              {formatNumber(totals.power, settings.language)} kWp
            </p>
            <p className="text-sm text-muted-foreground">
              {t('solar.specificYield')}:{' '}
              {totals.power > 0
                ? `${formatNumber(Math.round(totals.production / totals.power), settings.language)} kWh/kWp`
                : '–'}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">{t('solar.totalProduction')}</p>
            <p className="text-lg font-semibold" data-testid="solar-production">
              {kwh(totals.production)}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('solar.feedIn')}: {kwh(totals.feedIn)}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">{t('solar.selfUseRate')}</p>
            <p className="text-lg font-semibold" data-testid="solar-self-use-rate">
              {percent(totals.selfUse, totals.production)}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('solar.selfUse')}: {kwh(totals.selfUse)}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">{t('solar.result')}</p>
            <p className="text-lg font-semibold" data-testid="solar-result">
              {formatMoney(totals.result, settings.currency)}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('solar.co2Saved')}: {formatNumber(Math.round(totals.co2), settings.language)} kg
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-3" data-testid="solar-charts">
          <h3 className="text-sm font-semibold">{t('solar.monthlyChart')}</h3>
          {scoped.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('solar.noData')}</p>
          ) : (
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">{t('solar.monthlyChart')}</p>
                <BarChart
                  testId="solar-month-chart"
                  categories={monthLabels}
                  series={[
                    {
                      key: 'production',
                      label: t('solar.production'),
                      color: 'bg-primary',
                      values: chart.production,
                    },
                    {
                      key: 'selfUse',
                      label: t('solar.selfUse'),
                      color: 'bg-emerald-500',
                      values: chart.selfUse,
                    },
                    {
                      key: 'feedIn',
                      label: t('solar.feedIn'),
                      color: 'bg-muted-foreground/40',
                      values: chart.feedIn,
                    },
                  ]}
                  formatValue={(value) => kwh(value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">{t('solar.comparisonChart')}</p>
                <BarChart
                  testId="solar-comparison-chart"
                  categories={monthLabels}
                  series={[
                    {
                      key: 'production',
                      label: t('solar.production'),
                      color: 'bg-primary',
                      values: chart.production,
                    },
                    {
                      key: 'electricity',
                      label: t('solar.electricityUse'),
                      color: 'bg-muted-foreground/40',
                      values: electricity.perMonth,
                    },
                  ]}
                  formatValue={(value) => kwh(value)}
                />
                <p className="text-xs text-muted-foreground" data-testid="solar-coverage">
                  {t('solar.coverage')}: {percent(totals.selfUse, electricity.total)} ·{' '}
                  {t('solar.electricityUse')}: {kwh(electricity.total)}
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-2" data-testid="solar-months">
          <h3 className="text-sm font-semibold">{t('energy.monthSummary')}</h3>
          {usedMonths.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('solar.noData')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">{t('energy.month')}</th>
                    <th className="py-2 pr-3 text-right font-medium">{t('solar.production')}</th>
                    <th className="py-2 pr-3 text-right font-medium">{t('solar.selfUse')}</th>
                    <th className="py-2 pr-3 text-right font-medium">{t('solar.feedIn')}</th>
                    <th className="py-2 pr-3 text-right font-medium">{t('solar.selfUseRate')}</th>
                    <th className="py-2 pr-3 text-right font-medium">{t('solar.revenue')}</th>
                    <th className="py-2 text-right font-medium">{t('solar.savings')}</th>
                  </tr>
                </thead>
                <tbody>
                  {usedMonths.map((month) => {
                    const rows = ofMonth(month);
                    const production = sum(rows.map((entry) => entry.production));
                    return (
                      <tr key={month} className="border-b last:border-0" data-testid="solar-month-row">
                        <td className="py-2 pr-3 whitespace-nowrap">
                          {formatMonth(month, settings.language)}
                        </td>
                        <td className="py-2 pr-3 text-right whitespace-nowrap">{kwh(production)}</td>
                        <td className="py-2 pr-3 text-right whitespace-nowrap">
                          {kwh(sum(rows.map((entry) => entry.selfUse)))}
                        </td>
                        <td className="py-2 pr-3 text-right whitespace-nowrap">
                          {kwh(sum(rows.map((entry) => entry.feedIn)))}
                        </td>
                        <td className="py-2 pr-3 text-right whitespace-nowrap">
                          {percent(sum(rows.map((entry) => entry.selfUse)), production)}
                        </td>
                        <td className="py-2 pr-3 text-right whitespace-nowrap">
                          {formatMoney(sum(rows.map((entry) => entry.revenue)), settings.currency)}
                        </td>
                        <td className="py-2 text-right whitespace-nowrap">
                          {formatMoney(sum(rows.map((entry) => entry.savings)), settings.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {plants.length > 0 ? (
          <section className="flex flex-col gap-2" data-testid="solar-plant-table">
            <h3 className="text-sm font-semibold">{t('solar.plantTable')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">{t('solar.plant')}</th>
                    <th className="py-2 pr-3 text-right font-medium">{t('solar.power')}</th>
                    <th className="py-2 pr-3 text-right font-medium">{t('solar.production')}</th>
                    <th className="py-2 pr-3 text-right font-medium">{t('solar.selfUseRate')}</th>
                    <th className="py-2 pr-3 text-right font-medium">{t('solar.batteryCapacity')}</th>
                    <th className="py-2 text-right font-medium">{t('solar.result')}</th>
                  </tr>
                </thead>
                <tbody>
                  {plants.map((item) => {
                    const rows = yields.filter(
                      (entry) => entry.plantId === item.id && entry.month.startsWith(activeYear),
                    );
                    const production = sum(rows.map((entry) => entry.production));
                    const result =
                      sum(rows.map((entry) => entry.revenue)) +
                      sum(rows.map((entry) => entry.savings)) -
                      sum(rows.map((entry) => entry.cost));
                    return (
                      <tr key={item.id} className="border-b last:border-0" data-testid="solar-plant-row">
                        <td className="py-2 pr-3 whitespace-nowrap">{item.name || item.number}</td>
                        <td className="py-2 pr-3 text-right whitespace-nowrap">
                          {typeof item.power === 'number'
                            ? `${formatNumber(item.power, settings.language)} kWp`
                            : '–'}
                        </td>
                        <td className="py-2 pr-3 text-right whitespace-nowrap">{kwh(production)}</td>
                        <td className="py-2 pr-3 text-right whitespace-nowrap">
                          {percent(sum(rows.map((entry) => entry.selfUse)), production)}
                        </td>
                        <td className="py-2 pr-3 text-right whitespace-nowrap">
                          {typeof item.batteryCapacity === 'number' && item.batteryCapacity > 0
                            ? `${formatNumber(item.batteryCapacity, settings.language)} kWh`
                            : '–'}
                        </td>
                        <td className="py-2 text-right whitespace-nowrap">
                          {formatMoney(result, settings.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}
