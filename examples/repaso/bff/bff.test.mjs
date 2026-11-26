// @vitest-environment node
// Repaso · BFF · Los niveles 2 a 4, ejecutables: npm run repaso:bff
import { createApis } from './apis.mjs';
import { createMiniBff } from './01-bff-minimo.mjs';
import { createTrustedBff, userFrom } from './02-confianza.mjs';
import { createResilientBff } from './03-fallos-parciales.mjs';

async function serve(app, run) {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    return await run((path, init) => fetch(base + path, init));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

describe('NIVEL 2 · el BFF mínimo agrega', () => {
  it('una petición, con SOLO lo que pinta la pantalla (ni internal_margin ni carrier_cost)', () =>
    serve(createMiniBff({ apis: createApis() }), async (call) => {
      expect(await (await call('/api/return-screen/P-1004')).json()).toEqual({
        ord_id: 'P-1004', cust_nm: 'Clínica Dental Mar',
        ln_items: [{ sku: 'E-50', qty: 3, unit_prc: 140, returned_qty: 1 }],
        delivery: { trk_no: 'TRK-88412', dlv_ts: '2026-11-12T10:00:00Z' },
      });
    }));

  it('en paralelo: tres fuentes de 50 ms tardan ~50 ms, no 150', () =>
    serve(createMiniBff({ apis: createApis({ delayMs: 50 }) }), async (call) => {
      const start = performance.now();
      await call('/api/return-screen/P-1004');
      expect(performance.now() - start).toBeLessThan(140);
    }));
});

describe('NIVEL 3 · lo que el navegador no decide', () => {
  const asUser = async (call, userId) => (await call('/api/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) })).headers.get('set-cookie').split(';')[0];
  const send = (call, cookie, body) => call('/api/orders/P-1004/returns', { method: 'POST', headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) });

  it('el importe lo calcula el servidor y el usuario sale de la cookie', () =>
    serve(createTrustedBff(), async (call) => {
      const response = await send(call, await asUser(call, 'u2'), { sku: 'E-50', qty: 1, reason: 'DEFECTIVE' });
      expect([response.status, await response.json()]).toEqual([201, { refund: 169.4, requestedBy: 'u2' }]);
    }));

  it('un importe o un rol en el cuerpo: 422 (lista blanca)', () =>
    serve(createTrustedBff(), async (call) => {
      const cookie = await asUser(call, 'u2');
      expect((await send(call, cookie, { sku: 'E-50', qty: 1, reason: 'DEFECTIVE', refund: 9999 })).status).toBe(422);
      expect((await send(call, cookie, { sku: 'E-50', qty: 1, reason: 'DEFECTIVE', role: 'admin' })).status).toBe(422);
    }));

  it('un agente: 403, diga lo que diga la pantalla', () =>
    serve(createTrustedBff(), async (call) => expect((await send(call, await asUser(call, 'u3'), { sku: 'E-50', qty: 1, reason: 'DEFECTIVE' })).status).toBe(403)));

  it('una cookie editada a mano («soy u1») no vale: la firma no coincide', async () => {
    expect(userFrom('sid=u1.firma-inventada')).toBeNull();
  });
});

describe('NIVEL 4 · fallos parciales y tiempos máximos', () => {
  it('Promise.all: si el transportista cae, cae TODA la pantalla (502), aunque el pedido estaba bien', () =>
    serve(createMiniBff({ apis: createApis({ carrierDown: true }) }), async (call) => expect((await call('/api/return-screen/P-1004')).status).toBe(502)));

  it('allSettled: el transportista caído es un dato que falta, declarado, no una pantalla rota', () =>
    serve(createResilientBff({ apis: createApis({ carrierDown: true }) }), async (call) => {
      const body = await (await call('/api/return-screen/P-1004')).json();
      expect([body.delivery, body.unavailable, body.returns]).toEqual([null, ['delivery'], [{ sku: 'E-50', qty: 1 }]]);
    }));

  it('un transportista a 2 segundos no retiene la respuesta: se corta a los 300 ms', () =>
    serve(createResilientBff({ apis: createApis({ carrierDelayMs: 2000 }), timeoutMs: 300 }), async (call) => {
      const start = performance.now();
      const body = await (await call('/api/return-screen/P-1004')).json();
      expect(body.unavailable).toEqual(['delivery']);
      expect(performance.now() - start).toBeLessThan(1000);
    }));
});
