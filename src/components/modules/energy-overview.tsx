'use client';

/**
 * Monats- und Jahresuebersicht der Energiedaten.
 *
 * Zeigt ausschliesslich erfasste Werte; Verbraeuche werden je Einheit getrennt
 * summiert, damit kWh und m3 nie vermischt werden. "Sonstiges" erscheint unter
 * der eigenen Bezeichnung des Eintrags.
 */
import { useCallback, useMemo, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollectionItems } from '@/lib/data/store';
import { Language } from '@/lib/i18n/dictionary';
import { useT } from '@/lib/i18n/provider';
import { ENERGY_TYPE_OPTIONS } from '@/lib/schema';
import { useSettings } from '@/lib/settings/provider';
import { EnergyEntry } from '@/lib/types';
import { formatMoney, formatMonth, formatNumber } from '@/lib/utils/format';

const ALL = 'all';

/** Verbrauchssumme je Einheit, z. B. "1'250 kWh · 40 m3". */
const consumptionText = (entries: EnergyEntry[], language: Language): string => {
  const perUnit = new Map<string, number>();
  entries.forEach((entry) => {
    if (typeof entry.consumption !== 'number') return;
    const unit = entry.unit.trim();
    perUnit.set(unit, (perUnit.get(unit) ?? 0) + entry.consumption);
  });
  if (perUnit.size === 0) return '';
  return [...perUnit.entries()]
    .map(([unit, sum]) => `${formatNumber(sum, language)}${unit ? ` ${unit}` : ''}`)
    .join(' · ');
};

const costSum = (entries: EnergyEntry[]): number =>
  entries.reduce((total, entry) => total + (typeof entry.cost === 'number' ? entry.cost : 0), 0);

/** Kostenvergleich zum Vorjahr: Betrag und Anteil, mit Vorzeichen. */
function DifferenceCell({ current, previous }: { current: number; previous: number }) {
  const t = useT();
  const { settings } = useSettings();
  if (previous === 0) {
    return <span className="text-muted-foreground">{current === 0 ? '–' : t('energy.noPreviousYear')}</span>;
  }

  const diff = current - previous;
  const percent = Math.round((diff / previous) * 100);
  const sign = diff > 0 ? '+' : '';
  const tone = diff > 0 ? 'text-destructive' : diff < 0 ? 'text-emerald-600' : 'text-muted-foreground';
  return (
    <span className={tone} data-testid="energy-cost-diff">
      {sign}
      {formatMoney(diff, settings.currency)} ({sign}
      {percent}%)
    </span>
  );
}

