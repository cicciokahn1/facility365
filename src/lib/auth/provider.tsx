'use client';

/**
 * Anmeldung von Facility365.
 *
 * Die Sitzung kommt von Supabase Auth. Ohne hinterlegtes Projekt laeuft die
 * Anwendung lokal weiter; dann meldet `enabled` false und die Oberflaeche
 * verlangt keine Anmeldung.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { isSupabaseConfigured, isSupabaseReachable, supabase } from '@/lib/supabase/client';

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthApi {
  /** Anmeldung ist nur mit hinterlegtem Supabase-Projekt aktiv. */
  enabled: boolean;
  /** Sitzung wurde geprueft; vorher zeigt die Oberflaeche nichts Endgueltiges. */
  ready: boolean;
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthApi | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(!configured);
  /** Unerreichbares Projekt: die Anwendung bleibt bedienbar, aber lokal. */
  const [reachable, setReachable] = useState(configured);
  const enabled = configured && reachable;

  useEffect(() => {
    const client = supabase();
    if (!client) return;

    let active = true;
    const init = async () => {
      if (!(await isSupabaseReachable())) {
        if (!active) return;
        setReachable(false);
        setReady(true);
        return;
      }
      const { data } = await client.auth.getSession();
      if (!active) return;
      const current = data.session?.user;
      setUser(current ? { id: current.id, email: current.email ?? '' } : null);
      setReady(true);
    };
    void init();

    /**
     * Der Sitzungswechsel meldet nur den Benutzer. Fertig ist die Pruefung erst,
     * wenn auch die Erreichbarkeit feststeht - sonst schickt die Oberflaeche
     * zur Anmeldung, obwohl gar kein Dienst antwortet.
     */
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      const next = session?.user;
      setUser(next ? { id: next.id, email: next.email ?? '' } : null);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const client = supabase();
    if (!client) return 'auth.notConfigured';
    const { error } = await client.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const client = supabase();
    if (!client) return 'auth.notConfigured';
    const { error } = await client.auth.signUp({ email, password });
    return error ? error.message : null;
  }, []);

  const signOut = useCallback(async () => {
    const client = supabase();
    if (!client) return;
    await client.auth.signOut();
    setUser(null);
  }, []);

  const value = useMemo<AuthApi>(
    () => ({ enabled, ready, user, signIn, signUp, signOut }),
    [enabled, ready, user, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthApi => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider fehlt');
  return context;
};
