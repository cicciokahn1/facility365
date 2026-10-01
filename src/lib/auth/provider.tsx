'use client';

/**
 * Anmeldung von Facility365.
 *
 * Die Sitzung kommt von Supabase Auth. Ohne hinterlegtes Projekt laeuft die
 * Anwendung lokal weiter; dann meldet `enabled` false und die Oberflaeche
 * verlangt keine Anmeldung.
 *
 * Die Anmeldung ist erst verbindlich, wenn NEXT_PUBLIC_AUTH_REQUIRED=true
 * gesetzt ist. Bis dahin bleibt sie eingebaut, wird aber nicht erzwungen.
 *
 * Neben der Sitzung liefert der Anbieter die Mitgliedschaft: welcher Mandant
 * (Organisation) und welche Rolle in der Datenbank hinterlegt sind. Massgeblich
 * bleibt die Datenbank - die Oberflaeche zeigt nur, was dort erlaubt ist.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { authMessage, AuthMessage } from '@/lib/auth/errors';
import { isSupabaseConfigured, isSupabaseReachable, supabase } from '@/lib/supabase/client';

export const AUTH_REQUIRED = process.env.NEXT_PUBLIC_AUTH_REQUIRED === 'true';

export interface AuthUser {
  id: string;
  email: string;
  /** E-Mail bestaetigt; unbestaetigte Konten sehen einen Hinweis. */
  verified: boolean;
}

export interface Membership {
  tenantId: string;
  role: string;
  status: string;
}

export interface AuthApi {
  /** Anmeldung ist nur mit hinterlegtem Supabase-Projekt aktiv. */
  enabled: boolean;
  /** Sitzung wurde geprueft; vorher zeigt die Oberflaeche nichts Endgueltiges. */
  ready: boolean;
  user: AuthUser | null;
  /** Mandant und Rolle aus der Datenbank; null, solange nichts geladen ist. */
  membership: Membership | null;
  /** Die Mitgliedschaftsabfrage ist abgeschlossen. */
  membershipReady: boolean;
  /** Die Mitgliedschaft konnte nicht gelesen werden (Datenbank/Regeln). */
  membershipError: boolean;
  signIn: (email: string, password: string) => Promise<AuthMessage | null>;
  signInWithGitHub: (redirectTo: string) => Promise<AuthMessage | null>;
  signUp: (email: string, password: string) => Promise<AuthMessage | null>;
  signOut: () => Promise<void>;
  /** Verschickt den Link zum Zuruecksetzen des Kennworts. */
  requestReset: (email: string) => Promise<AuthMessage | null>;
  /** Setzt das Kennwort der laufenden Sitzung neu. */
  updatePassword: (password: string) => Promise<AuthMessage | null>;
  /** Schickt die Bestaetigungsmail erneut. */
  resendVerification: (email: string) => Promise<AuthMessage | null>;
}

const AuthContext = createContext<AuthApi | null>(null);

interface MembershipRow {
  tenant_id: string;
  role: string;
  status: string;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = AUTH_REQUIRED && isSupabaseConfigured();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [membershipReady, setMembershipReady] = useState(!configured);
  const [membershipError, setMembershipError] = useState(false);
  const [ready, setReady] = useState(!configured);
  /** Unerreichbares Projekt: die Anwendung bleibt bedienbar, aber lokal. */
  const [reachable, setReachable] = useState(configured);
  const enabled = configured && reachable;

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | null = null;

    const init = async () => {
      const client = await supabase();
      if (!client) {
        if (active) {
          setReachable(false);
          setReady(true);
        }
        return;
      }
      if (!active) return;
      if (!(await isSupabaseReachable())) {
        if (!active) return;
        setReachable(false);
        setReady(true);
        return;
      }
      const { data } = await client.auth.getSession();
      if (!active) return;
      const current = data.session?.user;
      setMembership(null);
      setMembershipReady(!current);
      setUser(
        current
          ? {
              id: current.id,
              email: current.email ?? '',
              verified: Boolean(current.email_confirmed_at),
            }
          : null,
      );
      setReady(true);
    };

