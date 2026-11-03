# Facility365 – Technisches Übergabe-Dokument

**Version 1.0 – November 2026**
Zweck: Übergabe der technischen Betreuung an einen externen IT-Dienstleister.
Der Dienstleister ist **ausschliesslich Dienstleister** – kein Eigentum an Code, Daten oder Produkt (siehe `docs/legal/Facility365_Partner_Vertrag_NDA.md` im Repo).

---

## 1. Auf einen Blick

| Thema | Stand |
|---|---|
| Produktiv-URL | https://facility365.vercel.app |
| Framework | Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4 |
| Backend | Supabase (PostgreSQL, Auth, RLS, Storage) |
| Hosting | Vercel (Produktiv-Branch: `main`) |
| Code | Privates GitHub-Repo `cicciokahn1/facility365` |
| DB-Region | Supabase-Projekt `vbghzplnqiqenjllpctj`, Region Stockholm (EU) |
| Zahlung | **Kein Online-Checkout** – Stripe wurde entfernt; Abrechnung per manueller Rechnung (Revolut Business) |
| Rechtstexte | AGB, Datenschutz, AVV in `src/lib/legal/texts.ts`, Seite `/legal` |

## 2. Architektur

```
Browser (React-PWA, offline-fähig)
   │  HTTPS
   ▼
Vercel (Next.js App)
   ├── Seiten: src/app/(app)/* – interne Module
   ├── src/app/api/* – kleine API-Routen (Reports, Push, Feedback…)
   └── src/lib/* – Auth, Supabase-Client, i18n, Pakete, Offline-Sync
   │
   ▼
Supabase PostgreSQL
   ├── public-Schema, ~50 Tabellen (31 nummerierte Migrationen)
   ├── Row Level Security auf ALLEN Mandantentabellen
   ├── Supabase Auth (E-Mail/Passwort)
   └── Storage (Fotos, Dokumente)
```

**Wichtige Eigenheiten:**
- **Mandantensystem:** Jeder Datensatz hat `tenant_id`. Zugriff erfolgt ausschliesslich über RLS-Policies mit `public.current_tenant()`. **Niemals** Policies lockern oder `service_role`-Key im Client verwenden.
- **Offline-Sync:** Die App hält Änderungen lokal (localStorage-Queue) und synchronisiert später. Beim Ändern von Collections/Schemas die Sync-Logik in `src/lib/` mitbedenken.
- **i18n:** Alle Texte kommen aus `src/lib/i18n/dictionary.ts` (DE/FR/IT/EN). Nach Änderungen `npm run dictionary` ausführen – `src/lib/i18n/generated/*` ist generiert, nicht von Hand editieren.
- **Rollen:** `superadmin`, `orgadmin`, `manager`, `mitarbeiter`, `lesend`; Schreibrechte zentral über `may_write()` / `may_delete()`.

## 3. Benötigte Zugänge (Eigentümer stellt bereit)

| System | Zugang | Hinweis |
|---|---|---|
| GitHub | Repo-Collaborator (Write) | github.com/cicciokahn1/facility365 |
| Vercel | Team-Mitglied (Projekt facility365) | vercel.com |
| Supabase | Projekt-Mitglied | Project `vbghzplnqiqenjllpctj` |
| E-Mail | Support-Adresse | für System-/Fehlermeldungen |

**Regel:** Keine Secrets im Git. Alle Keys nur in Vercel-Umgebungsvariablen bzw. lokalen `.env`-Dateien. Der `SUPABASE_SERVICE_ROLE_KEY` darf ausschliesslich serverseitig existieren.

## 4. Umgebungsvariablen

Vorlage: `.env.production.example` im Repo. Aktuell relevant:

```
NEXT_PUBLIC_SUPABASE_URL      # öffentlich, sicher
NEXT_PUBLIC_SUPABASE_ANON_KEY # öffentlich, sicher (RLS schützt)
SUPABASE_SERVICE_ROLE_KEY     # GEHEIM – nur Server
FACILITY365_API_KEY           # für /api/v1 Lese-Schnittstelle
WEB_PUSH_PUBLIC_KEY / _PRIVATE_KEY / _SUBJECT   # Push (optional)
NEXT_PUBLIC_MSAL_CLIENT_ID / _TENANT_ID          # Outlook (optional)
```

Alte `STRIPE_*`-Variablen können in Vercel gelöscht werden (ungenutzt).

## 5. Deployment

