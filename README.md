# 🦎 ZehnFinger

Eine Duolingo-inspirierte Web-App, um das 10-Finger-Tippsystem spielerisch zu lernen –
komplett im Browser, ohne Backend.

## Features

- **Lernpfad im Duolingo-Stil**: 10 Units mit ~45 Lektionen, die Schritt für Schritt alle
  Tasten der deutschen QWERTZ-Tastatur einführen (Grundreihe → obere/untere Reihe →
  Zahlen → Großschreibung → Satzzeichen → Wörter & Sätze → Geschwindigkeit).
- **Live-Tastatur mit Finger-Farbcodierung**: zeigt für jede Taste den richtigen Finger an,
  inkl. Finger-Guide-Leiste und automatischem Scrollen im Text.
- **Kronen-System**: Lektionen lassen sich bis zu 5× wiederholen (steigende Schwierigkeit),
  ähnlich Duolingos Crown-Levels.
- **XP, Herzen, Gems, Streak**: Herzen regenerieren über Zeit, Serien-Frost schützt die
  Streak, Gems werden im Shop gegen Boosts und Maskottchen-Kosmetik eingetauscht.
- **Liga-System**: 10 Ligen (Bronze bis Diamant) mit wöchentlichem Auf-/Abstieg gegen
  simulierte Mitspieler.
- **Tagesaufgaben & Erfolge**: rotierende Daily Quests sowie mehrstufige Achievements
  (Wildfeuer-Streak, Scharfschütze, Tempo-Dämon, Marathonläufer, …).
- **Practice Hub**: kostenloses Training ohne Herzverlust – schwache Tasten gezielt üben,
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
