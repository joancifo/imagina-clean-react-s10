// @vitest-environment node
// Material S7 · El BFF recibe la telemetría del navegador: misma lista blanca, por segunda vez.
import { createBff } from './bff.mjs';

async function withBff(run) {
  const lines = [];
  const server = createBff({ secret: 's', now: () => new Date('2026-11-23T18:00:00Z'), telemetrySink: (line) => lines.push(line) }).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const login = await fetch(`${base}/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId: 'u2' }) });
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const send = (body, withCookie = true) =>
    fetch(`${base}/telemetry`, { method: 'POST', headers: { 'content-type': 'application/json', ...(withCookie ? { cookie } : {}) }, body: JSON.stringify(body) });
  try {
    return await run({ send, lines });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

const ENTRY = { level: 'warn', event: 'orders.cancel', feature: 'orders', traceId: 't-1', at: '2026-11-23T17:59:59.000Z', fields: { orderId: 'P-1005', outcome: 'error', code: 'conflict', durationMs: 42 } };

describe('BFF · /api/telemetry', () => {
  it('acepta un lote válido y lo escribe con quién lo envía y cuándo llegó', () =>
    withBff(async ({ send, lines }) => {
      expect((await send({ entries: [ENTRY] })).status).toBe(204);
      expect(lines).toEqual([{ ...ENTRY, actor: 'u2', receivedAt: '2026-11-23T18:00:00.000Z' }]);
    }));

  it('sin sesión no se acepta telemetría', () =>
    withBff(async ({ send, lines }) => {
      expect((await send({ entries: [ENTRY] }, false)).status).toBe(401);
      expect(lines).toEqual([]);
    }));

  it('un campo fuera de la lista blanca tumba el lote entero', () =>
    withBff(async ({ send, lines }) => {
      const leaky = { ...ENTRY, fields: { ...ENTRY.fields, reason: 'El cliente está enfadado' } };
      expect((await send({ entries: [ENTRY, leaky] })).status).toBe(422);
      expect(lines).toEqual([]);
    }));

  it('ni lotes vacíos, ni lotes gigantes, ni nombres de evento con espacios', () =>
    withBff(async ({ send }) => {
      expect((await send({ entries: [] })).status).toBe(422);
      expect((await send({ entries: Array.from({ length: 51 }, () => ENTRY) })).status).toBe(422);
      expect((await send({ entries: [{ ...ENTRY, event: 'Pedido de Talleres Norte' }] })).status).toBe(422);
    }));
});
