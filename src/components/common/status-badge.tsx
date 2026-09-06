'use client';

/** Statuszeichen mit einheitlichen Farben. */
import { Badge } from '@/components/ui/badge';
import type { TranslationKey } from '@/lib/i18n/dictionary';
import { useT } from '@/lib/i18n/provider';
import { STATUS_TONES, SelectOption, Tone } from '@/lib/schema';
import { cn } from '@/lib/utils';

const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground border-transparent',
  brand: 'bg-brand-soft text-accent-foreground border-transparent',
  success: 'bg-success/15 text-success border-transparent',
  warning: 'bg-warning/20 text-warning-foreground border-transparent',
  danger: 'bg-destructive/15 text-destructive border-transparent',
  info: 'bg-info/15 text-info border-transparent',
};

export function StatusBadge({
  value,
  options,
  className,
}: {
  value: string;
  options: SelectOption[];
  className?: string;
}) {
  const t = useT();
  const option = options.find((entry) => entry.value === value);
  if (!option) return null;
  const tone = option.tone ?? STATUS_TONES[value] ?? 'neutral';
  return (
    <Badge data-testid={`status-${value}`} className={cn(TONE_CLASSES[tone], className)}>
      {t(option.labelKey)}
    </Badge>
  );
}

export function ToneBadge({
  labelKey,
  tone = 'neutral',
  className,
}: {
  labelKey: TranslationKey;
  tone?: Tone;
  className?: string;
}) {
  const t = useT();
  return <Badge className={cn(TONE_CLASSES[tone], className)}>{t(labelKey)}</Badge>;
}
