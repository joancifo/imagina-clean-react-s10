// API PÚBLICA de la observabilidad. El resto de la aplicación importa SOLO desde aquí.
export { LOG_FIELDS, type LogEntry, type LogField, type LogFields, type Logger, type LogLevel, type LogRecord, type LogSink, type TimeSource } from './port';
export { createBufferedLogger, type BufferedLogger, type BufferedLoggerOptions } from './buffered-logger';
export { createMemoryLogger, type MemoryLogger } from './memory-logger';
export { createHttpLogSink } from './http-log-sink';
export { traced, type TraceDeps } from './traced';
export { observePublisher } from './observed-publisher';
export { ObservabilityProvider, useLogger } from './ObservabilityProvider';
export { FeatureBoundary } from './FeatureBoundary';