- Produktiv: `main`-Branch → Vercel.
- **Achtung:** Pushes lösen den Deploy nicht immer zuverlässig aus (beobachtet Okt/Nov 2026). Falls nach einem Push nichts passiert:
  - Vercel → Project → **Deployments** → neuester Eintrag → `···` → **Redeploy**, oder
  - **Deploy Hook** einrichten (Settings → Git → Deploy Hooks → Branch `main`) – die URL als Bookmark „Veröffentlichen“.
- Arbeitsbranch: `devin/1789068777-quality-check` (bisheriger Devin-Arbeitsstand, ist in `main` gemergt). Neue Arbeit am besten direkt auf `main` oder kurze Feature-Branches + Merge.
- Lokale Prüfung vor Push: `npx tsc --noEmit` und `npx eslint` müssen sauber sein.

```bash
git clone … && npm install
npm run dev        # lokale Entwicklung
npx tsc --noEmit   # Typcheck
npm run build      # Produktions-Build
```

## 6. Datenbank / Supabase

- **Migrationen:** `supabase/migrations/0001_*.sql … 0031_oncall.sql` – nummeriert, in Reihenfolge im SQL-Editor ausführbar. Idempotent geschrieben.
- **Wichtig (Stand Nov 2026):** Die Migrationen **0027–0030** (Billing-Tabellen, Paket-Guards, Lizenz-Guard) existieren im Repo, wurden aber nach Entscheid des Eigentümers in der Produktiv-DB **zurückgerollt** und sind NICHT aktiv. Nicht einfach nachziehen.
- **Schema-Anker:** `tenants`, `tenant_members`, `tenant_settings` bilden das Mandantengerüst; `current_tenant()` liefert den aktiven Mandanten.
- **Keine destruktiven Änderungen** an bestehenden Tabellen/Spalten ohne Backup + Zustimmung.
- Projekt-URL & Keys: Supabase-Dashboard → Project Settings → API.

## 7. Backups & Datensicherheit

- Supabase macht automatische Backups (je nach Plan). Zusätzlich:
  - In-App: **Einstellungen → Sicherung** exportiert die Mandantendaten.
  - Gesamt-Projekt-Backup (Code + Migrationen, ohne node_modules): `Facility365_Backup_20261028.tar.gz` liegt beim Eigentümer.
- Empfehlung: täglicher `pg_dump`-Cron wie in `HOSTING.md` beschrieben.
- Wiederherstellung testen, bevor sie gebraucht wird.

## 8. Sicherheit

- RLS auf allen Mandantentabellen (`force row level security` wo gesetzt) – beim Anlegen neuer Tabellen **immer** Policies mitdenken.
- Auth via Supabase; Passwortregeln: min. 10 Zeichen.
- Öffentliche Formulare (`/melden`, `/pikett-melden`, `/pricing` Angebotsformular) gehen über API-Routen – dort Rate-Limiting/Validierung beachten.
- Keine Secrets in Code, Logs, Berichten.

## 9. Häufige Aufgaben

| Aufgabe | Wo |
|---|---|
| Neuen Kunden-Mandanten anlegen | Supabase → `tenants` + Mitglied in `tenant_members` (oder App-Registrierung) |
| Paket eines Kunden ändern | `tenant_settings.data->>'industryPackage'` (manuell, da Billing-Guard nicht aktiv) |
| Text ändern | `src/lib/i18n/dictionary.ts` → `npm run dictionary` |
| Neue Collection/Tabelle | Migration `00NN_*.sql` + RLS-Policies + Modul-Registrierung |
| Deploy | Push auf `main` → ggf. Redeploy in Vercel (s. §5) |
| Fehleranalyse | Vercel Logs + Supabase Logs + Browser-Konsole |

## 10. Bekannte Punkte / ehrlicher Stand

- Migrationsdateien 0027–0030 vorhanden aber nicht aktiv (s. §6) – bei späterem Wunsch wieder einspielbar (Rollback-Skript existiert ebenfalls).
- `docs/legal/` enthält die Partner-NDA-Vorlage; Rechtstexte im Code (`texts.ts`) sind die massgeblichen Live-Texte.
- `HOSTING.md` beschreibt optionalen Umzug auf Schweizer Self-Hosting (Infomaniak/Exoscale + Supabase Zürich) – nur falls Datenschutz-Lage das erfordert.

## 11. Kontakt / Übergabe

- Eigentümer: Francesco Macedonio, Bellach (SO)
- Fragen zu diesem Dokument: zuerst Repo + dieses Dokument lesen, dann gezielt nachfragen.
- Bei Übernahme: Zugänge gemäss §3 einrichten, eine Teständerung lokal + Deploy durchspielen, Backup-Wiederherstellung einmal testen.
