'use client';

/**
 * Dokumente eines Objekts.
 *
 * Die Eintraege gehoeren dem Dokumentenmodul; hier erscheinen sie gefiltert
 * nach dem Bezug, der beim Hochladen gesetzt wird. Ein hochgeladenes Dokument
 * ist damit sofort im Objekt und im Modul „Dokumente“ sichtbar.
 */
import { useRef } from 'react';
import Link from 'next/link';
import { Download, FileText, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { useCollection } from '@/lib/data/store';
import { stringField } from '@/lib/entity-values';
import { useT } from '@/lib/i18n/provider';
import {
  LINKED_DOCUMENT_ACCEPT,
  documentFromFile,
  downloadDataUrl,
  isLinkedDocument,
} from '@/lib/media';
import { useSettings } from '@/lib/settings/provider';
import { BaseEntity, CollectionKey, DocumentEntity } from '@/lib/types';
import { formatBytes, formatDate } from '@/lib/utils/format';

/** Feld im Dokument, das den Bezug herstellt. */
export type DocumentLinkField =
  | 'customerId'
  | 'propertyId'
  | 'buildingId'
  | 'roomId'
  | 'assetId'
  | 'orderId'
  | 'maintenanceId';

/** Bezugsfeld je Modul; Module ohne Eintrag zeigen nur die eigenen Dateien. */
const LINK_FIELDS: Partial<Record<CollectionKey, DocumentLinkField>> = {
  customers: 'customerId',
  properties: 'propertyId',
  buildings: 'buildingId',
  rooms: 'roomId',
  assets: 'assetId',
  orders: 'orderId',
  maintenances: 'maintenanceId',
};

/** Uebergeordnete Bezuege, die beim Hochladen mitgeschrieben werden. */
const INHERITED: DocumentLinkField[] = [
  'customerId',
  'propertyId',
  'buildingId',
  'roomId',
  'assetId',
];

export const documentLinkOf = (
  collection: CollectionKey,
  entity: BaseEntity,
): { field: DocumentLinkField; inherit: Partial<Record<DocumentLinkField, string>> } | null => {
  const field = LINK_FIELDS[collection];
  if (!field) return null;
  const inherit: Partial<Record<DocumentLinkField, string>> = {};
  for (const key of INHERITED) {
    if (key === field) continue;
    const value = stringField(entity, key);
    if (value) inherit[key] = value;
  }
  return { field, inherit };
};

export function LinkedDocuments({
  field,
  value,
  /** Weitere Bezuege, die beim Hochladen mitgesetzt werden, z. B. Liegenschaft eines Gebaeudes. */
  inherit,
}: {
  field: DocumentLinkField;
  value: string;
  inherit?: Partial<Record<DocumentLinkField, string>>;
}) {
  const t = useT();
  const { settings } = useSettings();
  const { items, create } = useCollection('documents');
  const inputRef = useRef<HTMLInputElement>(null);

  const documents = items.filter((document) => document[field] === value);

  const upload = async (files: FileList | null) => {
    const selected = files?.[0];
    if (!selected) return;
    if (!isLinkedDocument(selected)) {
      toast.error(t('documents.wrongTypeLinked'));
      return;
    }

    const user = settings.profileName || settings.companyName;
    const file = await documentFromFile(selected, user);
    const values: Partial<DocumentEntity> = {
      title: selected.name.replace(/\.[^.]+$/, ''),
      file,
      ...inherit,
      [field]: value,
    };
    create(values, user);
    toast.success(t('toast.saved'));
  };

  return (
    <section className="flex flex-col gap-3" data-testid="linked-documents">
      <h2 className="text-sm font-semibold">{t('documents.linkedTitle')}</h2>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => inputRef.current?.click()} data-testid="linked-document-upload">
          <Upload className="size-4" aria-hidden />
          {t('action.upload')}
        </Button>
        <span className="text-xs text-muted-foreground">{t('documents.linkedHint')}</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={LINKED_DOCUMENT_ACCEPT}
        className="hidden"
        data-testid="linked-document-input"
        onChange={(event) => {
          void upload(event.target.files);
          event.target.value = '';
        }}
      />

      {documents.length === 0 ? (
        <EmptyState icon={FileText} titleKey="documents.noneLinked" />
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {documents.map((document) => (
            <li key={document.id} className="flex items-center gap-3 p-3" data-testid="linked-document">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-[11px] font-semibold text-accent-foreground">
                {document.file?.type ?? '–'}
              </span>
              <span className="min-w-0 flex-1">
                <Link href={`/documents/${document.id}`} className="block truncate text-sm font-medium">
                  {document.title || document.file?.name || document.number}
                </Link>
                <span className="block text-xs text-muted-foreground">
                  {[
                    document.number,
                    document.file ? formatBytes(document.file.size) : null,
                    formatDate(document.createdAt, settings.language),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </span>
              {document.file ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('action.download')}
                  onClick={() => downloadDataUrl(document.file!.url, document.file!.name)}
                  data-testid="linked-document-download"
                >
                  <Download className="size-4" aria-hidden />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
