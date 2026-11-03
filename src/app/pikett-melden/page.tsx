"use client";

/**
 * Oeffentliche Notfallmeldung fuer den Pikettdienst.
 *
 * Der Link wird pro freigegebener Liegenschaft erzeugt (?p=<liegenschaftId>).
 * Meldungen werden als «Neu – ungeprueft» gespeichert; externe Melder sehen
 * ausschliesslich die freigegebene Liegenschaft und deren Gebaeude.
 */
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Info {
  name: string;
  address: string;
  buildings: { id: string; name: string }[];
}

const URGENCIES = [
  { value: "low", label: "Niedrig" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Hoch" },
  { value: "critical", label: "Kritisch" },
];

function ReportForm() {
  const params = useSearchParams();
  const propertyId = params.get("p") ?? "";
  const [info, setInfo] = useState<Info | null>(null);
  const [missing, setMissing] = useState(() => !propertyId);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    buildingId: "",
    reporter: "",
    contact: "",
    urgency: "normal",
  });

  useEffect(() => {
    if (!propertyId) return;
    void fetch(`/api/oncall-report?p=${encodeURIComponent(propertyId)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error();
        setInfo(await response.json());
      })
      .catch(() => setMissing(true));
  }, [propertyId]);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/oncall-report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ propertyId, ...form }),
      });
      if (!response.ok) throw new Error();
      setDone(true);
    } catch {
      setError(
        "Die Meldung konnte nicht übermittelt werden. Bitte versuchen Sie es später erneut.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (missing) {
    return (
      <main className="mx-auto max-w-md p-6 pt-16 text-center">
        <p className="text-muted-foreground">
          Dieser Meldelink ist ungültig oder abgelaufen.
        </p>
      </main>
    );
  }
  if (!info) return null;
  if (done) {
    return (
      <main className="mx-auto max-w-md p-6 pt-16 text-center">
        <CheckCircle2 className="mx-auto mb-3 size-10 text-green-600" />
        <p>
          Vielen Dank. Ihre Meldung wurde übermittelt und wird vom Pikettdienst
          geprüft.
        </p>
      </main>
    );
  }

  const valid = form.title.trim() && form.description.trim() && form.reporter.trim();

  return (
    <main className="mx-auto max-w-md space-y-4 p-6">
      <div>
        <h1 className="text-xl font-semibold">Notfall melden</h1>
        <p className="text-sm text-muted-foreground">
          Melden Sie eine Störung oder einen Notfall ausserhalb der Arbeitszeit.
          Der Pikettdienst wird informiert.
        </p>
        <p className="mt-1 text-sm font-medium">
          {info.name}
          {info.address ? ` · ${info.address}` : ""}
        </p>
      </div>
      <Input
        placeholder="Titel der Störung *"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <Textarea
        placeholder="Beschreibung *"
        rows={4}
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <select
        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        value={form.buildingId}
        onChange={(e) => setForm({ ...form, buildingId: e.target.value })}
      >
        <option value="">Standort / Gebäude wählen</option>
        {info.buildings.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      <select
        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        value={form.urgency}
        onChange={(e) => setForm({ ...form, urgency: e.target.value })}
      >
        {URGENCIES.map((u) => (
          <option key={u.value} value={u.value}>
            {u.label}
          </option>
        ))}
      </select>
      <Input
        placeholder="Ihr Name *"
        value={form.reporter}
        onChange={(e) => setForm({ ...form, reporter: e.target.value })}
      />
      <Input
        placeholder="Telefon oder E-Mail"
        value={form.contact}
        onChange={(e) => setForm({ ...form, contact: e.target.value })}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={submit} disabled={busy || !valid} className="w-full">
        Meldung senden
      </Button>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense>
      <ReportForm />
    </Suspense>
  );
}
