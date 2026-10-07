import type { DaybreakApi } from '@shared/ipc-api'

declare global {
  interface Window {
    daybreak: DaybreakApi
  }
}
