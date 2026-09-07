"use client";

/**
 * Zustand der kostenlosen Testversion.
 *
 * Mit Anmeldung kommt die Frist aus dem eigenen Mandanten (`tenants`), sonst
 * aus dem Testeintrag des Geraets. Ohne Testeintrag meldet der Anbieter, dass
 * keine Testversion laeuft - bestehende Installationen bleiben unveraendert.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "@/lib/auth/provider";
import { supabase } from "@/lib/supabase/client";
import {
  NO_TRIAL,
  TrialRecord,
  TrialState,
  extendTrial,
  readTrial,
  startTrial,
  trialStateOf,
} from "@/lib/trial/trial";

interface TrialApi extends TrialState {
  /** Frist steht fest; vorher zeigt die Oberflaeche keine Sperre. */
  ready: boolean;
  /** Startet die Testzeit auf diesem Geraet (Browserbetrieb). */
  start: () => void;
  /** Verlaengert die Testzeit um weitere Tage (Administration). */
  extend: (days: number) => Promise<void>;
}

const TrialContext = createContext<TrialApi | null>(null);

interface TenantRow {
  plan: string;
  trial_ends_at: string | null;
}

export function TrialProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const tenantId = auth.membership?.tenantId ?? "";
  const [record, setRecord] = useState<TrialRecord | null>(null);
  const [ready, setReady] = useState(false);
  /** Der Tageswechsel muss die Anzeige erneuern, ohne dass jemand neu laedt. */
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setTick((value) => value + 1),
      60 * 60 * 1000,
    );
    return () => window.clearInterval(timer);
  }, []);

  const loadTenant = useCallback(async (): Promise<TrialRecord | null> => {
    const client = await supabase();
    if (!client || !tenantId) return null;
    const { data } = await client
      .from("tenants")
      .select("plan, trial_ends_at")
      .eq("id", tenantId)
      .maybeSingle();
    const row = data as TenantRow | null;
    if (!row || row.plan !== "trial" || !row.trial_ends_at) return null;
    return { plan: "trial", startedAt: "", endsAt: row.trial_ends_at };
  }, [tenantId]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!auth.ready) return;
      if (auth.enabled) {
        if (!tenantId) {
          if (active) {
            setRecord(null);
            setReady(true);
          }
          return;
        }
        const loaded = await loadTenant();
        if (!active) return;
        setRecord(loaded);
        setReady(true);
        return;
      }
      setRecord(readTrial());
      setReady(true);
    };
    void load();
    return () => {
      active = false;
    };
  }, [auth.enabled, auth.ready, auth.user, loadTenant, tenantId]);

  const start = useCallback(() => {
    setRecord(startTrial());
  }, []);

  const extend = useCallback(
    async (days: number) => {
      if (auth.enabled && tenantId) {
        const client = await supabase();
        if (!client) return;
        /** Die Berechtigung prueft die Datenbank, nicht die Oberflaeche. */
        const { data } = await client.rpc("extend_trial", { days });
        const endsAt = typeof data === "string" ? data : "";
        if (!endsAt) return;
        setRecord((value) => (value ? { ...value, endsAt } : value));
        return;
      }
      const next = extendTrial(days);
      if (next) setRecord(next);
    },
    [auth.enabled, tenantId],
  );

  const value = useMemo<TrialApi>(() => {
    void tick;
    const state = record ? trialStateOf(record) : NO_TRIAL;
    return { ...state, ready, start, extend };
  }, [extend, ready, record, start, tick]);

  return (
    <TrialContext.Provider value={value}>{children}</TrialContext.Provider>
  );
}

export const useTrial = (): TrialApi => {
  const context = useContext(TrialContext);
  if (!context) throw new Error("TrialProvider fehlt");
  return context;
};
