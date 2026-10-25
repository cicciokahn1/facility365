/**
 * POST /api/stripe/webhook – verarbeitet verifizierte Stripe-Events.
 *
 * Sicherheit:
 * - Signaturpruefung ueber STRIPE_WEBHOOK_SECRET (Pflicht; ohne Secret 503).
 * - Idempotenz: jede Event-ID wird einmalig in billing_events geschrieben;
 *   doppelte Events werden mit 200 quittiert, aber nicht erneut verarbeitet.
 * - Lizenz- und Paket-Aenderungen laufen nur ueber den Service-Client und nur
 *   nach verifiziertem Event – niemals ueber Client-Aufrufe.
 */
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { adminClient, stripeClient, stripeWebhookSecret } from '@/lib/billing/server';

const markProcessed = async (event: Stripe.Event): Promise<boolean> => {
  const admin = adminClient();
  if (!admin) return false;
  const { error } = await admin
    .from('billing_events')
    .insert({ id: event.id, type: event.type });
  /** Konflikt = Event schon verarbeitet. */
  return !error;
};

const activateLicense = async (
  tenantId: string,
  pkg: string,
  customerId: string | null,
  subscriptionId: string | null,
) => {
  const admin = adminClient();
  if (!admin) return;
  await admin.from('billing_customers').upsert(
    {
      tenant_id: tenantId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      package: pkg,
      status: 'active',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'tenant_id' },
  );
  /** Lizenz aktivieren: plan auf licensed, Testende zuruecksetzen. */
  await admin
    .from('tenants')
    .update({ plan: 'licensed', trial_ends_at: null })
    .eq('id', tenantId);
  /** Paket in den Mandanteneinstellungen hinterlegen. */
  const { data: row } = await admin
    .from('tenant_settings')
    .select('data')
    .eq('tenant_id', tenantId)
    .maybeSingle();
  const data = { ...(row?.data as Record<string, unknown> | null), industryPackage: pkg };
  await admin.from('tenant_settings').upsert(
    { tenant_id: tenantId, data, updated_at: new Date().toISOString() },
    { onConflict: 'tenant_id' },
  );
};

const setSubscriptionStatus = async (
  subscriptionId: string,
  status: 'canceled' | 'past_due',
) => {
  const admin = adminClient();
  if (!admin) return;
  const { data } = await admin
    .from('billing_customers')
    .select('tenant_id')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle();
  if (!data?.tenant_id) return;
  await admin
    .from('billing_customers')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('tenant_id', data.tenant_id);
};

export async function POST(request: Request) {
  const stripe = await stripeClient();
  const secret = stripeWebhookSecret();
  if (!stripe || !secret) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature') ?? '';
  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  if (!(await markProcessed(event))) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const tenantId =
        (session.metadata?.tenant_id as string | undefined) ??
        (session.client_reference_id as string | undefined) ??
        '';
      const pkg = (session.metadata?.package as string | undefined) ?? '';
      if (tenantId && pkg && session.payment_status === 'paid') {
        await activateLicense(
          tenantId,
          pkg,
          typeof session.customer === 'string' ? session.customer : null,
          typeof session.subscription === 'string' ? session.subscription : null,
        );
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await setSubscriptionStatus(subscription.id, 'canceled');
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId =
        typeof (invoice as { subscription?: string }).subscription === 'string'
          ? (invoice as { subscription?: string }).subscription!
          : '';
      if (subscriptionId) await setSubscriptionStatus(subscriptionId, 'past_due');
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
