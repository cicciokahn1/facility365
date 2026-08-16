'use client';

/** Dokumente eines Datensatzes: PDF, JPG, PNG, DOCX und XLSX. */
import { useRef } from 'react';
import { Download, FileText, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';
import { DOCUMENT_ACCEPT, documentFromFile, downloadDataUrl, isAllowedDocument } from '@/lib/media';
import { useSettings } from '@/lib/settings/provider';
import { DocumentFile } from '@/lib/types';
import { formatBytes, formatDate } from '@/lib/utils/format';

export function DocumentList({
  documents,
  onChange,
}: {
  documents: DocumentFile[];
  onChange: (
    documents: DocumentFile[],
    action: 'history.documentAdded' | 'history.documentRemoved',
  ) => void;
}) {
  const t = useT();
  const { settings } = useSettings();
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const allowed = Array.from(files).filter(isAllowedDocument);
    if (allowed.length !== files.length) toast.error(t('documents.wrongType'));
    if (allowed.length === 0) return;
    const uploaded = await Promise.all(
      allowed.map((file) => documentFromFile(file, settings.profileName || settings.companyName)),
    );
    onChange([...documents, ...uploaded], 'history.documentAdded');
  };

  return (
    <section className="flex flex-col gap-3" data-testid="document-list">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => inputRef.current?.click()} data-testid="document-upload">
          <Upload className="size-4" aria-hidden />
          {t('action.upload')}
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

      {documents.length === 0 ? (
        <EmptyState icon={FileText} titleKey="documents.empty" />
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {documents.map((document) => (
            <li key={document.id} className="flex items-center gap-3 p-3" data-testid="document-item">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-[11px] font-semibold text-accent-foreground">
                {document.type}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{document.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {formatBytes(document.size)} · {formatDate(document.uploadedAt, settings.language)}
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
                    documents.filter((entry) => entry.id !== document.id),
                    'history.documentRemoved',
                  )
                }
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
