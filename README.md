# Facility365

Plattform für Gebäude- und Facility-Management.

Aufgesetzt mit **React + Vite + TypeScript**.

## Voraussetzungen

- Node.js `>= 22.12` (siehe `.nvmrc`)

## Entwicklung

```bash
npm install
npm run dev      # Entwicklungsserver
npm run build    # Produktions-Build
npm run lint     # Oxlint
```

## Struktur

```
src/
  modules/
    settings/            # Modul "Einstellungen"
      SettingsPage.tsx   # Seitenlayout + Navigation
      settings.css
      sections/          # Einzelne Einstellungsbereiche (reine UI)
        GeneralSection.tsx        # Allgemein
        UserProfileSection.tsx    # Benutzerprofil
        NotificationsSection.tsx  # Benachrichtigungen
        AppearanceSection.tsx     # Darstellung
        SecuritySection.tsx       # Sicherheit
        AboutSection.tsx          # Über Facility365
```

## Status

Sprint 10 – Modul "Einstellungen": reine Oberfläche, noch keine Logik.
