'use client';

import { useRef } from 'react';
import { Download, FileText, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/common/empty-state';
import { EntityDetail } from '@/components/module/entity-detail';
import { DocumentVersions } from '@/components/modules/document-versions';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';
import { DOCUMENT_ACCEPT, documentFromFile, downloadDataUrl, isAllowedDocument } from '@/lib/media';
import { useSettings } from '@/lib/settings/provider';
import { DocumentFile } from '@/lib/types';
import { formatBytes, formatDate } from '@/lib/utils/format';

export function DocumentDetail({ id }: { id: string }) {
  return (
    <EntityDetail
      collection="documents"
      id={id}
      extraTabs={(document, update) => [
        {
          value: 'file',
          labelKey: 'documents.file',
          content: (
            <MainFile file={document.file} onChange={(file) => update({ file }, 'history.documentAdded')} />
          ),
        },
        {
          value: 'versions',
          labelKey: 'documents.versions',
          content: <DocumentVersions entity={document} onChange={update} />,
        },
      ]}
    />
  );
}

/** Hauptdatei des Eintrags; ersetzbar, damit Fassungen nachgefuehrt werden koennen. */
function MainFile({
  file,
  onChange,
}: {
  file?: DocumentFile;
  onChange: (file: DocumentFile) => void;
}) {
  const t = useT();
  const { settings } = useSettings();
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (files: FileList | null) => {
    const selected = files?.[0];
    if (!selected) return;
    if (!isAllowedDocument(selected)) {
      toast.error(t('documents.wrongType'));
      return;
    }
    onChange(await documentFromFile(selected, settings.profileName || settings.companyName));
    toast.success(t('toast.saved'));
  };

  return (
    <section className="flex flex-col gap-3">
      <div>
        <Button variant="outline" onClick={() => inputRef.current?.click()} data-testid="main-file-upload">
          <Upload className="size-4" aria-hidden />
          {file ? t('action.replace') : t('action.upload')}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={DOCUMENT_ACCEPT}
        className="hidden"
        onChange={(event) => {
          void upload(event.target.files);
          event.target.value = '';
        }}
      />
      {file ? (
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-[11px] font-semibold text-accent-foreground">
            {file.type}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{file.name}</span>
            <span className="block text-xs text-muted-foreground">
              {formatBytes(file.size)} · {formatDate(file.uploadedAt, settings.language)}
            </span>
          </span>
          <Button variant="ghost" size="icon" aria-label={t('action.download')} onClick={() => downloadDataUrl(file.url, file.name)}>
            <Download className="size-4" />
          </Button>
        </div>
      ) : (
        <EmptyState icon={FileText} titleKey="documents.empty" textKey="documents.allowed" />
      )}
    </section>
  );
}
