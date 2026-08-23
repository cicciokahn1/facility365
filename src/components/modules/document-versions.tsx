'use client';

/**
 * Fassungen eines Dokuments.
 *
 * Beim Hochladen einer neuen Fassung wandert die bisherige Datei in die
 * Fassungsliste; nichts wird ueberschrieben. Jede fruehere Fassung bleibt
 * abrufbar und kann wieder zur aktuellen Fassung gemacht werden.
 */
import { useRef, useState } from 'react';
import { Download, FileClock, RotateCcw, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useT } from '@/lib/i18n/provider';
import { DOCUMENT_ACCEPT, documentFromFile, downloadDataUrl, isAllowedDocument } from '@/lib/media';
import { useSettings } from '@/lib/settings/provider';
import { DocumentEntity, DocumentFile, DocumentVersion } from '@/lib/types';
import { formatBytes, formatDate, today } from '@/lib/utils/format';
import { newId } from '@/lib/utils/id';

export function DocumentVersions({
  entity,
  onChange,
}: {
  entity: DocumentEntity;
  onChange: (values: Partial<DocumentEntity>, action?: string) => void;
}) {
  const t = useT();
  const { settings } = useSettings();
  const inputRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState('');
  const versions = entity.versions ?? [];
  const author = settings.profileName || settings.companyName;
  const current = versions.length + 1;

  /** Bisherige Datei als Fassung ablegen und die neue Datei aktuell setzen. */
  const archive = (replaced: DocumentFile | undefined, versionNote = ''): DocumentVersion[] =>
    replaced
      ? [
          ...versions,
          {
            id: newId('version'),
            version: versions.length + 1,
            file: replaced,
            note: versionNote,
            replacedAt: today(),
            replacedBy: author,
          },
        ]
      : versions;

  const upload = async (files: FileList | null) => {
    const selected = files?.[0];
    if (!selected) return;
    if (!isAllowedDocument(selected)) {
      toast.error(t('documents.wrongType'));
      return;
    }
    const file = await documentFromFile(selected, author);
    onChange(
      { file, versions: archive(entity.file, note.trim()) },
      'history.documentVersion',
    );
    setNote('');
    toast.success(t('toast.saved'));
  };

  /** Eine fruehere Fassung wieder aktuell machen; die bisherige bleibt erhalten. */
  const restore = (version: DocumentVersion) => {
    onChange(
      {
        file: version.file,
        versions: [
          ...versions.filter((entry) => entry.id !== version.id),
          ...(entity.file
            ? [
                {
                  id: newId('version'),
                  version: versions.length + 1,
                  file: entity.file,
                  note: '',
                  replacedAt: today(),
                  replacedBy: author,
                },
              ]
            : []),
        ],
      },
      'history.documentRestored',
    );
    toast.success(t('toast.saved'));
  };

  return (
    <section className="flex flex-col gap-4" data-testid="document-versions">
      <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="version-note">{t('documents.versionNote')}</Label>
          <Input
            id="version-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            data-testid="version-note"
          />
        </div>
        <div className="flex items-end">
          <Button onClick={() => inputRef.current?.click()} data-testid="version-upload">
            <Upload className="size-4" aria-hidden />
            {t('documents.newVersion')}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground sm:col-span-2">{t('documents.versionsHint')}</p>
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

      {entity.file ? (
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4" data-testid="version-current">
          <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-[11px] font-semibold text-accent-foreground">
            {entity.file.type}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{entity.file.name}</span>
            <span className="block text-xs text-muted-foreground">
              {t('documents.currentVersion')} · {t('documents.version')} {current} ·{' '}
              {formatBytes(entity.file.size)}
            </span>
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('action.download')}
            onClick={() => entity.file && downloadDataUrl(entity.file.url, entity.file.name)}
          >
            <Download className="size-4" />
          </Button>
        </div>
      ) : null}

      {versions.length === 0 ? (
        <EmptyState icon={FileClock} titleKey="documents.versionsEmpty" />
      ) : (
        <ul className="flex flex-col gap-2">
          {[...versions].reverse().map((version) => (
            <li
              key={version.id}
              className="flex items-center gap-3 rounded-xl border bg-card p-4"
              data-testid="document-version"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-[11px] font-semibold">
                {version.version}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{version.file.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {formatDate(version.replacedAt, settings.language)} · {version.replacedBy}
                  {version.note ? ` · ${version.note}` : ''}
                </span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('action.download')}
                onClick={() => downloadDataUrl(version.file.url, version.file.name)}
              >
                <Download className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('documents.restore')}
                onClick={() => restore(version)}
                data-testid="version-restore"
              >
                <RotateCcw className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
