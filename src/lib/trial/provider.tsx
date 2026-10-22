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
  TrialPlan,
  TrialRecord,
  TrialState,
  extendTrial,
  readTrial,
  startTrial,
  trialStateOf,
} from "@/lib/trial/trial";

interface TrialApi extends TrialState {
  /** Lizenzstand des Mandanten; null ohne Eintrag (aeltre/lokale Daten). */
  plan: TrialPlan | null;
  /** Frist steht fest; vorher zeigt die Oberflaeche keine Sperre. */
  ready: boolean;
  /** Datenbank-Lesefehler beim Mandantenstatus (Diagnose, kein Silent-Fail). */
  loadError: boolean;
  /** Warum kein Status vorliegt: 'no-tenant' keine Mitgliedschaft,
   *  'no-row' Mandantenzeile nicht lesbar (RLS), 'unknown-plan' anderer Wert. */
  emptyReason: "no-tenant" | "no-row" | "unknown-plan" | null;
  /** Gelesener plan-Wert bei 'unknown-plan' (Diagnose). */
  rawPlan: string | null;
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
  const [loadError, setLoadError] = useState(false);
  const [emptyReason, setEmptyReason] = useState<
    "no-tenant" | "no-row" | "unknown-plan" | null
  >(null);
  /** Gelesener plan-Wert, falls er keinem bekannten Status entspricht. */
  const [rawPlan, setRawPlan] = useState<string | null>(null);
  /** Der Tageswechsel muss die Anzeige erneuern, ohne dass jemand neu laedt. */
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setTick((value) => value + 1),
      60 * 60 * 1000,
    );
    return () => window.clearInterval(timer);
  }, []);

  interface LoadResult {
    record: TrialRecord | null;
    reason: "no-tenant" | "no-row" | "unknown-plan" | null;
    rawPlan?: string;
  }

  const loadTenant = useCallback(async (): Promise<LoadResult> => {
    const none = (reason: LoadResult["reason"]): LoadResult => ({
      record: null,
      reason,
    });
    const client = await supabase();
    if (!client || !tenantId) return none("no-tenant");
    /** Die Mandanten-Regel (RLS) liefert ohnehin nur den aktiven Mandanten;
     *  eine eigene id-Abfrage kann bei mehreren Mitgliedschaften eine andere
     *  Zeile treffen und dann leer ausgehen. Fehler werden nicht verschluckt. */
    const { data, error } = await client
      .from("tenants")
      .select("plan, trial_ends_at")
      .limit(1)
      .maybeSingle();
    if (error) {
      console.warn("Mandantenstatus nicht lesbar:", error.code ?? error.message);
      setLoadError(true);
      return none(null);
    }
    const row = data as TenantRow | null;
    if (!row) return none("no-row");
    if (row.plan === "licensed") {
      return {
        record: { plan: "licensed", startedAt: "", endsAt: "" },
        reason: null,
      };
    }
    if (row.plan === "trial" && row.trial_ends_at) {
      return {
        record: { plan: "trial", startedAt: "", endsAt: row.trial_ends_at },
        reason: null,
      };
    }
    /** Testversion ohne Enddatum oder fremder Wert: nichts erfinden,
     *  aber den gelesenen Wert fuer die Diagnose behalten. */
    return { record: null, reason: "unknown-plan", rawPlan: row.plan };
  }, [tenantId]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!auth.ready) return;
      if (auth.enabled) {
        if (!tenantId) {
          if (active) {
            setRecord(null);
            setEmptyReason("no-tenant");
            setReady(true);
          }
          return;
        }
        const loaded = await loadTenant();
        if (!active) return;
        setRecord(loaded.record);
        setEmptyReason(loaded.reason);
        setRawPlan(loaded.rawPlan ?? null);
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
    return {
      ...state,
      plan: record?.plan ?? null,
      ready,
      loadError,
      emptyReason,
      rawPlan,
      start,
      extend,
    };
  }, [emptyReason, extend, loadError, rawPlan, ready, record, start, tick]);

  return (
    <TrialContext.Provider value={value}>{children}</TrialContext.Provider>
  );
}

export const useTrial = (): TrialApi => {
  const context = useContext(TrialContext);
  if (!context) throw new Error("TrialProvider fehlt");
  return context;
};
