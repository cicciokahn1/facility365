# Facility365 – Eigenes Hosting (Schweiz / Datenschutz)

Ziel: App und Daten in der Schweiz, unabhängig von Vercel.

## Variante A – Empfohlen: Schweizer VPS + Supabase Zürich

Der einfachste Weg mit maximalem Datenschutz:

1. **Datenbank in Zürich:** Im Supabase-Dashboard ein neues Projekt in der Region **eu-central-2 (Zürich)** anlegen. Alle Tabellen aus `supabase/migrations/` der Reihe nach einspielen (SQL-Editor oder `supabase db push`). Daten bleiben in der Schweiz.
2. **Server mieten:** VPS bei einem Schweizer Anbieter:
   - **Infomaniak Public Cloud** (Genf) oder **Exoscale** (Zürich/Genf) – beide Schweizer Firmen, Daten in der Schweiz.
   - Grösse: 2 vCPU / 4 GB RAM reicht für ~50 Nutzer.
3. **Installation auf dem Server:**
   ```bash
   apt update && apt install -y docker.io docker-compose-plugin git
   git clone https://github.com/cicciokahn1/facility365.git && cd facility365
   cp .env.production.example .env   # DOMAIN + Supabase-Schlüssel des Zürich-Projekts eintragen
   docker compose up -d
   ```
   Caddy richtet HTTPS automatisch ein, sobald die Domain auf den Server zeigt.
4. **DNS:** A-Record `app.deinefirma.ch` → Server-IP.
5. **Backups:** täglicher `pg_dump` der Datenbank auf externes Ziel (s. unten).

## Variante B – Alles selbst: Postgres ohne Supabase

Mehr Aufwand (Supabase-Auth und RLS müssten ersetzt werden) – erst sinnvoll,
wenn Variante A nicht reicht. Erst dann angehen.

## Daten mitnehmen (Migration)

- App-seitig: **Einstellungen → Sicherung** erzeugt ein komplettes Backup aller Daten – auf dem neuen System wiederherstellen.
- Server-seitig: `pg_dump` der alten Datenbank → `psql` in die neue.

## Tägliches Server-Backup (Beispiel-Cron)

```cron
0 3 * * * pg_dump "postgresql://postgres:PASS@HOST:5432/postgres" | gzip > /backup/f365-$(date +\%F).sql.gz && find /backup -name "f365-*.sql.gz" -mtime +30 -delete
```

## Checkliste Datenschutz

- [ ] Supabase-Region Zürich (oder Schweizer Postgres) gewählt
- [ ] Server steht bei Schweizer Anbieter (Infomaniak/Exoscale)
- [ ] HTTPS aktiv (Caddy macht das automatisch)
- [ ] Tägliches Backup ausserhalb des Servers
- [ ] Starke Schlüssel in `.env` (kein Klartext im Git)
