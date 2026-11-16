'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';

export function LegalBackButton() {
  const router = useRouter();
  const t = useT();

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      data-testid="legal-back"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push('/');
        }
      }}
    >
      <ArrowLeft className="size-4" aria-hidden />
      {t('action.back')}
    </Button>
  );
}
