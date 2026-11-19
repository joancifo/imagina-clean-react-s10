// TEMA 14 · De los logs a las prioridades. Las entradas que deja traced() llevan event, outcome y durationMs:
// con eso se puede responder «¿qué operación es lenta?» y «¿cuál falla más?» con números, no con impresiones.
// Percentiles y no medias: si 9 de cada 10 cancelaciones tardan 100 ms y una tarda 8 s, la media (≈ 900 ms)
// no describe a nadie; el p95 dice que una de cada veinte personas espera segundos.
export type TimedEntry = { event: string; fields: { outcome?: string | number; durationMs?: string | number } };
export type LatencySummary = { event: string; count: number; p50: number; p95: number; errorRate: number };

/** Percentil por el método del rango más cercano (nearest-rank). values no hace falta que llegue ordenado. */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.max(0, rank - 1)];
}

/** Agrupa por operación y ordena: primero la que peor p95 tiene. Ese es el primer candidato a mirar. */
export function summarizeLatency(entries: TimedEntry[]): LatencySummary[] {
  const byEvent = new Map<string, { durations: number[]; failures: number }>();
  for (const entry of entries) {
    const duration = entry.fields.durationMs;
    if (typeof duration !== 'number') continue;
    const group = byEvent.get(entry.event) ?? { durations: [], failures: 0 };
    group.durations.push(duration);
    if (entry.fields.outcome !== 'ok') group.failures += 1;
    byEvent.set(entry.event, group);
  }
  return [...byEvent.entries()]
    .map(([event, { durations, failures }]) => ({
      event,
      count: durations.length,
      p50: percentile(durations, 50),
      p95: percentile(durations, 95),
      errorRate: Math.round((failures / durations.length) * 100) / 100,
    }))
    .sort((a, b) => b.p95 - a.p95);
}
