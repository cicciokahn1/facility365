'use client';

/** Laborbericht einer Legionellenkontrolle; ausschliesslich PDF. */
import { useRef } from 'react';
import { Download, FileText, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';
import { documentFromFile, downloadDataUrl, isPdf } from '@/lib/media';
import { useSettings } from '@/lib/settings/provider';
import { DocumentFile } from '@/lib/types';
import { formatBytes, formatDate } from '@/lib/utils/format';

export function LegionellaLabReport({
  report,
  onChange,
}: {
  report?: DocumentFile;
  onChange: (report: DocumentFile | undefined) => void;
}) {
  const t = useT();
  const { settings } = useSettings();
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!isPdf(file.type, file.name)) {
      toast.error(t('legionella.pdfOnly'));
      return;
    }
    const uploaded = await documentFromFile(file, settings.profileName || settings.companyName);
    onChange(uploaded);
  };

  return (
    <section className="flex flex-col gap-3" data-testid="legionella-lab">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => inputRef.current?.click()} data-testid="legionella-lab-upload">
          <Upload className="size-4" aria-hidden />
          {t('action.upload')}
        </Button>
        <p className="text-xs text-muted-foreground">{t('legionella.pdfOnly')}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(event) => {
          void upload(event.target.files);
          event.target.value = '';
        }}
      />

      {report ? (
        <div className="flex items-center gap-3 rounded-xl border bg-card p-3" data-testid="legionella-lab-file">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-[11px] font-semibold text-accent-foreground">
            PDF
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{report.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(report.uploadedAt, settings.language)} · {formatBytes(report.size)}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            aria-label={t('action.download')}
            data-testid="legionella-lab-download"
            onClick={() => downloadDataUrl(report.url, report.name)}
          >
            <Download className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label={t('action.delete')}
            onClick={() => onChange(undefined)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ) : (
        <EmptyState icon={FileText} titleKey="documents.empty" />
      )}
    </section>
  );
}
