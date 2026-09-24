'use client';

/** Auditmodus: Standort und Zeitraum waehlen, Ampelstatus sehen, Bericht als PDF. */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileDown, Hammer, Save, Settings2, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AuditTone,
  countTones,
  technicalAttentionOf,
  technicalCategoryLabelOf,
  technicalCheckpointsOf,
  previousTechnicalMeasurementsOf,
  useAuditSections,
} from '@/lib/audit/audit';
import type { AuditPdfLabels } from '@/lib/audit/audit-pdf';
import { logoOf } from '@/lib/branding/logo';
import { useCollection, useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';
import { PHOTO_ACCEPT, photoFromFile } from '@/lib/media';
import type { Photo, TechnicalCheckpointResult } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDate, today } from '@/lib/utils/format';

const ALL = 'all';

/** Farbe der Ampel. */
const TONE_CLASS: Record<AuditTone, string> = {
  green: 'bg-success',
  amber: 'bg-warning',
  red: 'bg-destructive',
};

/** Vorgabe: das laufende Jahr. */
const yearStart = (): string => `${new Date().getFullYear()}-01-01`;

export function AuditView({ mode = 'audit' }: { mode?: 'audit' | 'walkthrough' }) {
  const isWalkthrough = mode === 'walkthrough';
  const t = useT();
  const router = useRouter();
  const { settings, save } = useSettings();
  const properties = useCollectionItems('properties');
  const buildings = useCollectionItems('buildings');
  const assets = useCollectionItems('assets');
  const inspections = useCollectionItems('inspections');
  const inspectionStore = useCollection('inspections');
  const damageStore = useCollection('damages');
  const orderStore = useCollection('orders');
  const maintenanceStore = useCollection('maintenances');

  const [property, setProperty] = useState(ALL);
  const [building, setBuilding] = useState(ALL);
  const [from, setFrom] = useState(yearStart());
  const [to, setTo] = useState(today());
  const [walkthroughValues, setWalkthroughValues] = useState<
    Record<string, Record<string, string>>
  >({});
  const [walkthroughNotes, setWalkthroughNotes] = useState<Record<string, string>>({});
  const [walkthroughPhotos, setWalkthroughPhotos] = useState<Record<string, Photo[]>>({});
  const [walkthroughSaved, setWalkthroughSaved] = useState(false);
  const [templateJson, setTemplateJson] = useState(() =>
    JSON.stringify(settings.technicalChecklistTemplates ?? {}, null, 2),
  );

  const isAdmin =
    settings.profileRole.toLocaleLowerCase('de-CH').includes('admin') ||
    settings.profileRole.toLocaleLowerCase('de-CH').includes('super');

  const buildingChoices = useMemo(
    () => (property === ALL ? buildings : buildings.filter((item) => item.propertyId === property)),
    [buildings, property],
  );

  const filter = useMemo(
    () => ({
      propertyId: property === ALL ? '' : property,
      buildingId: building === ALL ? '' : building,
      from,
      to,
    }),
    [building, from, property, to],
  );

  const sections = useAuditSections(filter);
  const tones = useMemo(() => countTones(sections), [sections]);
  const total = tones.green + tones.amber + tones.red;

  const locationText = [
    properties.find((item) => item.id === filter.propertyId)?.name,
    buildings.find((item) => item.id === filter.buildingId)?.name,
  ]
    .filter(Boolean)
    .join(' · ') || t('audit.allLocations');

  const periodText = `${formatDate(from, settings.language)} – ${formatDate(to, settings.language)}`;
  const technicalAssets = useMemo(
    () =>
      assets.filter(
        (asset) =>
          Boolean(filter.buildingId) &&
          asset.buildingId === filter.buildingId &&
          asset.status !== 'inactive',
      ),
    [assets, filter.buildingId],
  );

  const saveTechnicalWalkthrough = () => {
    if (!filter.buildingId || technicalAssets.length === 0) return;
    technicalAssets.forEach((asset) => {
      const checkpoints = technicalCheckpointsOf(asset, settings.technicalChecklistTemplates).map((checkpoint) => {
        const value = walkthroughValues[asset.id]?.[checkpoint.key] ?? '';
        return {
          key: checkpoint.key,
          label: checkpoint.label,
          value,
          target: checkpoint.target,
          unit: checkpoint.unit,
          status: value.toLocaleLowerCase('de-CH').includes('fehler') ||
            value.toLocaleLowerCase('de-CH').includes('leckage')
            ? 'attention'
            : value
              ? 'ok'
              : 'notChecked',
        } satisfies TechnicalCheckpointResult;
      });
      const measurements = Object.fromEntries(
        technicalCheckpointsOf(asset, settings.technicalChecklistTemplates)
          .filter((checkpoint) => checkpoint.kind === 'measurement')
          .map((checkpoint) => [checkpoint.key, walkthroughValues[asset.id]?.[checkpoint.key] ?? '']),
      );
      const previousMeasurements = previousTechnicalMeasurementsOf(inspections, asset.id);
      inspectionStore.create({
        title: `Technischer Rundgang – ${asset.name || asset.number}`,
        type: 'custom',
        customType: 'Technischer Rundgang',
        propertyId: asset.propertyId,
        buildingId: asset.buildingId,
        roomId: asset.roomId,
        assetId: asset.id,
        date: today(),
        tester: settings.profileName || settings.companyName,
        interval: 'monthly',
        nextDate: '',
        result: technicalAttentionOf(checkpoints) ? 'failed' : 'passed',
        status: 'done',
        measures: walkthroughNotes[asset.id] ?? '',
        technicalCategory: technicalCategoryLabelOf(asset),
        technicalCheckpoints: checkpoints,
        technicalMeasurements: measurements,
        previousMeasurements,
        photos: walkthroughPhotos[asset.id] ?? [],
      });
    });
    setWalkthroughSaved(true);
  };

  const createFollowUp = (assetId: string, kind: 'damage' | 'order' | 'maintenance') => {
    const asset = technicalAssets.find((entry) => entry.id === assetId);
    if (!asset) return;
    const description = walkthroughNotes[asset.id] || 'Abweichung aus technischem Rundgang';
    if (kind === 'damage') {
      const damage = damageStore.create({
        title: `Rundgang: ${asset.name || asset.number}`,
        description,
        propertyId: asset.propertyId,
        buildingId: asset.buildingId,
        roomId: asset.roomId,
        assetId: asset.id,
        reportedAt: today(),
        priority: 'high',
        photos: walkthroughPhotos[asset.id] ?? [],
      });
      router.push(`/damages/${damage.id}`);
    } else if (kind === 'order') {
      const order = orderStore.create({
        title: `Rundgang: ${asset.name || asset.number}`,
        description,
        propertyId: asset.propertyId,
        buildingId: asset.buildingId,
        roomId: asset.roomId,
        assetId: asset.id,
        priority: 'high',
        photos: walkthroughPhotos[asset.id] ?? [],
      });
      router.push(`/orders/${order.id}`);
    } else {
      const maintenance = maintenanceStore.create({
        title: `Rundgang: ${asset.name || asset.number}`,
        description,
        propertyId: asset.propertyId,
        buildingId: asset.buildingId,
        assetId: asset.id,
        interval: 'monthly',
        nextDate: today(),
        status: 'planned',
        photos: walkthroughPhotos[asset.id] ?? [],
      });
      router.push(`/maintenances/${maintenance.id}`);
    }
    toast.success('Folgevorgang erstellt');
  };

  const createPdf = async () => {
    const labels: AuditPdfLabels = {
      title: t('audit.reportTitle'),
      location: t('audit.location'),
      period: t('audit.period'),
      createdAt: t('common.date'),
      summary: t('audit.summary'),
      green: t('audit.green'),
      amber: t('audit.amber'),
      red: t('audit.red'),
      number: t('common.number'),
      subject: t('common.title'),
      date: t('common.date'),
      status: t('common.status'),
      empty: t('audit.sectionEmpty'),
    };

    /** Die PDF-Erzeugung wird erst beim Klick geladen, nicht beim Oeffnen der Seite. */
    const { downloadAuditPdf } = await import('@/lib/audit/audit-pdf');
    downloadAuditPdf(
      {
        location: locationText,
        period: periodText,
        createdAt: formatDate(today(), settings.language),
        green: tones.green,
        amber: tones.amber,
        red: tones.red,
        sections: [
          ...sections.map((section) => ({
            title: t(section.labelKey),
            rows: section.rows.map((row) => ({
              tone: row.tone,
              number: row.number,
              title: row.title,
              date: formatDate(row.date, settings.language),
              status: t(row.statusKey),
              detail: row.detail,
            })),
          })),
          ...(technicalAssets.length > 0
            ? [
                {
                  title: 'Technischer Rundgang',
                  rows: technicalAssets.map((asset) => {
      const checkpoints = technicalCheckpointsOf(asset, settings.technicalChecklistTemplates).map((checkpoint) => ({
                      key: checkpoint.key,
                      label: checkpoint.label,
                      value: walkthroughValues[asset.id]?.[checkpoint.key] ?? '',
                      unit: checkpoint.unit,
                      target: checkpoint.target,
                      status: 'ok' as const,
                    }));
                    const attention = technicalAttentionOf(checkpoints);
                    return {
                      tone: attention ? ('red' as const) : ('green' as const),
                      number: asset.number,
                      title: asset.name || asset.number,
                      date: formatDate(today(), settings.language),
                      status: attention ? 'Abweichung' : 'Kontrolliert',
                      detail: checkpoints
                        .filter((checkpoint) => checkpoint.value)
                        .map(
                          (checkpoint) =>
                            `${checkpoint.label}${checkpoint.unit ? ` (${checkpoint.unit})` : ''}${
                              checkpoint.target ? ` Soll: ${checkpoint.target}` : ''
                            }: ${checkpoint.value}`,
                        )
                        .join(' · '),
                    };
                  }),
                },
              ]
            : []),
        ],
      },
      labels,
      {
        companyName: settings.companyName || 'Facility365',
        companyAddress: [
          settings.companyAddress.street,
          [settings.companyAddress.zip, settings.companyAddress.city].filter(Boolean).join(' '),
        ]
          .filter(Boolean)
          .join(', '),
        companyContact: [settings.companyPhone, settings.companyEmail].filter(Boolean).join(' · '),
        logo: logoOf(settings.companyLogo),
      },
    );
  };

  const addWalkthroughPhoto = async (assetId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const photos = await Promise.all(Array.from(files).map((file) => photoFromFile(file)));
    setWalkthroughPhotos((current) => ({
      ...current,
      [assetId]: [...(current[assetId] ?? []), ...photos],
    }));
  };

  const saveTemplates = async () => {
    try {
      const technicalChecklistTemplates = JSON.parse(templateJson) as typeof settings.technicalChecklistTemplates;
      if (!technicalChecklistTemplates || typeof technicalChecklistTemplates !== 'object') throw new Error('invalid');
      await save({ ...settings, technicalChecklistTemplates });
      toast.success('Technische Checklisten gespeichert');
    } catch {
      toast.error('Bitte gültige Checklisten-Konfiguration eingeben');
    }
  };

  return (
    <div className="flex flex-col gap-4" data-testid="audit-view">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">
            {isWalkthrough ? t('module.walkthrough') : t('module.audit')}
          </CardTitle>
          <Button onClick={() => void createPdf()} data-testid="audit-pdf">
            <FileDown className="size-4" aria-hidden />
            {t('audit.createReport')}
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <Label>{t('module.properties.singular')}</Label>
              <Select
                value={property}
                onValueChange={(value) => {
                  setProperty(value);
                  setBuilding(ALL);
                }}
              >
                <SelectTrigger data-testid="audit-property">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t('audit.allProperties')}</SelectItem>
                  {properties.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name || item.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t('module.buildings.singular')}</Label>
              <Select value={building} onValueChange={setBuilding}>
                <SelectTrigger data-testid="audit-building">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t('audit.allBuildings')}</SelectItem>
                  {buildingChoices.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name || item.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="audit-from">{t('audit.from')}</Label>
              <Input
                id="audit-from"
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                data-testid="audit-from"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="audit-to">{t('audit.to')}</Label>
              <Input
                id="audit-to"
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                data-testid="audit-to"
              />
            </div>
          </div>

          {!isWalkthrough ? <div className="grid gap-3 sm:grid-cols-3" data-testid="audit-summary">
            {([
              ['green', t('audit.green'), tones.green],
              ['amber', t('audit.amber'), tones.amber],
              ['red', t('audit.red'), tones.red],
            ] as [AuditTone, string, number][]).map(([tone, label, count]) => (
              <div
                key={tone}
                className="flex items-center gap-3 rounded-lg border p-3"
                data-testid={`audit-count-${tone}`}
              >
                <span className={cn('size-3 rounded-full', TONE_CLASS[tone])} aria-hidden />
                <span className="text-lg font-semibold">{count}</span>
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
            ))}
          </div> : null}
          {!isWalkthrough && total === 0 ? (
            <p className="text-sm text-muted-foreground" data-testid="audit-empty">
              {t('audit.noData')}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {isWalkthrough ? <Card data-testid="technical-walkthrough">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TriangleAlert className="size-4" aria-hidden />
            Vernetzter technischer Rundgang
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Gebäude auswählen: Die vorhandenen Anlagen und passenden Kontrollpunkte werden automatisch übernommen.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!filter.buildingId ? (
            <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              Bitte zuerst ein Gebäude auswählen.
            </p>
          ) : technicalAssets.length === 0 ? (
            <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              In diesem Gebäude sind keine Anlagen erfasst.
            </p>
          ) : (
            technicalAssets.map((asset) => {
              const checkpoints = technicalCheckpointsOf(asset, settings.technicalChecklistTemplates);
              const previous = previousTechnicalMeasurementsOf(inspections, asset.id);
              return (
                <div key={asset.id} className="rounded-lg border p-3">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="font-medium">{asset.name || asset.number}</span>
                    <span className="text-xs text-muted-foreground">{technicalCategoryLabelOf(asset)}</span>
                    {Object.keys(previous).length > 0 ? (
                      <span className="text-xs text-muted-foreground">Frühere Messwerte vorhanden</span>
                    ) : null}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {checkpoints.map((checkpoint) => (
                      <div key={checkpoint.key} className="flex flex-col gap-1.5">
                        <Label htmlFor={`walkthrough-${asset.id}-${checkpoint.key}`}>
                          {checkpoint.label}
                          {checkpoint.unit ? ` (${checkpoint.unit})` : ''}
                          {checkpoint.target ? ` · Soll: ${checkpoint.target}` : ''}
                        </Label>
                        <Input
                          id={`walkthrough-${asset.id}-${checkpoint.key}`}
                          placeholder={previous[checkpoint.key] ? `Vorher: ${previous[checkpoint.key]}` : 'Wert / OK / Hinweis'}
                          value={walkthroughValues[asset.id]?.[checkpoint.key] ?? ''}
                          onChange={(event) =>
                            setWalkthroughValues((current) => ({
                              ...current,
                              [asset.id]: {
                                ...current[asset.id],
                                [checkpoint.key]: event.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <Textarea
                    className="mt-3"
                    placeholder="Bemerkung / Abweichung"
                    value={walkthroughNotes[asset.id] ?? ''}
                    onChange={(event) =>
                      setWalkthroughNotes((current) => ({ ...current, [asset.id]: event.target.value }))
                    }
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Label htmlFor={`walkthrough-photo-${asset.id}`} className="cursor-pointer rounded-md border px-3 py-2 text-sm">
                      Foto hinzufügen
                    </Label>
                    <Input
                      id={`walkthrough-photo-${asset.id}`}
                      type="file"
                      accept={PHOTO_ACCEPT}
                      capture="environment"
                      className="hidden"
                      onChange={(event) => void addWalkthroughPhoto(asset.id, event.target.files)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {(walkthroughPhotos[asset.id] ?? []).length} Foto/Fotos
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => createFollowUp(asset.id, 'damage')}>
                      <TriangleAlert className="size-4" aria-hidden />
                      Schaden
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => createFollowUp(asset.id, 'order')}>
                      <Hammer className="size-4" aria-hidden />
                      Auftrag
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => createFollowUp(asset.id, 'maintenance')}>
                      <Settings2 className="size-4" aria-hidden />
                      Wartung
                    </Button>
                  </div>
                </div>
              );
            })
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={saveTechnicalWalkthrough} disabled={!filter.buildingId || technicalAssets.length === 0}>
              <Save className="size-4" aria-hidden />
              Rundgang speichern
            </Button>
            {walkthroughSaved ? (
              <span className="text-sm text-success">Kontrollen und Messwerte gespeichert.</span>
            ) : null}
          </div>
        </CardContent>
      </Card> : null}

      {isWalkthrough && isAdmin ? (
        <Card data-testid="technical-checklist-admin">
          <CardHeader>
            <CardTitle className="text-base">Technische Checklisten verwalten</CardTitle>
            <p className="text-sm text-muted-foreground">
              JSON-Erweiterungen je Anlagentyp. Bestehende Standardpunkte bleiben erhalten.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Textarea
              value={templateJson}
              onChange={(event) => setTemplateJson(event.target.value)}
              className="min-h-48 font-mono text-xs"
              placeholder={'{"heizung":[{"key":"co","label":"CO-Wert","kind":"measurement","unit":"ppm","target":"< 100"}]}'}
            />
            <Button className="w-fit" onClick={() => void saveTemplates()}>
              Checklisten speichern
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isWalkthrough ? sections.map((section) => (
        <Card key={section.key} data-testid={`audit-section-${section.key}`}>
          <CardHeader>
            <CardTitle className="text-base">
              {t(section.labelKey)} ({section.rows.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {section.rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('audit.sectionEmpty')}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {section.rows.map((row) => (
                  <li key={row.id}>
                    <Link
                      href={row.href}
                      className="flex flex-wrap items-center gap-3 rounded-lg border p-3 text-sm hover:bg-accent"
                      data-testid="audit-row"
                      data-tone={row.tone}
                    >
                      <span className={cn('size-3 shrink-0 rounded-full', TONE_CLASS[row.tone])} aria-hidden />
                      <span className="text-xs text-muted-foreground">{row.number}</span>
                      <span className="font-medium">{row.title}</span>
                      <span className="ml-auto flex flex-wrap items-center gap-3 text-muted-foreground">
                        <span>{formatDate(row.date, settings.language)}</span>
                        <span>{t(row.statusKey)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )) : null}
    </div>
  );
}
