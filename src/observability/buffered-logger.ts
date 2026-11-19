// OBSERVABILIDAD · Logger con búfer: agrupa entradas y las envía por lotes a un LogSink.
// Por qué un búfer: una petición por log satura la red justo cuando la aplicación va mal (muchos errores a la vez).
// Garantías que piden los tests (buffered-logger.test.ts):
//   · log() es síncrono y nunca lanza.
//   · flush() nunca rechaza: si el destino falla, las entradas esperan al siguiente envío.
//   · El búfer tiene tope: si el destino lleva caído mucho rato, se descartan las MÁS ANTIGUAS y se cuentan.
//   · Nunca se envía dos veces la misma entrada aunque se llame a flush() dos veces seguidas.
import type { Logger, LogSink, TimeSource } from './port';

export type BufferedLogger = Logger & {
  /** Envía todo lo pendiente. Nunca rechaza. */
  flush(): Promise<void>;
  /** Entradas que esperan envío. */
  pending(): number;
  /** Entradas descartadas por superar maxBuffer. */
  dropped(): number;
};

export type BufferedLoggerOptions = { sink: LogSink; clock: TimeSource; maxBatch?: number; maxBuffer?: number };

export function createBufferedLogger(_options: BufferedLoggerOptions): BufferedLogger {
  throw new Error('Por implementar (Ejercicio S7 · Parte A)');
}
