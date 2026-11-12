'use client';

/**
 * Start-Anleitung fuer Neukunden: drei Schritte bis zum laufenden Betrieb.
 * Erscheint auf dem Dashboard, solange noch keine Liegenschaft erfasst ist,
 * und laesst sich per Kreuz ausblenden (nur lokal gespeichert).
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, UserPlus, QrCode, X } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';

const DISMISS_KEY = 'facility365.onboarding.dismissed';

export function OnboardingCard() {
  const t = useT();
  const properties = useCollectionItems('properties');
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === '1');
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (dismissed || properties.length > 0) return null;

  const steps = [
    {
      href: '/properties?new=1',
      icon: Building2,
      title: t('onboarding.step1'),
      hint: t('onboarding.step1Hint'),
    },
    {
      href: '/users',
      icon: UserPlus,
      title: t('onboarding.step2'),
      hint: t('onboarding.step2Hint'),
    },
    {
      href: '/melde-qr',
      icon: QrCode,
      title: t('onboarding.step3'),
      hint: t('onboarding.step3Hint'),
    },
  ];

  return (
    <Card data-testid="onboarding-card" className="border-primary/30">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base">{t('onboarding.title')}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{t('onboarding.hint')}</p>
        </div>
        <button
          type="button"
          aria-label={t('action.close')}
          className="text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => {
            window.localStorage.setItem(DISMISS_KEY, '1');
            setDismissed(true);
          }}
        >
          <X className="size-5" aria-hidden />
        </button>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Link
              key={step.href}
              href={step.href}
              className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:border-primary/50 hover:bg-accent"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <Icon className="size-4 shrink-0 text-primary" aria-hidden />
                  {step.title}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{step.hint}</span>
              </span>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