    /**
     * Der Sitzungswechsel meldet nur den Benutzer. Fertig ist die Pruefung erst,
     * wenn auch die Erreichbarkeit feststeht - sonst schickt die Oberflaeche
     * zur Anmeldung, obwohl gar kein Dienst antwortet.
     */
    const listen = async () => {
      const client = await supabase();
      if (!client || !active) return;
      const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
        const next = session?.user;
        setMembership(null);
        setMembershipReady(!next);
        setUser(
          next
            ? { id: next.id, email: next.email ?? '', verified: Boolean(next.email_confirmed_at) }
            : null,
        );
      });
      unsubscribe = () => listener.subscription.unsubscribe();
      if (!active) unsubscribe();
    };

    void init();
    void listen();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  /** Mitgliedschaft nachladen, sobald eine Sitzung besteht. */
  useEffect(() => {
    let active = true;
    const load = async () => {
      const client = await supabase();
      if (!client || !user) {
        setMembershipReady(true);
        return;
      }
      let row: MembershipRow | null = null;
      const rpc = await client.rpc('my_membership');
      if (!rpc.error) {
        row = ((rpc.data as MembershipRow[] | null) ?? [])[0] ?? null;
      } else {
        const fallback = await client
          .from('memberships')
          .select('tenant_id, role, status')
          .eq('auth_user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1);
        if (!active) return;
        if (fallback.error) {
          setMembershipError(true);
          setMembershipReady(true);
          return;
        }
        row = ((fallback.data as MembershipRow[] | null) ?? [])[0] ?? null;
      }
      if (!active) return;
      setMembershipError(false);
      setMembership(
        row ? { tenantId: row.tenant_id, role: row.role, status: row.status } : null,
      );
      setMembershipReady(true);
    };
    void load();
    return () => {
      active = false;
    };
  }, [user]);

  const signIn = useCallback(async (email: string, password: string) => {
    const client = await supabase();
    if (!client) return 'auth.errorGeneric' as AuthMessage;
    const { error } = await client.auth.signInWithPassword({ email, password });
    return error ? authMessage(error) : null;
  }, []);

  const signInWithGitHub = useCallback(async (redirectTo: string) => {
    const client = await supabase();
    if (!client) return 'auth.errorGeneric' as AuthMessage;
    const { error } = await client.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo },
    });
    return error ? authMessage(error) : null;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const client = await supabase();
    if (!client) return 'auth.errorGeneric' as AuthMessage;
    const { error } = await client.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });
    return error ? authMessage(error) : null;
  }, []);

  const signOut = useCallback(async () => {
    const client = await supabase();
    if (!client) return;
    await client.auth.signOut();
    setUser(null);
    setMembership(null);
    setMembershipReady(true);
  }, []);

  const requestReset = useCallback(async (email: string) => {
    const client = await supabase();
    if (!client) return 'auth.errorGeneric' as AuthMessage;
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset`,
    });
    return error ? authMessage(error) : null;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const client = await supabase();
    if (!client) return 'auth.errorGeneric' as AuthMessage;
    const { error } = await client.auth.updateUser({ password });
    return error ? authMessage(error) : null;
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    const client = await supabase();
    if (!client) return 'auth.errorGeneric' as AuthMessage;
    const { error } = await client.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });
    return error ? authMessage(error) : null;
  }, []);

  const value = useMemo<AuthApi>(
    () => ({
      enabled,
      ready,
      user,
      membership,
      membershipReady,
      membershipError,
      signIn,
      signInWithGitHub,
      signUp,
      signOut,
      requestReset,
      updatePassword,
      resendVerification,
    }),
    [
      enabled,
      ready,
      user,
      membership,
      membershipReady,
      membershipError,
      signIn,
      signInWithGitHub,
      signUp,
      signOut,
      requestReset,
      updatePassword,
      resendVerification,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthApi => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider fehlt');
  return context;
};
