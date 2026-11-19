// @vitest-environment node
// Material S7 · El adapter de telemetría: un POST con la cookie y un fallo explícito si el BFF no lo acepta.
import { createHttpLogSink } from './http-log-sink';
import type { LogEntry } from './port';

const ENTRY: LogEntry = { level: 'info', event: 'orders.cancel', feature: 'orders', traceId: 't-1', at: '2026-11-23T18:00:00.000Z', fields: { orderId: 'P-1' } };

it('envía POST /telemetry con las entradas y la cookie de sesión', async () => {
  const fetchFn = vi.fn(async () => new Response(null, { status: 204 }));
  await createHttpLogSink(fetchFn as unknown as typeof fetch).send([ENTRY]);
  const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
  expect(url).toBe('/api/telemetry');
  expect(init.credentials).toBe('include');
  expect(JSON.parse(String(init.body))).toEqual({ entries: [ENTRY] });
});

it('si el BFF no lo acepta, falla: el logger con búfer decidirá qué hacer', async () => {
  const fetchFn = vi.fn(async () => new Response(null, { status: 422 }));
  await expect(createHttpLogSink(fetchFn as unknown as typeof fetch).send([ENTRY])).rejects.toThrow('422');
});
