import { BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import { is } from '../utils/environment'

let mainWindow: BrowserWindow | null = null

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

export function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  window.on('ready-to-show', () => {
    window.show()
  })

  // Surface renderer/preload failures in the main process log instead of a silently blank
  // window - there is no on-screen error boundary yet in Phase 1.
  window.webContents.on('preload-error', (_event, preloadPath, error) => {
    console.error(`[Daybreak Client] Preload-Skript ${preloadPath} fehlgeschlagen:`, error)
  })
  window.webContents.on('console-message', (event) => {
    if (event.level === 'error' || event.level === 'warning') {
      console.error(`[renderer] ${event.sourceId}:${event.lineNumber} ${event.message}`)
    }
  })
  window.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error(`[Daybreak Client] Laden der Oberfläche fehlgeschlagen (${errorCode}): ${errorDescription}`)
  })

  // Any link clicked inside the app opens in the user's real browser, never a second
  // Electron window with full Node/Electron access.
  window.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow = window
  window.on('closed', () => {
    mainWindow = null
  })

  return window
}
