'use client';

/**
 * Dokumente einer Anlage nach Kategorien.
 *
 * Serviceberichte externer Techniker werden beim Hochladen der gewaehlten
 * Wartung zugeordnet: der Eintrag erscheint dadurch sowohl bei der Anlage als
 * auch bei der Wartung, ohne die Datei zweimal zu speichern.
 */
import { useRef, useState } from 'react';
import { Download, FileText, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCollection, useCollectionItems } from '@/lib/data/store';
import { TranslationKey } from '@/lib/i18n/dictionary';
import { useT } from '@/lib/i18n/provider';
import { DOCUMENT_ACCEPT, documentFromFile, downloadDataUrl, isAllowedDocument } from '@/lib/media';
import { useSettings } from '@/lib/settings/provider';
import { Asset, DocumentFile } from '@/lib/types';
import { formatBytes, formatDate } from '@/lib/utils/format';

export const ASSET_DOCUMENT_CATEGORIES = [
  'serviceReport',
  'maintenanceReport',
  'testProtocol',
  'invoice',
  'warranty',
  'manual',
  'other',
] as const;

export type AssetDocumentCategory = (typeof ASSET_DOCUMENT_CATEGORIES)[number];

const categoryKey = (category: string): TranslationKey =>
  `documents.category.${
    (ASSET_DOCUMENT_CATEGORIES as readonly string[]).includes(category) ? category : 'other'
  }` as TranslationKey;

export function AssetDocuments({
  asset,
  onChange,
}: {
  asset: Asset;
  onChange: (
    documents: DocumentFile[],
    action: 'history.documentAdded' | 'history.documentRemoved',
  ) => void;
}) {
  const t = useT();
  const { settings } = useSettings();
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<AssetDocumentCategory>('serviceReport');
  const [maintenanceId, setMaintenanceId] = useState('');
  const maintenances = useCollectionItems('maintenances').filter(
    (maintenance) => maintenance.assetId === asset.id,
  );
  const maintenanceApi = useCollection('maintenances');

  const addFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const allowed = Array.from(files).filter(isAllowedDocument);
    if (allowed.length !== files.length) toast.error(t('documents.wrongType'));
    if (allowed.length === 0) return;

    const target = maintenances.find((maintenance) => maintenance.id === maintenanceId);
    const uploaded = await Promise.all(
      allowed.map(async (file) => {
        const document = await documentFromFile(
          file,
          settings.profileName || settings.companyName,
        );
        return {
          ...document,
          category,
          linkedModule: target ? ('maintenances' as const) : undefined,
          linkedId: target?.id,
          linkedLabel: target ? `${target.number} · ${target.title}` : undefined,
        };
      }),
    );

    onChange([...asset.documents, ...uploaded], 'history.documentAdded');

    if (target) {
      maintenanceApi.update(
        target.id,
        { documents: [...target.documents, ...uploaded] },
        'history.documentAdded',
        settings.profileName || settings.companyName,
      );
      toast.success(t('service.assigned'));
    }
  };

  const grouped = ASSET_DOCUMENT_CATEGORIES.map((key) => ({
    key,
    documents: asset.documents.filter(
      (document) => (document.category ?? 'other') === key ||
        (key === 'other' &&
          !(ASSET_DOCUMENT_CATEGORIES as readonly string[]).includes(document.category ?? '')),
    ),
  })).filter((group) => group.documents.length > 0);

  return (
    <section className="flex flex-col gap-4" data-testid="asset-documents">
      <div className="rounded-xl border bg-card p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 keep-cols">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="asset-doc-category">{t('documents.category')}</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as AssetDocumentCategory)}
            >
              <SelectTrigger id="asset-doc-category" data-testid="asset-doc-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSET_DOCUMENT_CATEGORIES.map((key) => (
                  <SelectItem key={key} value={key}>
                    {t(categoryKey(key))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="asset-doc-maintenance">{t('service.assignTo')}</Label>
            <Select value={maintenanceId || 'none'} onValueChange={(value) => setMaintenanceId(value === 'none' ? '' : value)}>
              <SelectTrigger id="asset-doc-maintenance" data-testid="asset-doc-maintenance">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">–</SelectItem>
                {maintenances.map((maintenance) => (
                  <SelectItem key={maintenance.id} value={maintenance.id}>
                    {maintenance.number} · {maintenance.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {maintenances.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t('service.noMaintenance')}</p>
            ) : null}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => inputRef.current?.click()}
            data-testid="asset-doc-upload"
          >
            <Upload className="size-4" aria-hidden />
            {t('service.addReport')}
          </Button>
          <p className="text-xs text-muted-foreground">{t('documents.allowed')}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={DOCUMENT_ACCEPT}
          className="hidden"
          onChange={(event) => {
            void addFiles(event.target.files);
            event.target.value = '';
          }}
        />
      </div>

      {grouped.length === 0 ? (
        <EmptyState icon={FileText} titleKey="documents.empty" />
      ) : (
        grouped.map((group) => (
          <div key={group.key} className="flex flex-col gap-2" data-testid={`docs-${group.key}`}>
            <h3 className="text-sm font-semibold">{t(categoryKey(group.key))}</h3>
            <ul className="divide-y rounded-xl border bg-card">
              {group.documents.map((document) => (
                <li key={document.id} className="flex items-center gap-3 p-3" data-testid="document-item">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-[11px] font-semibold text-accent-foreground">
                    {document.type}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{document.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {formatBytes(document.size)} ·{' '}
                      {formatDate(document.uploadedAt, settings.language)}
                      {document.linkedLabel ? ` · ${document.linkedLabel}` : ''}
                    </span>
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={t('action.download')}
                    onClick={() => downloadDataUrl(document.url, document.name)}
                  >
                    <Download className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={t('action.delete')}
                    data-testid="document-delete"
                    onClick={() =>
                      onChange(
                        asset.documents.filter((entry) => entry.id !== document.id),
                        'history.documentRemoved',
                      )
                    }
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}
