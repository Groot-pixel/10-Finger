# 🦎 ZehnFinger

Eine Duolingo-inspirierte Web-App, um das 10-Finger-Tippsystem spielerisch zu lernen –
komplett im Browser, ohne Backend.

## 📥 Herunterladen (ohne Programmieren)

Du brauchst nichts zu installieren. Lade dir einfach die fertige App als eine einzige
HTML-Datei herunter und öffne sie in deinem Browser:

1. Öffne **[`download/ZehnFinger.html`](download/ZehnFinger.html)** hier im Repository.
2. Klicke rechts über dem Dateiinhalt auf das **Download-Symbol** (Pfeil nach unten) bzw.
   auf „Raw" und dann im Browser auf „Speichern unter…".
3. Speichere die Datei irgendwo auf deinem PC, z. B. in einem Ordner „Claude".
4. Doppelklick auf die Datei – sie öffnet sich in deinem Standard-Browser und läuft
   komplett offline. Dein Fortschritt wird lokal in diesem Browser gespeichert.

## Features

- **Lernpfad im Duolingo-Stil**: 10 Units mit ~45 Lektionen, die Schritt für Schritt alle
  Tasten der deutschen QWERTZ-Tastatur einführen (Grundreihe → obere/untere Reihe →
  Zahlen → Großschreibung → Satzzeichen → Wörter & Sätze → Geschwindigkeit).
- **Live-Tastatur mit Finger-Farbcodierung**: zeigt für jede Taste den richtigen Finger an,
  inkl. Finger-Guide-Leiste und automatischem Scrollen im Text.
- **Kronen-System**: Lektionen lassen sich bis zu 5× wiederholen (steigende Schwierigkeit),
  ähnlich Duolingos Crown-Levels.
- **XP, Präzisions-Herzen, Gems, Streak**: Herzen blockieren dich nie – sie belohnen
  fehlerfreies Tippen mit Bonus-Gems. Serien-Frost schützt die Streak, Gems werden im
  Shop gegen Boosts und Maskottchen-Kosmetik eingetauscht.
- **Liga-System**: 10 Ligen (Bronze bis Diamant) mit wöchentlichem Auf-/Abstieg gegen
  simulierte Mitspieler.
- **Tagesaufgaben & Erfolge**: rotierende Daily Quests sowie mehrstufige Achievements
  (Wildfeuer-Streak, Scharfschütze, Tempo-Dämon, Marathonläufer, …).
- **Practice Hub**: freies Training außerhalb des Lernpfads – schwache Tasten gezielt üben,
  Geschwindigkeitstests, Fehler-Heatmap.
- **Einstufungstest**: für Quereinsteiger, springt direkt zum passenden Lernpfad-Level.
- **Eigenes Maskottchen „Flowy"** (Gecko) mit Stimmungen, ausrüstbarer Kosmetik und
  Sound-Feedback (Web Audio, keine externen Dateien).
- Vollständig **client-seitig**, Fortschritt wird in `localStorage` gespeichert. Dark Mode
  inklusive.

## Entwicklung

```bash
npm install
npm run dev      # Dev-Server
npm run build    # Produktions-Build
npm run lint      # oxlint
```

## Tech-Stack

React 19 + TypeScript, Vite, Tailwind CSS v4, Zustand (mit `persist`-Middleware).