export function EnergyOverview() {
  const t = useT();
  const { settings } = useSettings();
  const entries = useCollectionItems('energy');
  const properties = useCollectionItems('properties');
  const buildings = useCollectionItems('buildings');

  const years = useMemo(
    () =>
      [...new Set(entries.map((entry) => entry.month.slice(0, 4)).filter(Boolean))].sort((a, b) =>
        b.localeCompare(a),
      ),
    [entries],
  );
  const [year, setYear] = useState(years[0] ?? String(new Date().getFullYear()));
  const [property, setProperty] = useState(ALL);
  const [building, setBuilding] = useState(ALL);

  const activeYear = years.includes(year) ? year : (years[0] ?? year);
  /** Dieselbe Auswahl im Vorjahr; Grundlage des Kostenvergleichs. */
  const prevYear = String(Number(activeYear) - 1);

  const inScope = useCallback(
    (entry: EnergyEntry, forYear: string): boolean => {
      if (!entry.month.startsWith(forYear)) return false;
      if (property !== ALL && entry.propertyId !== property) return false;
      if (building !== ALL && entry.buildingId !== building) return false;
      return true;
    },
    [building, property],
  );

  const scoped = useMemo(
    () => entries.filter((entry) => inScope(entry, activeYear)),
    [activeYear, entries, inScope],
  );
  const scopedPrevious = useMemo(
    () => entries.filter((entry) => inScope(entry, prevYear)),
    [entries, inScope, prevYear],
  );

  /** Bezeichnung eines Eintrags; "Sonstiges" nutzt die freie Eingabe. */
  const labelOf = useCallback(
    (entry: EnergyEntry): string => {
      if (entry.type === 'other' && entry.typeOther.trim()) return entry.typeOther.trim();
      const option = ENERGY_TYPE_OPTIONS.find((item) => item.value === entry.type);
      return option ? t(option.labelKey) : entry.type;
    },
    [t],
  );

  /**
   * Einteilung der Eintraege nach Art und Monat.
   *
   * Ohne sie durchsucht jede Tabellenzelle alle Eintraege des Jahres erneut.
   */
  const grouped = useMemo(() => {
    const byLabel = new Map<string, EnergyEntry[]>();
    const byMonth = new Map<string, EnergyEntry[]>();
    const byLabelMonth = new Map<string, Map<string, EnergyEntry[]>>();
    scoped.forEach((entry) => {
      const label = labelOf(entry);
      const forLabel = byLabel.get(label) ?? [];
      forLabel.push(entry);
      byLabel.set(label, forLabel);
      const forMonth = byMonth.get(entry.month) ?? [];
      forMonth.push(entry);
      byMonth.set(entry.month, forMonth);
      const months = byLabelMonth.get(label) ?? new Map<string, EnergyEntry[]>();
      const cell = months.get(entry.month) ?? [];
      cell.push(entry);
      months.set(entry.month, cell);
      byLabelMonth.set(label, months);
    });
    return { byLabel, byMonth, byLabelMonth };
  }, [labelOf, scoped]);

  const previousByLabel = useMemo(() => {
    const map = new Map<string, EnergyEntry[]>();
    scopedPrevious.forEach((entry) => {
      const label = labelOf(entry);
      const list = map.get(label) ?? [];
      list.push(entry);
      map.set(label, list);
    });
    return map;
  }, [labelOf, scopedPrevious]);

  /** Nur die Arten anzeigen, zu denen es Werte gibt. */
  const series = useMemo(
    () => [...grouped.byLabel.keys()].sort((a, b) => a.localeCompare(b)),
    [grouped],
  );
  const months = useMemo(
    () =>
      Array.from(
        { length: 12 },
        (_, index) => `${activeYear}-${String(index + 1).padStart(2, '0')}`,
      ),
    [activeYear],
  );
  const usedMonths = useMemo(
    () => months.filter((month) => grouped.byMonth.has(month)),
    [grouped, months],
  );
  const buildingChoices = useMemo(
    () => buildings.filter((item) => property === ALL || item.propertyId === property),
    [buildings, property],
  );

  /** Arten mit Kosten in einem der beiden Jahre. */
  const costSeries = useMemo(
    () =>
      [...new Set([...grouped.byLabel.keys(), ...previousByLabel.keys()])].sort((a, b) =>
        a.localeCompare(b),
      ),
    [grouped, previousByLabel],
  );

  const yearCost = useMemo(() => costSum(scoped), [scoped]);
  const previousYearCost = useMemo(() => costSum(scopedPrevious), [scopedPrevious]);

  return (
    <Card data-testid="energy-overview">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base">{t('energy.overview')}</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Select value={activeYear} onValueChange={setYear}>
            <SelectTrigger className="w-[120px]" data-testid="energy-year">
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
          <Select
            value={property}
            onValueChange={(value) => {
              setProperty(value);
              setBuilding(ALL);
            }}
          >
            <SelectTrigger className="w-[180px]" data-testid="energy-property">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('energy.allProperties')}</SelectItem>
              {properties.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name || item.number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={building} onValueChange={setBuilding}>
            <SelectTrigger className="w-[180px]" data-testid="energy-building">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('energy.allBuildings')}</SelectItem>
              {buildingChoices.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name || item.number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">{t('energy.yearSummary')}</h3>
          {series.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('energy.noData')}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {series.map((label) => {
                const ofType = grouped.byLabel.get(label) ?? [];
                return (
                  <div key={label} className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-lg font-semibold">
                      {consumptionText(ofType, settings.language) || '–'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatMoney(costSum(ofType), settings.currency)}
                    </p>
                  </div>
                );
              })}
              <div className="rounded-lg border bg-muted/40 p-3" data-testid="energy-year-total">
                <p className="text-xs text-muted-foreground">{t('energy.totalCost')}</p>
                <p className="text-lg font-semibold">
                  {formatMoney(yearCost, settings.currency)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('energy.entries')}: {scoped.length}
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">{t('energy.costOverview')}</h3>
          {costSeries.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('energy.noData')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm" data-testid="energy-costs">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">{t('energy.type')}</th>
                    {months.map((month) => (
                      <th key={month} className="py-2 pr-3 text-right font-medium whitespace-nowrap">
                        {formatMonth(month, settings.language).slice(0, 3)}
                      </th>
                    ))}
                    <th className="py-2 pr-3 text-right font-medium">{t('energy.yearCost')}</th>
                    <th className="py-2 pr-3 text-right font-medium">{prevYear}</th>
                    <th className="py-2 text-right font-medium">{t('energy.difference')}</th>
                  </tr>
                </thead>
                <tbody>
                  {costSeries.map((label) => {
                    const current = costSum(grouped.byLabel.get(label) ?? []);
                    const previous = costSum(previousByLabel.get(label) ?? []);
                    const perMonth = grouped.byLabelMonth.get(label);
                    return (
                      <tr key={label} className="border-b last:border-0" data-testid="energy-cost-row">
                        <td className="py-2 pr-3 whitespace-nowrap">{label}</td>
                        {months.map((month) => (
                          <td key={month} className="py-2 pr-3 text-right whitespace-nowrap">
                            {formatMoney(
                              costSum(perMonth?.get(month) ?? []),
                              settings.currency,
                            )}
                          </td>
                        ))}
                        <td className="py-2 pr-3 text-right font-medium whitespace-nowrap">
                          {formatMoney(current, settings.currency)}
                        </td>
                        <td className="py-2 pr-3 text-right whitespace-nowrap text-muted-foreground">
                          {formatMoney(previous, settings.currency)}
                        </td>
                        <td className="py-2 text-right whitespace-nowrap">
                          <DifferenceCell current={current} previous={previous} />
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-muted/40 font-medium" data-testid="energy-cost-total">
                    <td className="py-2 pr-3">{t('energy.totalCost')}</td>
                    {months.map((month) => (
                      <td key={month} className="py-2 pr-3 text-right whitespace-nowrap">
                        {formatMoney(costSum(grouped.byMonth.get(month) ?? []), settings.currency)}
                      </td>
                    ))}
                    <td className="py-2 pr-3 text-right whitespace-nowrap">
                      {formatMoney(yearCost, settings.currency)}
                    </td>
                    <td className="py-2 pr-3 text-right whitespace-nowrap text-muted-foreground">
                      {formatMoney(previousYearCost, settings.currency)}
                    </td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <DifferenceCell current={yearCost} previous={previousYearCost} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">{t('energy.monthSummary')}</h3>
          {usedMonths.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('energy.noData')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm" data-testid="energy-months">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">{t('energy.month')}</th>
                    {series.map((label) => (
                      <th key={label} className="py-2 pr-3 font-medium">
                        {label}
                      </th>
                    ))}
                    <th className="py-2 font-medium">{t('energy.cost')}</th>
                  </tr>
                </thead>
                <tbody>
                  {usedMonths.map((month) => {
                    const ofMonth = grouped.byMonth.get(month) ?? [];
                    return (
                      <tr key={month} className="border-b last:border-0">
                        <td className="py-2 pr-3 whitespace-nowrap">
                          {formatMonth(month, settings.language)}
                        </td>
                        {series.map((label) => (
                          <td key={label} className="py-2 pr-3">
                            {consumptionText(
                              grouped.byLabelMonth.get(label)?.get(month) ?? [],
                              settings.language,
                            ) || '–'}
                          </td>
                        ))}
                        <td className="py-2 whitespace-nowrap">
                          {formatMoney(costSum(ofMonth), settings.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
