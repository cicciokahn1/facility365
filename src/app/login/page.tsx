'use client';

/**
 * Anmeldung und Registrierung.
 *
 * Dieselbe Adresse gilt fuer alle Hauswarte; getrennt werden die Daten ueber
 * das Konto, nicht ueber das Geraet.
 */
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth/provider';
import { BRAND_LOGO_SRC } from '@/lib/branding/logo';
import { useT } from '@/lib/i18n/provider';

type Mode = 'signIn' | 'signUp';

function LoginForm() {
  const t = useT();
  const auth = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const target = params.get('next') || '/dashboard';

  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');

  useEffect(() => {
    if (auth.user) router.replace(target);
  }, [auth.user, router, target]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setHint('');
    const message =
      mode === 'signIn'
        ? await auth.signIn(email.trim(), password)
        : await auth.signUp(email.trim(), password);
    setBusy(false);
    if (message) {
      setError(message);
      return;
    }
    if (mode === 'signUp') setHint(t('auth.checkMail'));
  };

  if (!auth.enabled) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t('auth.signIn')}</CardTitle>
          <CardDescription data-testid="auth-disabled">{t('auth.notConfigured')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="h-11 w-full" onClick={() => router.replace('/dashboard')}>
            {t('auth.continueLocal')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm" data-testid="login-card">
      <CardHeader>
        <CardTitle>{mode === 'signIn' ? t('auth.signIn') : t('auth.signUp')}</CardTitle>
        <CardDescription>{t('auth.intro')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="auth-email">{t('auth.email')}</Label>
            <Input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              className="h-11"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              data-testid="auth-email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auth-password">{t('auth.password')}</Label>
            <Input
              id="auth-password"
              type="password"
              autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
              required
              minLength={8}
              className="h-11"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              data-testid="auth-password"
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive" data-testid="auth-error">
              {error}
            </p>
          ) : null}
          {hint ? (
            <p className="text-sm text-muted-foreground" data-testid="auth-hint">
              {hint}
            </p>
          ) : null}

          <Button type="submit" className="h-11 w-full" disabled={busy} data-testid="auth-submit">
            {mode === 'signIn' ? t('auth.signIn') : t('auth.signUp')}
          </Button>
        </form>

        <Button
          variant="link"
          className="mt-2 w-full"
          onClick={() => {
            setMode(mode === 'signIn' ? 'signUp' : 'signIn');
            setError('');
            setHint('');
          }}
          data-testid="auth-switch"
        >
          {mode === 'signIn' ? t('auth.toSignUp') : t('auth.toSignIn')}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background p-4">
      {/* eslint-disable-next-line @next/next/no-img-element -- statische Marke ohne Groessenwechsel */}
      <img
        src={BRAND_LOGO_SRC}
        alt="Facility365"
        data-testid="login-logo"
        className="h-20 w-auto max-w-[240px] rounded object-contain dark:bg-white/95 dark:p-2"
      />
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
