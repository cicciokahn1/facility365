/**
 * POST /api/checkout – erstellt eine Stripe-Checkout-Session.
 *
 * Body: { package: '<paket-schluessel>' }
 *
 * Der Preis kommt ausschliesslich aus der zentralen Paketkonfiguration –
 * nie aus der Anfrage. Pakete ohne festen Jahrespreis (Hospital «ab»,
 * Enterprise) und unbekannte Schluessel werden abgelehnt. Die Session ist an
 * den Mandanten der angemeldeten Sitzung gebunden; ohne Anmeldung 401.
 */
import { NextResponse } from 'next/server';

import { PACKAGE_PRICES } from '@/lib/packages/packages';
import { sessionTenant, stripeClient } from '@/lib/billing/server';
import type { IndustryPackage } from '@/lib/types';

const SELLABLE: IndustryPackage[] = [
  'starter',
  'property',
  'industry',
  'care',
  'public',
  'professional',
];

export async function POST(request: Request) {
  const stripe = await stripeClient();
  if (!stripe) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  let body: { package?: string };
  try {
    body = (await request.json()) as { package?: string };
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const pkg = body.package as IndustryPackage | undefined;
  if (!pkg || !SELLABLE.includes(pkg)) {
    return NextResponse.json({ error: 'package_not_sellable' }, { status: 400 });
  }
  const yearly = PACKAGE_PRICES[pkg]?.yearly;
  if (!yearly) {
    return NextResponse.json({ error: 'package_not_sellable' }, { status: 400 });
  }

  const tenantId = await sessionTenant();
  if (!tenantId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const origin = new URL(request.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    client_reference_id: tenantId,
    customer_email: undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'chf',
          unit_amount: yearly * 100,
          recurring: { interval: 'year' },
          product_data: { name: `Facility365 ${pkg.charAt(0).toUpperCase()}${pkg.slice(1)}` },
        },
      },
    ],
    metadata: { tenant_id: tenantId, package: pkg },
    subscription_data: { metadata: { tenant_id: tenantId, package: pkg } },
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?canceled=1`,
  });

  return NextResponse.json({ url: session.url });
}
