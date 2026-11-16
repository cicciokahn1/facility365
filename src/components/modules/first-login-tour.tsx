'use client';

/**
 * Start-Tour fuer Neukunden: drei Hinweisblasen beim ersten Login.
 * Zeigt in Kuerze, wo man anfaengt – einmal gesehen, bleibt sie weg
 * (nur lokal gespeichert) und ist jederzeit ueber die Hilfe wieder da.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, PlayCircle, QrCode, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';

const TOUR_KEY = 'facility365.tour.seen';

export function FirstLoginTour() {
  const t = useT();
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStep(window.localStorage.getItem(TOUR_KEY) === '1' ? null : 0);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  if (step === null) return null;

  const steps = [
    { icon: Building2, title: t('tour.step1Title'), text: t('tour.step1Text'), href: '/properties?new=1' },
    { icon: QrCode, title: t('tour.step2Title'), text: t('tour.step2Text'), href: '/melde-qr' },
    { icon: PlayCircle, title: t('tour.step3Title'), text: t('tour.step3Text'), href: '/help' },
  ];
  const current = steps[step];
  const Icon = current.icon;
  const last = step === steps.length - 1;

  const done = () => {
    window.localStorage.setItem(TOUR_KEY, '1');
    setStep(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" data-testid="first-login-tour">
      <div className="relative w-full max-w-sm rounded-2xl border bg-card p-6 shadow-xl">
        <button
          type="button"
          aria-label={t('action.close')}
          className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground"
          onClick={done}
        >
          <X className="size-5" aria-hidden />
        </button>
        <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-primary/10">
          <Icon className="size-5 text-primary" aria-hidden />
        </div>
        <h2 className="text-base font-semibold">{current.title}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{current.text}</p>
        <div className="mt-5 flex items-center justify-between gap-2">
          <span className="flex gap-1.5">
            {steps.map((s, index) => (
              <span
                key={s.title}
                className={`size-2 rounded-full ${index === step ? 'bg-primary' : 'bg-muted-foreground/30'}`}
              />
            ))}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild onClick={done}>
              <Link href={current.href}>{t('tour.open')}</Link>
            </Button>
            <Button size="sm" onClick={last ? done : () => setStep(step + 1)}>
              {last ? t('tour.done') : t('tour.next')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
