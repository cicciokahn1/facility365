'use client';

/**
 * Fotos eines Datensatzes.
 *
 * Aufnehmen und Auswaehlen sind getrennte Wege: die Kamera oeffnet sich direkt,
 * die Galerie erlaubt mehrere Bilder auf einmal.
 */
import { useRef, useState } from 'react';
import { Camera, ImagePlus, RefreshCcw, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useT } from '@/lib/i18n/provider';
import { isAllowedPhoto, isWithinUploadLimit, PHOTO_ACCEPT, photoFromFile } from '@/lib/media';
import { Photo } from '@/lib/types';

export function PhotoGallery({
  photos,
  onChange,
}: {
  photos: Photo[];
  onChange: (photos: Photo[], action: 'history.photoAdded' | 'history.photoRemoved') => void;
}) {
  const t = useT();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [replaceId, setReplaceId] = useState<string>('');
  const [preview, setPreview] = useState<Photo | null>(null);

  const addFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const allowed = Array.from(files).filter((file) => isAllowedPhoto(file) && isWithinUploadLimit(file));
    if (allowed.length !== files.length) {
      toast.error(t('upload.invalidPhoto'));
      return;
    }
    const added = await Promise.all(allowed.map((file) => photoFromFile(file)));
    onChange([...photos, ...added], 'history.photoAdded');
  };

  const replaceFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !replaceId) return;
    if (!isAllowedPhoto(file) || !isWithinUploadLimit(file)) {
      toast.error(t('upload.invalidPhoto'));
      return;
    }
    const photo = await photoFromFile(file);
    onChange(
      photos.map((entry) => (entry.id === replaceId ? { ...photo, id: entry.id } : entry)),
      'history.photoAdded',
    );
    setReplaceId('');
    toast.success(t('toast.saved'));
  };

  const remove = (id: string) => {
    onChange(
      photos.filter((photo) => photo.id !== id),
      'history.photoRemoved',
    );
    setPreview(null);
  };

  return (
    <section className="flex flex-col gap-3" data-testid="photo-gallery">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => cameraRef.current?.click()} data-testid="photo-camera">
          <Camera className="size-4" aria-hidden />
          {t('action.takePhoto')}
        </Button>
        <Button variant="outline" onClick={() => galleryRef.current?.click()} data-testid="photo-gallery-pick">
          <ImagePlus className="size-4" aria-hidden />
          {t('action.fromGallery')}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{t('photos.hint')}</p>

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
      <input
        ref={replaceRef}
        type="file"
        accept={PHOTO_ACCEPT}
        className="hidden"
        onChange={(event) => {
          void replaceFile(event.target.files);
          event.target.value = '';
        }}
      />

      {photos.length === 0 ? (
        <EmptyState icon={Camera} titleKey="photos.empty" />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <li key={photo.id} className="group relative overflow-hidden rounded-xl border bg-card">
              <button
                type="button"
                onClick={() => setPreview(photo)}
                className="block aspect-square w-full"
                data-testid="photo-item"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- Bilder liegen als Data-URL vor */}
                <img src={photo.url} alt={photo.name} className="size-full object-cover" />
              </button>
              <div className="absolute right-1 top-1 flex gap-1">
                <Button
                  size="icon"
                  variant="secondary"
                  className="size-8"
                  aria-label={t('action.replace')}
                  onClick={() => {
                    setReplaceId(photo.id);
                    replaceRef.current?.click();
                  }}
                >
                  <RefreshCcw className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  className="size-8"
                  aria-label={t('action.delete')}
                  data-testid="photo-delete"
                  onClick={() => remove(photo.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={preview !== null} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-3xl p-2" showCloseButton={false}>
          <DialogTitle className="sr-only">{preview?.name ?? ''}</DialogTitle>
          {preview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- Bilder liegen als Data-URL vor */}
              <img
                src={preview.url}
                alt={preview.name}
                className="max-h-[80dvh] w-full rounded-lg object-contain"
              />
              <Button
                size="icon"
                variant="secondary"
                className="absolute right-2 top-2"
                aria-label={t('action.close')}
                onClick={() => setPreview(null)}
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
