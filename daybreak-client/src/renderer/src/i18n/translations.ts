import type { Language } from '@shared/types'

export const translations = {
  de: {
    nav: {
      home: 'Home',
      mods: 'Mods',
      community: 'Community',
      cosmetics: 'Cosmetics',
      hosting: 'Hosting',
      settings: 'Einstellungen',
      console: 'Konsole'
    },
    home: {
      playNow: 'PLAY NOW',
      stop: 'Stoppen',
      manageProfiles: 'Profile verwalten',
      noAccount: 'Kein Konto angemeldet',
      login: 'Mit Microsoft anmelden',
      playtime: 'Spielzeit',
      partnerServers: 'Partner-Server',
      news: 'News',
      addressCopied: 'Adresse kopiert!',
      launching: 'Wird gestartet ...'
    },
    profiles: {
      title: 'Profile verwalten',
      create: 'Neues Profil',
      duplicate: 'Duplizieren',
      delete: 'Löschen',
      export: 'Exportieren',
      import: 'Importieren',
      name: 'Name',
      edition: 'Edition',
      version: 'Minecraft-Version',
      loader: 'Loader',
      ram: 'Arbeitsspeicher (MB)',
      javaArgs: 'JVM-Argumente',
      save: 'Speichern',
      cancel: 'Abbrechen'
    },
    accounts: {
      title: 'Konten',
      addAccount: 'Konto hinzufügen',
      remove: 'Entfernen',
      activate: 'Aktivieren',
      deviceCodeInstructions: 'Öffne {url} und gib diesen Code ein:',
      cancel: 'Abbrechen',
      noClientId:
        'Keine Microsoft-Client-ID konfiguriert. Trage sie unter Einstellungen > Konten ein oder setze DAYBREAK_MICROSOFT_CLIENT_ID.'
    },
    mods: {
      title: 'Mods',
      search: 'Suche',
      install: 'Installieren',
      installed: 'Installiert',
      enable: 'Aktivieren',
      disable: 'Deaktivieren',
      remove: 'Entfernen',
      addManual: 'Manuell hinzufügen',
      checkUpdates: 'Nach Updates suchen',
      updateAll: 'Alle aktualisieren',
      importModpack: 'Modpack importieren',
      curseforgeDisabled:
        'CurseForge ist deaktiviert: Kein API-Schlüssel hinterlegt. Trage ihn unter Einstellungen ein oder setze CURSEFORGE_API_KEY.',
      distributionBlocked: 'Der Autor erlaubt keinen Download über die API. Mod-Seite öffnen.'
    },
    comingSoon: 'Kommt bald',
    settings: {
      title: 'Einstellungen',
      language: 'Sprache',
      ram: 'Standard-Arbeitsspeicher (MB)',
      javaPath: 'Java-Pfad',
      scanJava: 'Java suchen',
      gameDir: 'Standard-Spielordner',
      curseforgeKey: 'CurseForge-API-Schlüssel',
      microsoftClientId: 'Microsoft-Client-ID',
      discordRpc: 'Discord Rich Presence',
      autoUpdate: 'Automatische Updates',
      save: 'Speichern'
    },
    console: {
      title: 'Konsole',
      clear: 'Leeren',
      noOutput: 'Keine Ausgabe. Starte ein Profil, um die Konsole zu sehen.'
    },
    setup: {
      title: 'Willkommen bei Daybreak Client',
      step1: 'Sprache wählen',
      step2: 'Java suchen',
      step3: 'Arbeitsspeicher',
      step4: 'Anmelden (optional)',
      finish: 'Fertig',
      skip: 'Später',
      next: 'Weiter'
    },
    common: {
      loading: 'Lädt ...',
      error: 'Fehler',
      retry: 'Erneut versuchen',
      close: 'Schließen'
    }
  },
  en: {
    nav: {
      home: 'Home',
      mods: 'Mods',
      community: 'Community',
      cosmetics: 'Cosmetics',
      hosting: 'Hosting',
      settings: 'Settings',
      console: 'Console'
    },
    home: {
      playNow: 'PLAY NOW',
      stop: 'Stop',
      manageProfiles: 'Manage Profiles',
      noAccount: 'No account signed in',
      login: 'Sign in with Microsoft',
      playtime: 'Playtime',
      partnerServers: 'Partner Servers',
      news: 'News',
      addressCopied: 'Address copied!',
      launching: 'Launching ...'
    },
    profiles: {
      title: 'Manage Profiles',
      create: 'New Profile',
      duplicate: 'Duplicate',
      delete: 'Delete',
      export: 'Export',
      import: 'Import',
      name: 'Name',
      edition: 'Edition',
      version: 'Minecraft Version',
      loader: 'Loader',
      ram: 'RAM (MB)',
      javaArgs: 'JVM Arguments',
      save: 'Save',
      cancel: 'Cancel'
    },
    accounts: {
      title: 'Accounts',
      addAccount: 'Add Account',
      remove: 'Remove',
      activate: 'Activate',
      deviceCodeInstructions: 'Open {url} and enter this code:',
      cancel: 'Cancel',
      noClientId:
        'No Microsoft client ID configured. Set it under Settings > Accounts or set DAYBREAK_MICROSOFT_CLIENT_ID.'
    },
    mods: {
      title: 'Mods',
      search: 'Search',
      install: 'Install',
      installed: 'Installed',
      enable: 'Enable',
      disable: 'Disable',
      remove: 'Remove',
      addManual: 'Add manually',
      checkUpdates: 'Check for updates',
      updateAll: 'Update all',
      importModpack: 'Import modpack',
      curseforgeDisabled:
        'CurseForge is disabled: no API key set. Add one in Settings or set CURSEFORGE_API_KEY.',
      distributionBlocked: 'The author disallows API downloads. Open the mod page instead.'
    },
    comingSoon: 'Coming soon',
    settings: {
      title: 'Settings',
      language: 'Language',
      ram: 'Default RAM (MB)',
      javaPath: 'Java Path',
      scanJava: 'Scan for Java',
      gameDir: 'Default Game Directory',
      curseforgeKey: 'CurseForge API Key',
      microsoftClientId: 'Microsoft Client ID',
      discordRpc: 'Discord Rich Presence',
      autoUpdate: 'Automatic Updates',
      save: 'Save'
    },
    console: {
      title: 'Console',
      clear: 'Clear',
      noOutput: 'No output yet. Launch a profile to see the console.'
    },
    setup: {
      title: 'Welcome to Daybreak Client',
      step1: 'Choose Language',
      step2: 'Find Java',
      step3: 'Memory',
      step4: 'Sign in (optional)',
      finish: 'Finish',
      skip: 'Skip',
      next: 'Next'
    },
    common: {
      loading: 'Loading ...',
      error: 'Error',
      retry: 'Retry',
      close: 'Close'
    }
  }
} satisfies Record<Language, unknown>

export type TranslationDict = typeof translations.de
