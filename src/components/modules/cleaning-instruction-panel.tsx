'use client';

/**
 * Arbeitsanleitung als PDF: Vorlage (Reinigungsart) waehlen und mit den
 * vorhandenen Bereichs-, Plan- und Aufgabendaten als A4/A3 erzeugen.
 */
import { useState } from 'react';
import { FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CleaningInstructionSource } from '@/lib/cleaning/use-cleaning-pdf';
import { useCleaningPdf } from '@/lib/cleaning/use-cleaning-pdf';
import { useT } from '@/lib/i18n/provider';
import { CLEANING_AREA_TYPE_OPTIONS } from '@/lib/schema';

export function CleaningInstructionPanel({
  source,
}: {
  source: Omit<CleaningInstructionSource, 'type'> & { type?: string };
}) {
  const t = useT();
  const pdf = useCleaningPdf();
  const [type, setType] = useState(source.type || 'office');
  const useOwnChecklist = type === (source.type || '');

  const generate = (format: 'a4' | 'a3') =>
    pdf.instruction(
      { ...source, type, checklist: useOwnChecklist ? source.checklist : undefined },
      format,
    );

  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-4" data-testid="cleaning-instruction">
      <div>
        <h2 className="text-base font-semibold">{t('cleaning.workInstruction')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('cleaning.workInstructionHint')}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cleaning-instruction-type">{t('cleaning.template')}</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger id="cleaning-instruction-type" className="h-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CLEANING_AREA_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {t(option.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button type="button" className="h-12" onClick={() => generate('a4')}>
          <FileText className="size-4" aria-hidden />
          {t('cleaning.workInstruction')} A4
        </Button>
        <Button type="button" variant="outline" className="h-12" onClick={() => generate('a3')}>
          <FileText className="size-4" aria-hidden />
          {t('cleaning.workInstruction')} A3
        </Button>
      </div>
    </section>
  );
}
