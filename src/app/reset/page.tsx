'use client';

/**
 * Neues Passwort nach dem Zuruecksetzen.
 *
 * Der Link aus der E-Mail oeffnet eine kurzlebige Sitzung; hier wird nur das
 * Passwort gesetzt. Danach geht es zur Anmeldung zurueck.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { passwordProblem } from '@/lib/auth/errors';
import { useAuth } from '@/lib/auth/provider';
import { BRAND_LOGO_SRC } from '@/lib/branding/logo';
import { useT } from '@/lib/i18n/provider';

export default function ResetPage() {
  const t = useT();
  const auth = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setHint('');
    const weak = passwordProblem(password);
    if (weak) {
      setError(t(weak));
      return;
    }
    setBusy(true);
    const message = await auth.updatePassword(password);
    setBusy(false);
    if (message) {
      setError(t(message));
      return;
    }
    setHint(t('auth.passwordSaved'));
    setPassword('');
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background p-4">
      {/* eslint-disable-next-line @next/next/no-img-element -- statische Marke ohne Groessenwechsel */}
      <img
        src={BRAND_LOGO_SRC}
        alt="Facility365"
        className="h-20 w-auto max-w-[240px] rounded object-contain dark:bg-white/95 dark:p-2"
      />
      <Card className="w-full max-w-sm" data-testid="reset-card">
        <CardHeader>
          <CardTitle>{t('auth.resetTitle')}</CardTitle>
          <CardDescription>{t('auth.passwordRule')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="reset-password">{t('auth.newPassword')}</Label>
              <Input
                id="reset-password"
                type="password"
                autoComplete="new-password"
                required
                className="h-11"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                data-testid="reset-password"
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive" data-testid="reset-error">
                {error}
              </p>
            ) : null}
            {hint ? (
              <p className="text-sm text-muted-foreground" data-testid="reset-hint">
                {hint}
              </p>
            ) : null}
            <Button type="submit" className="h-11 w-full" disabled={busy} data-testid="reset-submit">
              {t('action.save')}
            </Button>
          </form>
          <Button
            variant="link"
            className="mt-2 w-full"
            onClick={() => router.replace('/login')}
            data-testid="reset-back"
          >
            {t('auth.toSignIn')}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
