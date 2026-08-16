'use client';

/**
 * Uebersicht eines Moduls.
 *
 * Enthaelt Suche, Filter, Sortierung und das Anlegen neuer Datensaetze - fuer
 * jedes Modul identisch aufgebaut.
 */
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/common/empty-state';
import { StatusBadge } from '@/components/common/status-badge';
import { EntityForm } from '@/components/module/entity-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollection } from '@/lib/data/store';
import { fieldValue, stringField } from '@/lib/entity-values';
import { useT } from '@/lib/i18n/provider';
import { configOf, titleOfEntity } from '@/lib/module-config';
import { moduleByCollection } from '@/lib/modules';
import { FormValues, SelectField, asString } from '@/lib/schema';
import { useSettings } from '@/lib/settings/provider';
import { CollectionKey } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/format';

type SortKey = 'newest' | 'oldest' | 'name';

export function ModuleList({ collection }: { collection: CollectionKey }) {
  const t = useT();
  const router = useRouter();
  const moduleDef = moduleByCollection(collection);
  const config = configOf(collection);
  const { items, create } = useCollection(collection);
  const { settings } = useSettings();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [relationFilters, setRelationFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<SortKey>('newest');
  /** Schnellaktionen des Dashboards oeffnen das Formular direkt: ?new=1 */
  const [formOpen, setFormOpen] = useState(useSearchParams().get('new') === '1');

  const statusField = config.fields.find(
    (field): field is SelectField => field.kind === 'select' && field.name === config.statusField,
  );
  const relationFilterFields = config.fields.filter(
    (field) => field.kind === 'relation' && field.filter,
  );

  const filtered = (() => {
    const needle = query.trim().toLowerCase();
    const searchOf = config.searchOf as (entity: (typeof items)[number]) => string;
    const result = items.filter((item) => {
      if (needle && !searchOf(item).toLowerCase().includes(needle)) return false;
      if (statusFilter !== 'all' && config.statusField) {
        if (stringField(item, config.statusField) !== statusFilter) return false;
      }
      return Object.entries(relationFilters).every(
        ([name, value]) => !value || value === 'all' || stringField(item, name) === value,
      );
    });
    const titleOf = config.titleOf as (entity: (typeof items)[number]) => string;
    return [...result].sort((a, b) => {
      if (sort === 'name') return titleOf(a).localeCompare(titleOf(b));
      if (sort === 'oldest') return a.createdAt.localeCompare(b.createdAt);
      return b.createdAt.localeCompare(a.createdAt);
    });
  })();

  const initialValues = (() => {
    const defaults: FormValues = {};
    config.fields.forEach((field) => {
      if (field.kind === 'select') defaults[field.name] = field.options[0]?.value ?? '';
      else if (field.kind === 'address')
        defaults[field.name] = { street: '', zip: '', city: '', country: 'Schweiz' };
      else if (field.kind === 'switch') defaults[field.name] = false;
      else defaults[field.name] = '';
    });
    return defaults;
  })();

  const handleCreate = (values: FormValues) => {
    const entity = create(values as never, settings.profileName || settings.companyName);
    toast.success(t('toast.created'));
    router.push(`${moduleDef.path}/${entity.id}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t(moduleDef.labelKey)}</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} {t('list.count')}
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} data-testid="new-entity">
          <Plus className="size-4" aria-hidden />
          {t('action.new')}
        </Button>
      </header>

      <div className="flex flex-col gap-3">
        <Input
          data-testid="module-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('list.searchPlaceholder')}
          className="h-11"
        />

        {statusField ? (
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            <FilterChip
              active={statusFilter === 'all'}
              label={t('common.all')}
              count={items.length}
              onClick={() => setStatusFilter('all')}
            />
            {statusField.options.map((option) => {
              const count = items.filter(
                (item) => stringField(item, statusField.name) === option.value,
              ).length;
              return (
                <FilterChip
                  key={option.value}
                  active={statusFilter === option.value}
                  label={t(option.labelKey)}
                  count={count}
                  onClick={() => setStatusFilter(option.value)}
                />
              );
            })}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {relationFilterFields.map((field) => (
            <div key={field.name} className="min-w-40 flex-1 sm:max-w-56">
              <RelationFilter
                labelKey={field.kind === 'relation' ? field.labelKey : field.labelKey}
                collection={field.kind === 'relation' ? field.collection : collection}
                value={relationFilters[field.name] ?? 'all'}
                onChange={(value) =>
                  setRelationFilters((current) => ({ ...current, [field.name]: value }))
                }
              />
            </div>
          ))}
          <div className="min-w-40 flex-1 sm:max-w-44">
            <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
              <SelectTrigger className="w-full" data-testid="sort-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t('list.sort.newest')}</SelectItem>
                <SelectItem value="oldest">{t('list.sort.oldest')}</SelectItem>
                <SelectItem value="name">{t('list.sort.name')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={moduleDef.icon}
          titleKey={items.length === 0 ? 'list.empty' : 'list.noSearchResults'}
          textKey={items.length === 0 ? 'list.emptyHint' : undefined}
          action={
            items.length === 0 ? (
              <Button onClick={() => setFormOpen(true)} variant="outline">
                <Plus className="size-4" aria-hidden />
                {t('action.new')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul
          data-testid="entity-list"
          className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
        >
          {filtered.map((item) => (
            <li key={item.id}>
              <Link
                href={`${moduleDef.path}/${item.id}`}
                data-testid="entity-card"
                className="flex h-full flex-col gap-2 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-muted-foreground">{item.number}</p>
                    <p className="truncate font-medium">{titleOfEntity(collection, item)}</p>
                  </div>
                  {config.statusField && config.statusOptions ? (
                    <StatusBadge
                      value={stringField(item, config.statusField)}
                      options={config.statusOptions}
                    />
                  ) : null}
                </div>
                <CardMeta collection={collection} entity={item} />
                <p className="mt-auto pt-2 text-xs text-muted-foreground">
                  {t('common.updatedAt')}: {formatDate(item.updatedAt, settings.language)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <EntityForm
        open={formOpen}
        onOpenChange={setFormOpen}
        title={`${t('action.new')} · ${t(moduleDef.singularKey)}`}
        fields={config.fields}
        initialValues={initialValues}
        onSubmit={handleCreate}
      />
    </div>
  );
}

function FilterChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="filter-chip"
      data-active={active}
      className={cn(
        'shrink-0 rounded-full border px-3 py-2 text-sm font-medium transition-colors',
        active ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-accent/50',
      )}
    >
      {label}
      <span className={cn('ml-2 text-xs', active ? 'opacity-80' : 'text-muted-foreground')}>
        {count}
      </span>
    </button>
  );
}

function RelationFilter({
  labelKey,
  collection,
  value,
  onChange,
}: {
  labelKey: Parameters<ReturnType<typeof useT>>[0];
  collection: CollectionKey;
  value: string;
  onChange: (value: string) => void;
}) {
  const t = useT();
  const { items } = useCollection(collection);
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full" data-testid={`filter-${collection}`}>
        <SelectValue placeholder={t(labelKey)} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t(labelKey)}</SelectItem>
        {items.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            {titleOfEntity(collection, item)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Zwei Kennzahlen je Karte: die wichtigsten Verknuepfungen oder Felder. */
function CardMeta({ collection, entity }: { collection: CollectionKey; entity: { id: string } }) {
  const config = configOf(collection);
  const t = useT();
  const { settings } = useSettings();
  const relevant = config.fields
    .filter((field) => ['relation', 'date', 'address', 'text'].includes(field.kind))
    .slice(0, 2);

  return (
    <dl className="grid gap-1 text-sm">
      {relevant.map((field) => (
        <MetaRow
          key={field.name}
          label={t(field.labelKey)}
          field={field}
          entity={entity as never}
          language={settings.language}
        />
      ))}
    </dl>
  );
}

function MetaRow({
  label,
  field,
  entity,
  language,
}: {
  label: string;
  field: ReturnType<typeof configOf>['fields'][number];
  entity: Parameters<typeof fieldValue>[0];
  language: Parameters<typeof formatDate>[1];
}) {
  const items = useCollection(field.kind === 'relation' ? field.collection : 'customers');
  const raw = fieldValue(entity, field.name);

  let display = '';
  if (field.kind === 'relation') {
    const target = items.items.find((item) => item.id === asString(raw));
    display = target ? titleOfEntity(field.collection, target) : '';
  } else if (field.kind === 'date') {
    display = asString(raw) ? formatDate(asString(raw), language) : '';
  } else if (field.kind === 'address' && raw && typeof raw === 'object') {
    const address = raw as { street?: string; zip?: string; city?: string };
    display = [address.street, [address.zip, address.city].filter(Boolean).join(' ')]
      .filter(Boolean)
      .join(', ');
  } else {
    display = asString(raw);
  }

  if (!display) return null;
  return (
    <div className="flex gap-2 text-muted-foreground">
      <dt className="shrink-0">{label}:</dt>
      <dd className="truncate text-foreground">{display}</dd>
    </div>
  );
}
