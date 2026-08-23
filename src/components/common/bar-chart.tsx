'use client';

/**
 * Schlankes Balkendiagramm ohne zusaetzliche Abhaengigkeit.
 *
 * Je Kategorie steht eine Gruppe von Balken; die Hoehe richtet sich nach dem
 * groessten Wert des Diagramms. Werte von 0 bleiben als leere Spur sichtbar.
 */

export interface BarSeries {
  key: string;
  label: string;
  /** Farbklasse des Balkens, z. B. "bg-primary". */
  color: string;
  values: number[];
}

export function BarChart({
  categories,
  series,
  formatValue,
  testId,
}: {
  categories: string[];
  series: BarSeries[];
  formatValue: (value: number) => string;
  testId?: string;
}) {
  const max = Math.max(0, ...series.flatMap((item) => item.values));

  return (
    <figure className="flex flex-col gap-3" data-testid={testId}>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {series.map((item) => (
          <span key={item.key} className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-sm ${item.color}`} aria-hidden />
            {item.label}
          </span>
        ))}
      </div>
      <div className="overflow-x-auto">
        <div className="flex min-w-[560px] items-end gap-2 border-b pb-1" style={{ height: 160 }}>
          {categories.map((category, index) => (
            <div key={category} className="flex min-w-0 flex-1 items-end justify-center gap-1">
              {series.map((item) => {
                const value = item.values[index] ?? 0;
                const height = max > 0 ? Math.round((value / max) * 100) : 0;
                return (
                  <div
                    key={item.key}
                    className={`w-full max-w-4 rounded-t ${item.color}`}
                    style={{ height: `${Math.max(height, value > 0 ? 2 : 0)}%` }}
                    title={`${category} · ${item.label}: ${formatValue(value)}`}
                    data-testid="bar-chart-bar"
                    data-value={value}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex min-w-[560px] gap-2 pt-1">
          {categories.map((category) => (
            <span
              key={category}
              className="min-w-0 flex-1 truncate text-center text-[10px] text-muted-foreground"
            >
              {category}
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}
