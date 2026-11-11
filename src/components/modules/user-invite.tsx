'use client';

/**
 * Benutzer einladen: Die Einladung liegt als Datensatz in `invitations`.
 * Registriert sich die Person mit dieser E-Mail, landet sie automatisch im
 * eigenen Mandanten mit der gewaehlten Rolle (Trigger handle_new_user).
 */
import { useCallback, useEffect, useState } from 'react';
import { MailPlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TranslationKey } from '@/lib/i18n/dictionary';
import { useT } from '@/lib/i18n/provider';
import { useAccess } from '@/lib/auth/scope';
import { useCollection } from '@/lib/data/store';
import { USER_ROLE_OPTIONS } from '@/lib/schema';
import { supabase } from '@/lib/supabase/client';

interface Invitation {
  email: string;
  role: TranslationKey | string;
  created_at: string;
}

/** Rollen, die per Einladung vergeben werden duerfen (kein Superadmin). */
const INVITABLE_ROLES = USER_ROLE_OPTIONS.filter(
  (option) => option.value !== 'superadmin',
);

export function UserInvite() {
  const t = useT();
  const access = useAccess();
  const { create } = useCollection('users');
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('caretaker');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Invitation[]>([]);

  const load = useCallback(async () => {
    const client = await supabase();
    if (!client) return;
    const { data } = await client
      .from('invitations')
      .select('email, role, created_at')
      .order('created_at', { ascending: false });
    if (data) setPending(data as Invitation[]);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const invite = async () => {
    const value = email.trim().toLowerCase();
    if (!value || busy) return;
    setBusy(true);
    try {
      const client = await supabase();
      if (!client) throw new Error('offline');
      const {
        data: { session },
      } = await client.auth.getSession();
      if (!session?.access_token) throw new Error('session');
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email: value, role }),
      });
      const result = (await response.json().catch(() => null)) as {
        ok?: boolean;
        mailSent?: boolean;
        error?: string;
      } | null;
      if (!response.ok || !result?.ok) {
        throw new Error(result?.error ?? `HTTP ${response.status}`);
      }
      /** Zugleich den Benutzerdatensatz anlegen, damit die Person sichtbar ist. */
      create({
        name: value.split('@')[0],
        email: value,
        role,
        status: 'active',
      } as never);
      if (result.mailSent === false) {
        toast.warning(t('user.inviteNoMail'));
      } else {
        toast.success(t('user.inviteSent'));
      }
      setEmail('');
      setOpen(false);
      void load();
    } catch (failure) {
      const detail =
        failure instanceof Error && failure.message
          ? ` (${failure.message.slice(0, 120)})`
          : '';
      toast.error(`${t('user.inviteFailed')}${detail}`);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (entry: Invitation) => {
    const client = await supabase();
    if (!client) return;
    const { error } = await client
      .from('invitations')
      .delete()
      .eq('email', entry.email);
    if (!error) {
      setPending((current) =>
        current.filter((item) => item.email !== entry.email),
      );
    }
  };

  /** Einladen duerfen nur Mandanten-Admins; andere sehen die Leiste nicht. */
  if (!access.scope.manageUsers) return null;

  return (
    <div className="mb-4 flex flex-col gap-2">
      <div>
        <Button variant="outline" className="w-fit" onClick={() => setOpen(true)}>
          <MailPlus className="size-4" aria-hidden />
          {t('user.inviteTitle')}
        </Button>
      </div>
      {pending.length > 0 && (
        <ul className="flex flex-col gap-1.5 text-sm">
          {pending.map((entry) => (
            <li
              key={entry.email}
              className="flex items-center justify-between gap-2 rounded-md border px-3 py-1.5"
            >
              <span>
                {entry.email}{' '}
                <span className="text-muted-foreground">
                  ·{' '}
                  {USER_ROLE_OPTIONS.find((o) => o.value === entry.role)
                    ? t(
                        USER_ROLE_OPTIONS.find((o) => o.value === entry.role)!
                          .labelKey,
                      )
                    : entry.role}{' '}
                  · {t('user.invitePending')}
                </span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => void remove(entry)}
                aria-label={t('action.delete')}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('user.invite')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-email">{t('auth.email')}</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="hauswart@beispiel.ch"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t('settings.role')}</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVITABLE_ROLES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('user.inviteInfo')}
            </p>
            <Button onClick={() => void invite()} disabled={busy || !email.trim()}>
              {busy ? t('user.inviting') : t('user.invite')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
