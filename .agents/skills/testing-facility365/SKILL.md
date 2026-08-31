---
name: testing-facility365
description: How to runtime-test the Facility365 Next.js app (production on Vercel or local dev), including local device mode, backup/trash flows, cleaning module and the iPhone viewport.
---

# Testing Facility365

## Where the app runs
- Production: `https://facility365.vercel.app` (deployed from `/home/ubuntu/deploy/facility365`, branch `main`, no git remote / no PR).
- Local: `npm run dev` in the repo, usually on `http://localhost:3010`.
- Existing check scripts: `python3 /home/ubuntu/deploy/test_audit.py <URL>` and `python3 /home/ubuntu/deploy/test_sites.py <URL>`.

## Auth / data model
- Without a reachable Supabase project the app runs in "lokaler Gerätemodus": all data lives in the browser `localStorage`, there is no forced login.
- If `/login` appears, click "Lokal weiterarbeiten" — it returns to `/dashboard` without data loss.
- Because state is per browser profile, test data must be created in the same Chrome profile that is used for the whole run; clearing site data wipes everything.
- Deleting an entity is a **soft delete** (`deletedAt`); the record shows up under `/trash` and can be restored or purged. The first delete dialog says "dauerhaft entfernt" even though it is only a soft delete — expected, not a data-loss bug.

## Useful routes
`/dashboard`, `/calendar`, `/today`, `/properties`, `/orders`, `/energy`, `/analytics`, `/audit`, `/portal`, `/settings`, `/account`, `/trash`, `/login`, `/reset`,
cleaning module: `/cleaning`, `/cleaning/tasks`, `/cleaning/plans`, `/cleaning/areas`, `/cleaning/staff`, `/cleaning/checks`, `/cleaning/complaints`.

## Backup / restore
- `/account` → "Sicherung jetzt erstellen" downloads `~/Downloads/facility365-sicherung-<date>.json`.
- Verify content with plain python/jq: the JSON has `createdAt` and `collections.<module>` arrays.
- "Aus Datei wiederherstellen" opens a real OS file dialog (type the path into the GTK dialog). Restore is additive: re-importing an unchanged backup must toast "(0)" ergänzte Datensätze.
- Known quirk: in local device mode the line "Letzte Sicherung" can stay at "Noch keine Sicherung vorhanden" and "Aus Sicherung wiederherstellen" stays disabled even after a successful backup, because the snapshot is only stored server-side (Supabase). If you see this, check `src/lib/data/backup.ts` (`storeSnapshot`/`latestSnapshot`) before reporting it as a functional backup failure — the file download itself works.

## Mobile testing
- Use Chrome device emulation (Ctrl+Shift+M) with iPhone 12 Pro / 390×844.
- The compact mobile header is 44px with a small logo and a magnifier search button (`global-search-trigger`); Ctrl+K still opens the global search.
- Bottom nav has `bottom-nav-more` ("Mehr"), which opens a sheet with the full navigation, including the "Reinigung" group.
- The "Konto und Sicherung" card on `/settings` is far down the page — scroll before clicking.

## Devin Secrets Needed
- none (production runs without Supabase credentials).
