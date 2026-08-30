'use client';

/**
 * Benutzerkonto.
 *
 * Anmeldung, Passwort, E-Mail-Bestaetigung, Organisation, Sicherung,
 * Datenuebernahme und Datenexport an einem Ort. Ohne Konto-Dienst laeuft die
 * Anwendung unveraendert lokal weiter; die Karten sagen das deutlich.
 */
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { passwordProblem } from '@/lib/auth/errors';
import { useAuth } from '@/lib/auth/provider';
import {
  Snapshot,
  deviceSnapshot,
  downloadSnapshot,
  latestSnapshot,
  mergeSnapshot,
  readSnapshotFile,
  snapshotOf,
  snapshotSize,
  storeSnapshot,
} from '@/lib/data/backup';
import { useCompleteStore, useReloadData, useRepository } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';
import { formatDateTime } from '@/lib/utils/format';

export default function AccountPage() {
  const t = useT();
  const auth = useAuth();
  const { settings } = useSettings();
  const store = useCompleteStore();
  const repository = useRepository();
  const reload = useReloadData();

  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<string>('');
  const [deviceCount, setDeviceCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void latestSnapshot().then((entry) => setLast(entry?.at ?? ''));
  }, []);

  useEffect(() => {
    /** Nur anbieten, wenn auf dem Geraet ueberhaupt etwas liegt. */
    if (!auth.enabled) return;
    void deviceSnapshot().then((snapshot) => setDeviceCount(snapshotSize(snapshot)));
  }, [auth.enabled]);

  const changePassword = async () => {
    const weak = passwordProblem(password);
    if (weak) {
      toast.error(t(weak));
      return;
    }
    setBusy(true);
    const message = await auth.updatePassword(password);
    setBusy(false);
    if (message) {
      toast.error(t(message));
      return;
    }
    setPassword('');
    toast.success(t('auth.passwordSaved'));
  };

  const takeSnapshot = async () => {
    const snapshot = snapshotOf(store);
    const stored = await storeSnapshot(snapshot);
    if (stored) setLast(new Date().toISOString());
    downloadSnapshot(snapshot);
    toast.success(t('backup.created'));
  };

  const restore = async (snapshot: Snapshot) => {
    setBusy(true);
    const added = await mergeSnapshot(snapshot, repository);
    setBusy(false);
    reload();
    toast.success(`${t('backup.restored')} (${added})`);
  };

  const takeOverDevice = async () => {
    const snapshot = await deviceSnapshot();
    if (snapshotSize(snapshot) === 0) {
      toast.info(t('migrate.none'));
      return;
    }
    setBusy(true);
    const added = await mergeSnapshot(snapshot, repository);
    setBusy(false);
    setDeviceCount(0);
    reload();
    toast.success(`${t('migrate.done')} (${added})`);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('account.title')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{t('account.intro')}</p>
          {auth.enabled && auth.user ? (
            <>
              <p className="text-sm" data-testid="account-email">
                {t('auth.email')}: {auth.user.email}
              </p>
              <p className="text-sm" data-testid="account-verified">
                {auth.user.verified ? t('account.verified') : t('account.notVerified')}
              </p>
              {auth.user.verified ? null : (
                <Button
                  variant="outline"
                  className="self-start"
                  data-testid="account-resend"
                  onClick={async () => {
                    const message = await auth.resendVerification(auth.user?.email ?? '');
                    if (message) toast.error(t(message));
                    else toast.success(t('auth.checkMail'));
                  }}
                >
                  {t('account.resend')}
                </Button>
              )}
              <p className="text-sm" data-testid="account-tenant">
                {t('account.organization')}: {auth.membership?.tenantId || '—'}
              </p>
              <p className="text-sm" data-testid="account-role">
                {t('account.role')}: {auth.membership?.role || '—'} · {t('account.status')}:{' '}
                {auth.membership?.status || '—'}
              </p>
              <Button
                variant="outline"
                className="self-start"
                data-testid="account-signout"
                onClick={() => void auth.signOut()}
              >
                {t('auth.signOut')}
              </Button>
            </>
          ) : (
            <p className="text-sm" data-testid="account-local">
              {t('account.localHint')}
            </p>
          )}
        </CardContent>
      </Card>

      {auth.enabled && auth.user ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('account.changePassword')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="account-password">{t('auth.newPassword')}</Label>
              <Input
                id="account-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                data-testid="account-password"
              />
              <p className="text-xs text-muted-foreground">{t('auth.passwordRule')}</p>
            </div>
            <Button
              className="self-start"
              disabled={busy || password === ''}
              onClick={() => void changePassword()}
              data-testid="account-password-save"
            >
              {t('action.save')}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('account.twoFactor')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">{t('account.twoFactorHint')}</p>
          <p className="text-sm text-muted-foreground">{t('account.entraHint')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('backup.title')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">{t('backup.intro')}</p>
          <p className="text-sm" data-testid="backup-last">
            {t('backup.last')}: {last ? formatDateTime(last, settings.language) : t('backup.none')}
          </p>
          <Button disabled={busy} onClick={() => void takeSnapshot()} data-testid="backup-create">
            {t('backup.create')}
          </Button>
          <p className="text-sm text-muted-foreground">{t('backup.restoreHint')}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={busy || last === ''}
              data-testid="backup-restore-last"
              onClick={async () => {
                const entry = await latestSnapshot();
                if (!entry) {
                  toast.info(t('backup.none'));
                  return;
                }
                await restore(entry.snapshot);
              }}
            >
              {t('backup.restore')}
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              data-testid="backup-restore-file"
            >
              {t('backup.restoreFile')}
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            data-testid="backup-file"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (!file) return;
              try {
                await restore(await readSnapshotFile(file));
              } catch {
                toast.error(t('auth.errorGeneric'));
              }
            }}
          />
        </CardContent>
      </Card>

      {auth.enabled && deviceCount > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('migrate.title')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">{t('migrate.intro')}</p>
            <p className="text-sm" data-testid="migrate-count">
              {deviceCount}
            </p>
            <Button
              disabled={busy}
              onClick={() => void takeOverDevice()}
              data-testid="migrate-run"
            >
              {t('migrate.run')}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('account.export')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">{t('account.exportHint')}</p>
          <Button
            variant="outline"
            data-testid="account-export"
            onClick={() => downloadSnapshot(snapshotOf(store))}
          >
            {t('account.export')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
