import { useSyncExternalStore } from 'react';
import { db } from './localDb';

// Re-rendert Komponenten, sobald sich die lokale Datenbank ändert.
export function useDbVersion() {
  return useSyncExternalStore(
    (cb) => db.subscribe(cb),
    () => db.getState(),
  );
}
