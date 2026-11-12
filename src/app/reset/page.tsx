'use client';

/**
 * Neues Passwort nach dem Zuruecksetzen.
 *
 * Der Link aus der E-Mail oeffnet eine kurzlebige Sitzung; hier wird nur das
 * Passwort gesetzt. Danach geht es zur Anmeldung zurueck.
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { passwordProblem } from '@/lib/auth/errors';
import { supabase } from '@/lib/supabase/client';
import { BRAND_LOGO_SRC } from '@/lib/branding/logo';
import { useT } from '@/lib/i18n/provider';

export default function ResetPage() {
  const t = useT();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  /**
   * Der E-Mail-Link bringt entweder ?code= (PKCE) oder #access_token mit.
   * Beides hier eintauschen, damit updateUser eine gueltige Sitzung findet.
   */
  useEffect(() => {
    let active = true;
    void (async () => {
      const client = await supabase();
      if (!client) {
        if (active) setReady(true);
        return;
      }
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const accessToken = hash.get('access_token');
      const refreshToken = hash.get('refresh_token') ?? '';
      if (code) {
        await client.auth.exchangeCodeForSession(code);
      } else if (accessToken) {
        /** Token aus dem Mail-Link explizit als Sitzung setzen. */
        await client.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      } else {
        await client.auth.getSession();
      }
      if (active) {
        const { data } = await client.auth.getSession();
        setHasSession(Boolean(data.session));
        setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setHint('');
    if (!ready) {
      setError(t('auth.errorGeneric'));
      return;
    }
    const weak = passwordProblem(password);
    if (weak) {
      setError(t(weak));
      return;
    }
    setBusy(true);
    const client = await supabase();
    const { error: updateError } = client
      ? await client.auth.updateUser({ password })
      : { error: { message: 'no client' } as never };
    setBusy(false);
    if (updateError) {
      setError(updateError.message ?? t('auth.errorGeneric'));
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
            {ready && !hasSession ? (
              <p className="text-sm text-destructive" data-testid="reset-nosession">
                {t('auth.resetLinkInvalid')}
              </p>
            ) : null}
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
            <Button type="submit" className="h-11 w-full" disabled={busy || !ready} data-testid="reset-submit">
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
