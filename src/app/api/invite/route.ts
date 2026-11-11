/**
 * Benutzer-Einladung mit echter E-Mail.
 *
 * POST /api/invite  { email, role }  - Authorization: Bearer <session-token>
 *
 * Nur superadmin/orgadmin duerfen einladen. Die Route legt die Einladung in
 * public.invitations ab (handle_new_user ordnet den Mandanten beim Beitritt
 * zu) und verschickt die Supabase-Einladungs-Mail ueber den Service-Schluessel.
 */
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const INVITABLE = new Set([
  'orgadmin',
  'sitemanager',
  'caretaker',
  'cleaner',
  'reporter',
  'external',
  'reader',
]);

const MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!url || !anonKey || !serviceKey) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  const token = (request.headers.get('authorization') ?? '').replace(
    /^Bearer\s+/i,
    '',
  );
  if (!token) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    email?: string;
    role?: string;
  } | null;
  const email = (body?.email ?? '').trim().toLowerCase();
  const role = body?.role ?? '';
  if (!MAIL.test(email) || !INVITABLE.has(role)) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  /** Wer ruft an? Mitgliedschaft und Rolle ueber den Server-Schluessel pruefen. */
  const anon = createClient(url, anonKey);
  const {
    data: { user },
    error: authError,
  } = await anon.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const service = createClient(url, serviceKey);
  const { data: membership } = await service
    .from('memberships')
    .select('tenant_id, role')
    .eq('auth_user_id', user.id)
    .single();
  if (
    !membership ||
    !['superadmin', 'orgadmin'].includes(membership.role)
  ) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  /** Einladung ersetzen, dann Mail verschicken. */
  await service.from('invitations').delete().eq('email', email);
  const { error: inviteRowError } = await service
    .from('invitations')
    .insert({ tenant_id: membership.tenant_id, email, role });
  if (inviteRowError) {
    return NextResponse.json({ error: inviteRowError.message }, { status: 500 });
  }

  const origin = new URL(request.url).origin;

  /**
   * Konto anlegen: Der Trigger handle_new_user ordnet die Person dank der
   * Einladungszeile oben sofort dem Mandanten zu. Danach bekommt sie eine
   * Passwort-Mail; der Link oeffnet /reset, dort setzt sie ihr Passwort.
   */
  const tempPassword = `Fx${crypto.randomUUID()}aA!`;
  const { data: created, error: createError } =
    await service.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { invited_role: role },
    });

  if (createError) {
    if (!createError.message.toLowerCase().includes('already')) {
      await service.from('invitations').delete().eq('email', email);
      return NextResponse.json(
        { error: createError.message },
        { status: 500 },
      );
    }
    /** Konto existiert schon: Mitgliedschaft direkt setzen. */
    const { data: list } = await service.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    const existing = list?.users.find(
      (candidate) => candidate.email?.toLowerCase() === email,
    );
    if (existing) {
      await service
        .from('invitations')
        .delete()
        .eq('email', email);
      await service.from('memberships').upsert(
        {
          tenant_id: membership.tenant_id,
          auth_user_id: existing.id,
          role,
          status: 'active',
        },
        { onConflict: 'auth_user_id' },
      );
    }
  } else if (!created.user) {
    return NextResponse.json({ error: 'no_user' }, { status: 500 });
  }

  const { error: mailError } = await anon.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset`,
  });
  /** Mail-Probleme (z. B. Rate-Limit) sind kein Abbruch: Konto und
      Mitgliedschaft stehen; die Person kann an der Anmeldung
      «Passwort vergessen» nutzen. */
  return NextResponse.json({
    ok: true,
    mailSent: !mailError,
    mailError: mailError?.message ?? null,
  });
}
