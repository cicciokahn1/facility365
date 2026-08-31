'use client';

/**
 * Schnellmeldung nach dem Scannen eines QR-Codes.
 *
 * Liegenschaft, Gebaeude, Raum und Anlage stammen aus dem gescannten Code und
 * werden unveraendert uebernommen; erfasst werden nur Beschreibung, Priorität
 * und Fotos. Daraus entsteht ein Schaden oder ein Auftrag in den bestehenden
 * Modulen - die dortigen Formulare bleiben unveraendert.
 */
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Hammer, ImagePlus, TriangleAlert, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useActiveUser } from '@/lib/auth/scope';
import { useCollection } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { PHOTO_ACCEPT, photoFromFile } from '@/lib/media';
import { PRIORITY_OPTIONS } from '@/lib/schema';
import { Photo, Priority } from '@/lib/types';
import { today } from '@/lib/utils/format';

export interface QuickDamageTarget {
  /** Bezeichnung der gescannten Anlage oder des Gegenstands. */
  title: string;
  /** Standort in Klartext, z. B. Liegenschaft · Gebaeude · Raum. */
  location: string;
  propertyId: string;
  buildingId: string;
  roomId: string;
  assetId: string;
}

export function QuickDamageDialog({
  open,
  onOpenChange,
  target,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: QuickDamageTarget | null;
}) {
  const t = useT();
  const router = useRouter();
  const damages = useCollection('damages');
  const orders = useCollection('orders');
  const user = useActiveUser();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [photos, setPhotos] = useState<Photo[]>([]);

  /** Beim Schliessen leeren, damit nichts aus einem frueheren Scan mitkommt. */
  const changeOpen = (next: boolean) => {
    if (!next) {
      setDescription('');
      setPriority('medium');
      setPhotos([]);
    }
    onOpenChange(next);
  };

  if (!target) return null;

  const addFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const added = await Promise.all(Array.from(files).map((file) => photoFromFile(file)));
    setPhotos((current) => [...current, ...added]);
  };

  const shared = {
    title: target.title,
    description,
    priority,
    propertyId: target.propertyId,
    buildingId: target.buildingId,
    roomId: target.roomId,
    assetId: target.assetId,
    photos,
  };

  const createDamage = () => {
    if (!description.trim()) {
      toast.error(t('quickReport.needDescription'));
      return;
    }
    const damage = damages.create({
      ...shared,
      reportedBy: user?.name ?? '',
      reportedById: user?.id ?? '',
      reportedAt: today(),
    });
    toast.success(t('quickReport.damageCreated'));
    changeOpen(false);
    router.push(`/damages/${damage.id}`);
  };

  const createOrder = () => {
    if (!description.trim()) {
      toast.error(t('quickReport.needDescription'));
      return;
    }
    const order = orders.create({ ...shared, assigneeUserId: user?.id ?? '' });
    toast.success(t('quickReport.orderCreated'));
    changeOpen(false);
    router.push(`/orders/${order.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent className="max-w-lg" data-testid="quick-report">
        <DialogTitle>{t('quickReport.title')}</DialogTitle>
        <DialogDescription>{t('quickReport.hint')}</DialogDescription>

        <div className="rounded-lg border bg-muted/40 p-3" data-testid="quick-report-target">
          <p className="text-sm font-medium">{target.title}</p>
          <p className="text-xs text-muted-foreground">{target.location || '–'}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="quick-description">{t('common.description')}</Label>
          <Textarea
            id="quick-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            data-testid="quick-report-description"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t('common.priority')}</Label>
          <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
            <SelectTrigger data-testid="quick-report-priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => cameraRef.current?.click()}
            data-testid="quick-report-camera"
          >
            <Camera className="size-4" aria-hidden />
            {t('action.takePhoto')}
          </Button>
          <Button
            variant="outline"
            onClick={() => galleryRef.current?.click()}
            data-testid="quick-report-gallery"
          >
            <ImagePlus className="size-4" aria-hidden />
            {t('action.fromGallery')}
          </Button>
        </div>

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => {
            void addFiles(event.target.files);
            event.target.value = '';
          }}
        />
        <input
          ref={galleryRef}
          type="file"
          accept={PHOTO_ACCEPT}
          multiple
          className="hidden"
          onChange={(event) => {
            void addFiles(event.target.files);
            event.target.value = '';
          }}
        />

        {photos.length > 0 ? (
          <ul className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <li key={photo.id} className="relative overflow-hidden rounded-lg border">
                {/* eslint-disable-next-line @next/next/no-img-element -- Bilder liegen als Data-URL vor */}
                <img src={photo.url} alt={photo.name} className="aspect-square w-full object-cover" />
                <button
                  type="button"
                  aria-label={t('action.delete')}
                  onClick={() => setPhotos((current) => current.filter((entry) => entry.id !== photo.id))}
                  className="absolute right-1 top-1 rounded-full bg-background/90 p-1"
                >
                  <X className="size-3" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button onClick={createDamage} data-testid="quick-report-damage">
            <TriangleAlert className="size-4" aria-hidden />
            {t('quickReport.createDamage')}
          </Button>
          <Button variant="outline" onClick={createOrder} data-testid="quick-report-order">
            <Hammer className="size-4" aria-hidden />
            {t('quickReport.createOrder')}
          </Button>
          <Button variant="ghost" onClick={() => changeOpen(false)}>
            {t('action.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
