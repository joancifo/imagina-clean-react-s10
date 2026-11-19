// OBSERVABILIDAD · Convierte un LogRecord en un LogEntry: hora, traceId y SOLO los campos de la lista blanca.
// Ya escrito: lo usan el logger en memoria y el logger con búfer.
import { LOG_FIELDS, type LogEntry, type LogFields, type LogRecord } from './port';

const MAX_TEXT = 80;

/** Solo claves de LOG_FIELDS con valor string o number finito. Los textos, recortados. */
export function allowedFields(fields: Record<string, unknown> = {}): LogFields {
  const result: LogFields = {};
  for (const key of LOG_FIELDS) {
    const value = fields[key];
    if (typeof value === 'number' && Number.isFinite(value)) result[key] = value;
    if (typeof value === 'string') result[key] = value.slice(0, MAX_TEXT);
  }
  return result;
}

export function toLogEntry(record: LogRecord, at: Date): LogEntry {
  return {
    level: record.level,
    event: record.event,
    feature: record.feature,
    traceId: record.traceId ?? null,
    at: at.toISOString(),
    fields: allowedFields(record.fields),
  };
}
