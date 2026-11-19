// OBSERVABILIDAD · Fake del puerto Logger: guarda las entradas en memoria para que los tests las lean.
// Es una implementación de verdad (aplica la lista blanca), no un vi.fn(): si el código registra un campo
// que no debe, el test lo ve igual que lo vería producción.
import { toLogEntry } from './log-entry';
import type { LogEntry, Logger, TimeSource } from './port';

export type MemoryLogger = Logger & { readonly entries: LogEntry[] };

export function createMemoryLogger(clock: TimeSource = { now: () => new Date('2026-11-23T17:00:00Z') }): MemoryLogger {
  const entries: LogEntry[] = [];
  return {
    entries,
    log(record) {
      entries.push(toLogEntry(record, clock.now()));
    },
  };
}
