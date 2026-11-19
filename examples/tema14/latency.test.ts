// @vitest-environment node
// TEMA 14 · Media frente a percentiles, con los datos que deja la observabilidad.
import { percentile, summarizeLatency, type TimedEntry } from './latency';

const timed = (event: string, durationMs: number, outcome = 'ok'): TimedEntry => ({ event, fields: { durationMs, outcome } });

it('la media engaña: 19 operaciones rápidas y una de 8 segundos', () => {
  const durations = [...Array.from({ length: 19 }, () => 100), 8000];
  const mean = durations.reduce((sum, value) => sum + value, 0) / durations.length;
  expect(Math.round(mean)).toBe(495); // nadie ha esperado 495 ms
  expect(percentile(durations, 50)).toBe(100); // la experiencia típica
  expect(percentile(durations, 95)).toBe(100); // 19 de 20 dentro de 100 ms…
  expect(percentile(durations, 100)).toBe(8000); // …y alguien esperó 8 s
});

it('resume por operación y pone primero la de peor p95', () => {
  const entries = [
    timed('orders.cancel', 120), timed('orders.cancel', 140), timed('orders.cancel', 3900, 'error'),
    timed('orders.load_detail', 80), timed('orders.load_detail', 95),
    { event: 'ui.crash', fields: { outcome: 'exception' } }, // sin duración: no cuenta para latencias
  ];
  expect(summarizeLatency(entries)).toEqual([
    { event: 'orders.cancel', count: 3, p50: 140, p95: 3900, errorRate: 0.33 },
    { event: 'orders.load_detail', count: 2, p50: 80, p95: 95, errorRate: 0 },
  ]);
});
