'use client';

/**
 * Plananzeige mit Zoom, Fassungen und Markern fuer Anlagen und Raeume.
 *
 * Bilder werden mit eigenem Zoom dargestellt, PDF im Anzeigeprogramm des
 * Browsers. Marker gibt es deshalb nur auf Bildplaenen - eine Markierung auf
 * einer fremden PDF-Anzeige liesse sich nicht verlaesslich positionieren.
 * Marker lassen sich setzen, verschieben, bearbeiten und loeschen; ein Klick
 * fuehrt zum verknuepften Raum oder zur Anlage.
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Download,
  ExternalLink,
  MapPin,
  Minus,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

import { RelationSelect } from '@/components/module/relation-select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { dataUrlToBlobUrl, downloadDataUrl, isPdf } from '@/lib/media';
import { Plan, PlanMarker, PlanVersion } from '@/lib/types';
import { newId } from '@/lib/utils/id';

const ZOOM_STEPS = [1, 1.5, 2, 3, 4];

export const currentVersionOf = (plan: Plan): PlanVersion | undefined =>
  plan.versions.find((version) => version.id === plan.currentVersionId) ??
  plan.versions[plan.versions.length - 1];

/** Ziel eines Markers, damit der Plan zum Datensatz fuehrt. */
const targetOf = (marker: PlanMarker): string =>
  marker.roomId
    ? `/rooms/${marker.roomId}`
    : marker.assetId
      ? `/assets/${marker.assetId}`
      : '';

