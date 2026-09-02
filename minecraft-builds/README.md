# 🧱 CraftGuide – Minecraft-Bauanleitungen

Eine kostenlose, selbstgehostete Web-App für Minecraft-Bauanleitungen mit 3D-Anleitung,
Bild-Anleitung im LEGO-Stil und einem eigenen Admin-Bereich zum Erstellen neuer Builds
(inkl. browserbasiertem Voxel-Editor). Keine Bezahlfunktion, kein Abo – gedacht für dich
und deine Freunde.

> Hinweis: Dieses Projekt liegt im Ordner `minecraft-builds/` dieses Repositories, getrennt
> von der ursprünglichen „ZehnFinger"-Tipptrainer-App im Repo-Root, damit beide Projekte
> unabhängig voneinander bestehen bleiben.

## Tech-Stack

- **Frontend**: React 18 + Vite, Tailwind CSS, Three.js, Zustand, React Router
- **Backend**: Node.js + Express
- **Datenbank**: SQLite (via `better-sqlite3`, lokale Datei, kein separater DB-Server nötig)
- **Bild-Uploads**: lokal im Dateisystem (`server/data/uploads`), Pfade in der DB

## Features im Überblick

- Registrierung/Login (E-Mail + Passwort, JWT), Passwort-Reset-Flow, Profil mit Avatar
- Rollen: Admin (erster registrierter Account) / normaler Nutzer
- Bibliothek mit Volltextsuche, Mehrfach-Filtern (Kategorie, Schwierigkeit, Tag, Edition)
  und Sortierung (neueste/älteste/beliebteste/schwierigste/leichteste)
- Build-Detailseite mit 4 Tabs:
  - **3D-Anleitung**: interaktives Three.js-Modell, Schicht-für-Schicht durchblätterbar,
    einzelne Ebenen ein-/ausblendbar, drehbar/zoombar
  - **Bild-Anleitung**: Schritt-für-Schritt-Bilder mit Vor/Zurück-Navigation und
    automatischem Fortschritts-Tracking
  - **Materialliste**: automatisch aus den Blockdaten berechnet (Java- & Bedrock-Namen),
    als Text herunterladbar oder druckbar (PDF via Browser-Druckdialog)
  - **Bewertung & Kommentare**: Sterne-Bewertung, Kommentare
- Favoriten, „Zuletzt angesehen", Teilen-Funktion (Link kopieren)
- Offline-Zugriff auf bereits besuchte Builds via Service Worker
- Admin-Bereich: Statistik-Dashboard, Build-Verwaltung (Entwurf/Veröffentlicht),
  **Voxel-Editor** (Blöcke Etage für Etage im Browser platzieren/löschen), Drag & Drop
  Bild-Upload mit sortierbarer Reihenfolge, Kategorien-/Tag-Verwaltung
- Dark Mode (Standard) / Light Mode, Toasts, Skeleton-Loading, responsive für Mobile

## Setup

Voraussetzung: Node.js ≥ 18.

### 1. Backend

```bash
cd minecraft-builds/server
npm install
cp .env.example .env      # bei Bedarf JWT_SECRET anpassen
npm run seed               # legt Admin-Account, Testnutzer & 3 Beispiel-Builds an
npm run dev                # startet die API auf http://localhost:4000
```

Nach dem Seed stehen folgende Zugänge bereit:

| Rolle  | E-Mail               | Passwort     |
|--------|-----------------------|--------------|
| Admin  | admin@example.com     | admin1234    |
| Nutzer | friend@example.com    | friend1234   |

**Bitte nach dem ersten Login das Admin-Passwort ändern** (über „Mein Profil" ist aktuell
nur der Name/Avatar änderbar – ein Passwort-Wechsel läuft über „Passwort vergessen").

### 2. Frontend

In einem zweiten Terminal:

```bash
cd minecraft-builds/client
npm install
npm run dev                 # startet die App auf http://localhost:5173
```

Die Vite-Konfiguration leitet `/api` und `/uploads` automatisch an das Backend
(Port 4000) weiter. Einfach `http://localhost:5173` im Browser öffnen.

### Production-Build

```bash
# Backend
cd minecraft-builds/server && npm start

# Frontend
cd minecraft-builds/client && npm run build && npm run preview
```

## Ordnerstruktur

```
minecraft-builds/
├── server/               Express-API + SQLite
│   ├── src/
│   │   ├── routes/       Auth, Kategorien, Tags, Builds, Uploads, Admin, Users
│   │   ├── middleware/   JWT-Auth
│   │   ├── utils/        Blocknamen (Java/Bedrock), Materialberechnung, Slugify
│   │   ├── db.js         SQLite-Schema
│   │   └── seed.js       Beispieldaten-Generator
│   └── data/             SQLite-Datei & hochgeladene Bilder (nicht versioniert)
└── client/               React-Frontend
    └── src/
        ├── pages/        Bibliothek, Build-Detail, Auth, Profil, Admin/*
        ├── components/   Navbar, BuildCard, Voxel-Viewer/-Editor (Three.js), ...
        ├── store/        Zustand-Stores (Auth, UI/Theme/Toasts)
        └── api/          Fetch-Client
```

## Beispieldaten

`npm run seed` (im `server`-Ordner) legt drei Beispiel-Builds mit vollständigen
Blockdaten und automatisch generierten Bild-Anleitungsschritten an: eine Starter-Hütte,
einen Steinturm-Wachturm und einen Wüstenbrunnen – jeweils inkl. Kategorie, Tags,
Bewertung und einem Beispielkommentar. So lässt sich die App direkt nach dem Setup
vollständig ausprobieren, ohne selbst etwas im Admin-Bereich anlegen zu müssen.

## Bekannte Einschränkungen

- **Passwort-Reset ohne E-Mail-Versand**: Da die App kostenlos und ohne externe Dienste
  laufen soll, wird kein SMTP-Server konfiguriert. Der Reset-Link wird stattdessen direkt
  in der App angezeigt (`/forgot-password`). Für den echten Einsatz mit Freunden reicht
  das, da ihr euch die Zugangsdaten ohnehin direkt mitteilen könnt.
- **Materialliste als PDF**: nutzt den Browser-Druckdialog („Als PDF speichern"), da so
  keine zusätzliche PDF-Bibliothek nötig ist.
- **Offline-Cache**: cacht besuchte Seiten und Bilder über einen Service Worker. Für
  einen Build müsst ihr ihn also einmal online geöffnet haben, danach ist er auch offline
  abrufbar.
