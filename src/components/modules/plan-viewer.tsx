'use client';

/**
 * Plananzeige mit Zoom, Fassungen und Anlagenmarkern.
 *
 * Bilder werden mit eigenem Zoom dargestellt, PDF im Anzeigeprogramm des
 * Browsers. Marker gibt es deshalb nur auf Bildplaenen - eine Markierung auf
 * einer fremden PDF-Anzeige liesse sich nicht verlaesslich positionieren.
 */
import { useEffect, useMemo, useState } from 'react';
import { Download, MapPin, Minus, Plus, X } from 'lucide-react';

import { RelationSelect } from '@/components/module/relation-select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/lib/i18n/provider';
import { dataUrlToBlobUrl, downloadDataUrl, isPdf } from '@/lib/media';
import { Plan, PlanMarker, PlanVersion } from '@/lib/types';
import { newId } from '@/lib/utils/id';

const ZOOM_STEPS = [1, 1.5, 2, 3, 4];

export const currentVersionOf = (plan: Plan): PlanVersion | undefined =>
  plan.versions.find((version) => version.id === plan.currentVersionId) ??
  plan.versions[plan.versions.length - 1];

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
  const [zoomIndex, setZoomIndex] = useState(0);
  const [markerMode, setMarkerMode] = useState(false);
  const [draftMarker, setDraftMarker] = useState<PlanMarker | null>(null);
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

  const placeMarker = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!markerMode) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    setDraftMarker({ id: newId('marker'), x, y, assetId: '', label: '', note: '' });
    setMarkerMode(false);
  };

  const saveMarker = () => {
    if (!draftMarker) return;
    onChange({ ...plan, markers: [...plan.markers, draftMarker] });
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
                onClick={() => setMarkerMode((value) => !value)}
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
              onClick={placeMarker}
              data-testid="plan-canvas"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- Plan liegt als Data-URL vor */}
              <img src={version.url} alt={plan.title} className="w-full select-none" />
              {plan.markers.map((marker) => (
                <span
                  key={marker.id}
                  data-testid="plan-marker"
                  className="absolute -translate-x-1/2 -translate-y-full"
                  style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                  title={marker.label}
                >
                  <MapPin className="size-6 fill-primary text-primary-foreground" />
                </span>
              ))}
            </div>
          )}
        </div>
        {markerMode ? (
          <p className="text-sm text-muted-foreground">{t('plan.markerHint')}</p>
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
                <RelationSelect
                  collection="assets"
                  value={draftMarker.assetId}
                  onChange={(value) => setDraftMarker({ ...draftMarker, assetId: value })}
                />
                <Button onClick={saveMarker} data-testid="marker-save">
                  {t('action.save')}
                </Button>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
