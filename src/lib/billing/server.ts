/**
 * Serverseitige Abrechnung (Stripe + Supabase service role).
 *
 * Alle Funktionen laufen ausschliesslich auf dem Server. Ohne eingerichtete
 * Umgebungsvariablen geben sie `null` zurueck, damit die Anwendung im
 * Angebotsmodus weiter funktioniert.
 */
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

/** Supabase-Client der angemeldeten Sitzung (unterliegt RLS). */
export const sessionClient = async () => {
  if (!supabaseUrl || !anonKey) return null;
  const store = await cookies();
  return createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (items: { name: string; value: string; options?: CookieOptions }[]) => {
        for (const item of items) store.set(item.name, item.value, item.options);
      },
    },
  });
};

/** Angemeldeter Benutzer + aktiver Mandant dieser Sitzung. */
export const sessionTenant = async (): Promise<string | null> => {
  const client = await sessionClient();
  if (!client) return null;
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;
  const { data } = await client.rpc('current_tenant');
  return typeof data === 'string' && data ? data : null;
};

let admin: SupabaseClient | null = null;

/** Service-Client; umgeht RLS – nur serverseitig verwenden. */
export const adminClient = (): SupabaseClient | null => {
  if (!supabaseUrl || !serviceKey) return null;
  admin ??= createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
};

let stripeInstance: Stripe | null = null;

/** Stripe-Client oder `null`, wenn kein Schluessel eingerichtet ist. */
export const stripeClient = async (): Promise<Stripe | null> => {
  const key = process.env.STRIPE_SECRET_KEY ?? '';
  if (!key) return null;
  if (!stripeInstance) {
    const { default: StripeClient } = await import('stripe');
    stripeInstance = new StripeClient(key);
  }
  return stripeInstance;
};

/** Webhook-Secret oder `null`, wenn nicht eingerichtet. */
export const stripeWebhookSecret = (): string | null =>
  process.env.STRIPE_WEBHOOK_SECRET || null;
