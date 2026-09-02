# CraftGuide Solo

Eine Offline-Einzeldatei-Version von CraftGuide – nach dem gleichen Prinzip wie
`ZehnFinger.html` im Repo-Root: keine Installation, kein Server, einfach die HTML-Datei
öffnen. Alle Daten (Builds, Blockdaten, Bilder, Favoriten, Fortschritt) werden
ausschließlich lokal im Browser (`localStorage`) gespeichert.

**Fertige Datei zum Herunterladen**: [`../../download/CraftGuideSolo.html`](../../download/CraftGuideSolo.html)

## Was ist anders als bei der Server-Version (`minecraft-builds/client` + `server`)?

Da es keinen Server gibt, kann diese Version keine Daten zwischen Geräten oder Personen
teilen. Deshalb:

- **Kein Login, keine Rollen.** Jeder, der die Datei öffnet, hat vollen Zugriff (wie am
  eigenen Gerät üblich).
- **Keine geteilten Kommentare/Bewertungen von Freunden.** Stattdessen: eine persönliche
  5-Sterne-Bewertung und ein privates Notizfeld pro Build.
- **Teilen mit Freunden über Export/Import**: Unter „Daten & Export" lässt sich die
  komplette Bibliothek als JSON-Datei herunterladen und bei anderen (die ebenfalls diese
  HTML-Datei nutzen) wieder importieren.
- **Bilder werden beim Hochladen automatisch verkleinert** (Canvas-Downscale auf JPEG),
  damit sie in `localStorage` passen (Browser-Limit meist 5–10 MB pro Datei/Domain).
- Alles andere – 3D-Voxel-Editor, 3D-Anleitung mit Schicht-Navigation, Bild-Anleitung,
  automatische Materialliste (Java/Bedrock), Kategorien/Tags, Favoriten, Fortschritt,
  Dark/Light Mode – funktioniert identisch zur Server-Version.

## Entwicklung

```bash
npm install
npm run dev      # Dev-Server auf http://localhost:5173
npm run build    # Erzeugt dist/index.html als EINE Datei (via vite-plugin-singlefile)
```

Nach `npm run build` liegt die fertige, eigenständige Datei unter `dist/index.html` –
diese kann direkt per Doppelklick geöffnet oder weitergegeben werden.

## Tech-Stack

React 18 + Vite (mit `vite-plugin-singlefile`), Tailwind CSS, Three.js, Zustand.