export function PlanViewer({
  plan,
  open,
  onOpenChange,
  onChange,
}: {
  plan: Plan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (plan: Plan) => void;
}) {
  const t = useT();
  const rooms = useCollectionItems('rooms');
  const assets = useCollectionItems('assets');
  const [zoomIndex, setZoomIndex] = useState(0);
  const [markerMode, setMarkerMode] = useState(false);
  const [draftMarker, setDraftMarker] = useState<PlanMarker | null>(null);
  const [newLayerName, setNewLayerName] = useState('');
  const layers = plan.layers?.length
    ? plan.layers
    : [{ id: 'default', name: 'Standard', visible: true }];
  const [activeLayerId, setActiveLayerId] = useState('all');
  /** Marker, der gerade verschoben wird; der naechste Klick setzt ihn neu. */
  const [movingId, setMovingId] = useState('');
  const version = currentVersionOf(plan);
  const pdf = version ? isPdf(version.mimeType, version.fileName) : false;

  const blobUrl = useMemo(
    () => (version && pdf ? dataUrlToBlobUrl(version.url, version.mimeType) : null),
    [version, pdf],
  );

  useEffect(() => () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
  }, [blobUrl]);

  if (!version) return null;

  /** Bezeichnung eines Markers aus Raum, Anlage oder eigenem Text. */
  const labelOf = (marker: PlanMarker): string => {
    const room = marker.roomId
      ? rooms.find((entry) => entry.id === marker.roomId)
      : undefined;
    const asset = marker.assetId
      ? assets.find((entry) => entry.id === marker.assetId)
      : undefined;
    return (
      marker.label ||
      (room ? [room.roomNumber, room.name].filter(Boolean).join(' · ') : '') ||
      asset?.name ||
      ''
    );
  };

  const clickPlan = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!markerMode && !movingId) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    if (movingId) {
      onChange({
        ...plan,
        markers: plan.markers.map((marker) =>
          marker.id === movingId ? { ...marker, x, y } : marker,
        ),
      });
      setMovingId('');
      return;
    }
    setDraftMarker({
      id: newId('marker'),
      x,
      y,
      assetId: '',
      roomId: '',
      layerId: activeLayerId === 'all' ? layers[0].id : activeLayerId,
      label: '',
      note: '',
    });
    setMarkerMode(false);
  };

  const saveMarker = () => {
    if (!draftMarker) return;
    const exists = plan.markers.some((marker) => marker.id === draftMarker.id);
    onChange({
      ...plan,
      markers: exists
        ? plan.markers.map((marker) =>
            marker.id === draftMarker.id ? draftMarker : marker,
          )
        : [...plan.markers, draftMarker],
    });
    setDraftMarker(null);
  };

  const removeMarker = (id: string) => {
    onChange({ ...plan, markers: plan.markers.filter((marker) => marker.id !== id) });
    setDraftMarker(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[95dvh] w-[calc(100vw-1rem)] max-w-5xl overflow-hidden p-3 sm:w-full"
        showCloseButton={false}
      >
        <DialogTitle className="pr-8 text-base">{plan.title}</DialogTitle>

        <div className="flex flex-wrap items-center gap-2">
          {layers.length > 1 ? (
            <Select value={activeLayerId} onValueChange={setActiveLayerId}>
              <SelectTrigger className="w-44" data-testid="plan-layer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('plan.layerAll')}</SelectItem>
                {layers.map((layer) => (
                  <SelectItem key={layer.id} value={layer.id}>
                    {layer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Input
            className="w-36"
            placeholder={t('plan.layerName')}
            value={newLayerName}
            onChange={(event) => setNewLayerName(event.target.value)}
            aria-label={t('plan.layerName')}
          />
          <Button
            variant="outline"
            onClick={() => {
              const name = newLayerName.trim();
              if (!name) return;
              const next = {
                id: newId('layer'),
                name,
                visible: true,
              };
              onChange({ ...plan, layers: [...layers, next] });
              setNewLayerName('');
              setActiveLayerId(next.id);
            }}
          >
            <Plus className="size-4" aria-hidden />
            {t('action.add')}
          </Button>
          {plan.versions.length > 1 ? (
            <Select
              value={version.id}
              onValueChange={(value) => onChange({ ...plan, currentVersionId: value })}
            >
              <SelectTrigger className="w-44" data-testid="plan-version">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {plan.versions.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {t('plan.version')} {entry.version}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {!pdf ? (
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="outline"
                aria-label={t('plan.zoomOut')}
                onClick={() => setZoomIndex((index) => Math.max(0, index - 1))}
              >
                <Minus className="size-4" />
              </Button>
              <span className="w-12 text-center text-sm">{ZOOM_STEPS[zoomIndex]}×</span>
              <Button
                size="icon"
                variant="outline"
                aria-label={t('plan.zoomIn')}
                data-testid="plan-zoom-in"
                onClick={() => setZoomIndex((index) => Math.min(ZOOM_STEPS.length - 1, index + 1))}
              >
                <Plus className="size-4" />
              </Button>
              <Button
                variant={markerMode ? 'default' : 'outline'}
                onClick={() => {
                  setMovingId('');
                  setMarkerMode((value) => !value);
                }}
                data-testid="plan-marker-mode"
              >
                <MapPin className="size-4" aria-hidden />
                {t('plan.addMarker')}
              </Button>
            </div>
          ) : null}

          <Button
            variant="outline"
            className="ml-auto"
            onClick={() => downloadDataUrl(version.url, version.fileName)}
          >
            <Download className="size-4" aria-hidden />
            {t('action.download')}
          </Button>
          <Button size="icon" variant="ghost" aria-label={t('action.close')} onClick={() => onOpenChange(false)}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="max-h-[70dvh] overflow-auto rounded-lg border bg-muted/40">
          {pdf ? (
            blobUrl ? (
              <iframe src={blobUrl} title={plan.title} className="h-[70dvh] w-full" />
            ) : (
              <p className="p-6 text-sm text-muted-foreground">{t('plan.previewUnavailable')}</p>
            )
          ) : (
            <div
              className="relative w-full origin-top-left"
              style={{ width: `${ZOOM_STEPS[zoomIndex] * 100}%` }}
              onClick={clickPlan}
              data-testid="plan-canvas"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- Plan liegt als Data-URL vor */}
              <img src={version.url} alt={plan.title} className="w-full select-none" />
              {plan.markers
                .filter(
                  (marker) =>
                    activeLayerId === 'all' ||
                    (marker.layerId ?? layers[0].id) === activeLayerId,
                )
                .map((marker) => (
                <button
                  key={marker.id}
                  type="button"
                  data-testid="plan-marker"
                  className="absolute -translate-x-1/2 -translate-y-full"
                  style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                  title={labelOf(marker)}
                  aria-label={labelOf(marker) || t('plan.marker')}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (markerMode || movingId) return;
                    setDraftMarker({ roomId: '', ...marker });
                  }}
                >
                  <MapPin
                    className={
                      marker.id === movingId
                        ? 'size-6 animate-pulse fill-destructive text-destructive-foreground'
                        : marker.roomId
                          ? 'size-6 fill-secondary text-secondary-foreground'
                          : 'size-6 fill-primary text-primary-foreground'
                    }
                  />
                </button>
                ))}
            </div>
          )}
        </div>
        {markerMode || movingId ? (
          <p className="text-sm text-muted-foreground">{t('plan.markerHint')}</p>
        ) : null}

        {plan.markers.length > 0 && !pdf ? (
          <ul className="max-h-40 divide-y overflow-auto rounded-lg border text-sm">
            {plan.markers.map((marker) => {
              const href = targetOf(marker);
              return (
                <li key={marker.id} className="flex items-center gap-2 p-2">
                  <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">
                    {labelOf(marker) || t('plan.marker')}
                  </span>
                  {href ? (
                    <Button asChild size="sm" variant="ghost">
                      <Link href={href}>
                        <ExternalLink className="size-4" aria-hidden />
                        {t('action.open')}
                      </Link>
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    data-testid="marker-move"
                    onClick={() => {
                      setMarkerMode(false);
                      setMovingId(marker.id);
                    }}
                  >
                    {t('plan.moveMarker')}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={t('action.delete')}
                    data-testid="marker-delete"
                    onClick={() => removeMarker(marker.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : null}

        <Dialog open={draftMarker !== null} onOpenChange={(value) => !value && setDraftMarker(null)}>
          <DialogContent>
            <DialogTitle>{t('plan.addMarker')}</DialogTitle>
            {draftMarker ? (
              <div className="flex flex-col gap-3">
                <Input
                  placeholder={t('common.title')}
                  value={draftMarker.label}
                  onChange={(event) => setDraftMarker({ ...draftMarker, label: event.target.value })}
                  data-testid="marker-label"
                />
                <div className="flex flex-col gap-1">
                  <Label>{t('module.rooms.singular')}</Label>
                  <RelationSelect
                    collection="rooms"
                    value={draftMarker.roomId ?? ''}
                    onChange={(value) => setDraftMarker({ ...draftMarker, roomId: value })}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>{t('module.assets.singular')}</Label>
                  <RelationSelect
                    collection="assets"
                    value={draftMarker.assetId}
                    onChange={(value) => setDraftMarker({ ...draftMarker, assetId: value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveMarker} data-testid="marker-save" className="flex-1">
                    {t('action.save')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => removeMarker(draftMarker.id)}
                    aria-label={t('action.delete')}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
