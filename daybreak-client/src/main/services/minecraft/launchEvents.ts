import { EventEmitter } from 'node:events'
import type { ConsoleLogLine, CrashSummary, LaunchProgressEvent } from '@shared/types'

/**
 * Decouples the launch orchestrator from Electron's BrowserWindow: the orchestrator only emits
 * events here, and main/index.ts is the single place that forwards them to the renderer. Keeps
 * the orchestrator testable without an Electron window.
 */
class LaunchEventBus extends EventEmitter {
  emitProgress(event: LaunchProgressEvent): void {
    this.emit('progress', event)
  }
  emitConsoleLine(event: ConsoleLogLine): void {
    this.emit('consoleLine', event)
  }
  emitCrash(event: CrashSummary): void {
    this.emit('crash', event)
  }
}

export const launchEvents = new LaunchEventBus()
