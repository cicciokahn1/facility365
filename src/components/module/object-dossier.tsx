'use client';

/**
 * Verlauf eines Objekts ueber alle Module.
 *
 * Zeigt zu Liegenschaft, Gebaeude, Raum und Anlage saemtliche Vorgaenge in
 * einer Zeitleiste - samt Kosten, Arbeitszeit und naechsten Fristen. Jeder
 * Eintrag fuehrt in seinen Datensatz, von dort geht es ueber dessen
 * Verknuepfungen weiter (Ticket → Auftrag → Rapport → Kosten).
 *
 * Erledigte Vorgaenge sind wie in allen Listen zuerst ausgeblendet.
 */
import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Clock, FileText, ImageIcon, Wallet } from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';
import { StatusBadge } from '@/components/common/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DossierLevel, useDossier } from '@/lib/links/dossier';
import { useT } from '@/lib/i18n/provider';
import { configOf } from '@/lib/module-config';
import { moduleByCollection } from '@/lib/modules';
import { useSettings } from '@/lib/settings/provider';
import { CollectionKey } from '@/lib/types';
import { formatDate, formatMoney } from '@/lib/utils/format';

const Metric = ({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  tone?: 'warning';
}) => (
  <div className="flex items-center gap-2 rounded-xl border bg-card p-3">
    <Icon
      className={`size-4 shrink-0 ${tone === 'warning' ? 'text-destructive' : 'text-muted-foreground'}`}
      aria-hidden
    />
    <div className="min-w-0">
      <div className="truncate text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  </div>
);

export function ObjectDossier({
  level,
  id,
}: {
  level: DossierLevel;
  id: string;
}) {
  const t = useT();
  const { settings } = useSettings();
  const dossier = useDossier(level, id);
  const [showDone, setShowDone] = useState(false);
  const [only, setOnly] = useState<CollectionKey | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const entries = dossier.entries.filter(
    (entry) =>
      (showDone || !entry.done) && (only === '' || entry.collection === only),
  ).filter((entry) => (!from || entry.date >= from) && (!to || entry.date <= to));

  return (
    <div className="flex flex-col gap-4" data-testid="object-dossier">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric
          icon={ChevronRight}
          label={t('dossier.open')}
          value={String(dossier.open.length)}
        />
        <Metric
          icon={Clock}
          label={t('dossier.overdue')}
          value={String(dossier.overdue.length)}
          tone={dossier.overdue.length > 0 ? 'warning' : undefined}
        />
        <Metric
          icon={Clock}
          label={t('dossier.hours')}
          value={`${dossier.hours}`}
        />
        <Metric
          icon={Wallet}
          label={t('dossier.cost')}
          value={formatMoney(dossier.cost, settings.currency)}
        />
      </div>

      {dossier.upcoming.length > 0 ? (
        <section className="rounded-xl border bg-card p-3">
          <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
            {t('dossier.upcoming')}
          </h3>
          <ul className="flex flex-col gap-1">
            {dossier.upcoming.map((entry) => (
              <li key={`next-${entry.key}`}>
                <Link
                  href={entry.path}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatDate(entry.dueDate, settings.language)}
                  </span>
                  <span className="truncate">{entry.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={only === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setOnly('')}
        >
          {t('common.all')}
        </Button>
        {dossier.countByCollection.map(([collection, count]) => (
          <Button
            key={collection}
            type="button"
            variant={only === collection ? 'default' : 'outline'}
            size="sm"
            onClick={() => setOnly(collection)}
          >
            {t(moduleByCollection(collection).labelKey)} {count}
          </Button>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => setShowDone(!showDone)}
        >
          {showDone ? t('dossier.hideDone') : t('dossier.showDone')}
        </Button>
      </div>
      <div className="flex flex-wrap items-end gap-2 rounded-xl border bg-card p-3">
        <label className="flex min-w-36 flex-1 flex-col gap-1 text-xs text-muted-foreground">
          {t('dossier.from')}
          <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label className="flex min-w-36 flex-1 flex-col gap-1 text-xs text-muted-foreground">
          {t('dossier.to')}
          <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
        {from || to ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setFrom('');
              setTo('');
            }}
          >
            {t('dossier.clearFilter')}
          </Button>
        ) : null}
      </div>

      {entries.length === 0 ? (
        <EmptyState icon={FileText} titleKey="list.empty" />
      ) : (
        <ol className="divide-y rounded-xl border bg-card">
          {entries.map((entry) => {
            const config = configOf(entry.collection);
            const moduleDef = moduleByCollection(entry.collection);
            const Icon = moduleDef.icon;
            return (
              <li key={entry.key} data-testid="dossier-entry">
                <Link href={entry.path} className="flex items-start gap-3 p-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs text-muted-foreground">
                      {entry.date
                        ? `${formatDate(entry.date, settings.language)} · `
                        : ''}
                      {t(moduleDef.singularKey)} · {entry.number}
                    </span>
                    <span className="block truncate text-sm font-medium">
                      {entry.title}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {entry.hours > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" aria-hidden />
                          {entry.hours} h
                        </span>
                      ) : null}
                      {entry.cost > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <Wallet className="size-3" aria-hidden />
                          {formatMoney(entry.cost, settings.currency)}
                        </span>
                      ) : null}
                      {entry.photoCount > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <ImageIcon className="size-3" aria-hidden />
                          {entry.photoCount}
                        </span>
                      ) : null}
                      {entry.documentCount > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <FileText className="size-3" aria-hidden />
                          {entry.documentCount}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  {config.statusField && config.statusOptions ? (
                    <StatusBadge
                      value={entry.status}
                      options={config.statusOptions}
                    />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
