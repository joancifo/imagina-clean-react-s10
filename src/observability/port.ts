// OBSERVABILIDAD · Puerto. Quien registra no sabe si el log acaba en la consola, en el BFF o en un proveedor.
// Dos reglas que no se negocian:
//   1. log() es síncrono y NUNCA lanza: medir no puede romper lo que se mide.
//   2. Lista blanca de campos: se decide qué SE PUBLICA, no qué se esconde (Tema 13).
export type LogLevel = 'info' | 'warn' | 'error';

/** Los únicos campos que pueden viajar. Ni nombres, ni motivos, ni notas: identificadores, códigos y números. */
export const LOG_FIELDS = ['orderId', 'outcome', 'code', 'durationMs', 'errorName', 'route'] as const;
export type LogField = (typeof LOG_FIELDS)[number];
export type LogFields = Partial<Record<LogField, string | number>>;

/** Lo que escribe quien registra. */
export type LogRecord = {
  level: LogLevel;
  /** Qué ha pasado, en minúsculas y con puntos: 'orders.cancel', 'events.publish_failed', 'ui.crash'. */
  event: string;
  /** Feature a la que pertenece: permite contar errores por feature y priorizar el refactor. */
  feature: string;
  /** Une todas las entradas de una misma operación. */
  traceId?: string;
  fields?: LogFields;
};

/** Lo que guarda y envía el logger: el registro completado con la hora y sin campos fuera de la lista. */
export type LogEntry = { level: LogLevel; event: string; feature: string; traceId: string | null; at: string; fields: LogFields };

export interface Logger {
  log(record: LogRecord): void;
}

/** Destino de los logs (HTTP, consola…). Este sí puede fallar: el logger se encarga de que no se note. */
export interface LogSink {
  send(entries: LogEntry[]): Promise<void>;
}

/** Reloj mínimo que necesita la observabilidad. Compatible con el Clock de Pedidos. */
export type TimeSource = { now(): Date };
