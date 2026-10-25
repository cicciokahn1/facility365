import Link from 'next/link';

/**
 * Erfolgsseite nach dem Stripe-Checkout.
 *
 * Zeigt nur eine Bestaetigung der Bestellung - die Lizenz wird ausschliesslich
 * durch den verifizierten Stripe-Webhook aktiviert, nie durch diese Seite.
 */
export default function CheckoutSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md rounded-xl border bg-background p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">Vielen Dank!</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Ihre Bestellung ist eingegangen. Sobald die Zahlung bestätigt ist,
          wird Ihr Paket automatisch aktiviert – das dauert in der Regel nur
          wenige Sekunden. Sie erhalten eine Bestätigung per E-Mail.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Zur Anwendung
          </Link>
          <Link href="/pricing" className="rounded-lg border px-4 py-2 text-sm font-medium">
            Zurück zu den Paketen
          </Link>
        </div>
      </div>
    </main>
  );
}
