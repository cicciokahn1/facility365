-- Facility365 – Stripe-Abrechnung (Vorbereitung, idempotent)
--
-- Zwei Tabellen nur fuer den Server (service role):
--   billing_customers  - Zuordnung Mandant <-> Stripe-Kunde/Abonnement
--   billing_events     - bereits verarbeitete Webhook-Events (Idempotenz)
--
-- Der anonyme/authentifizierte Zugriff bleibt gesperrt (RLS ohne Policies =
-- deny-all). Nur der Server mit dem Service-Schlussel liest und schreibt.
-- Es werden keine bestehenden Daten geaendert.

create table if not exists public.billing_customers (
  tenant_id uuid primary key references public.tenants (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  package text,
  status text not null default 'none',
  updated_at timestamptz not null default now()
);

create unique index if not exists billing_customers_customer_idx
  on public.billing_customers (stripe_customer_id)
  where stripe_customer_id is not null;

create table if not exists public.billing_events (
  id text primary key,
  type text not null,
  processed_at timestamptz not null default now()
);

alter table public.billing_customers enable row level security;
alter table public.billing_customers force row level security;
alter table public.billing_events enable row level security;
alter table public.billing_events force row level security;

revoke all on public.billing_customers from anon, authenticated;
revoke all on public.billing_events from anon, authenticated;
