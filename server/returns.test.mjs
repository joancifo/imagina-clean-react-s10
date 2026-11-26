// @vitest-environment node
// Sesión 10 · Paso 3 · Devoluciones en el BFF: el servidor calcula el importe y decide si se puede.
// Se prueba por HTTP, como en server/bff.test.mjs: levantando el BFF en un puerto libre.
import { createBff } from './bff.mjs';

/** El día de clase: 18 días después de la entrega de P-1004. */
const CLASS_DAY = () => new Date('2026-11-30T17:00:00Z');

async function withBff(run, { now = CLASS_DAY } = {}) {
  const server = createBff({ secret: 'secreto-de-prueba', now }).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const call = (path, { cookie, method = 'GET', body } = {}) =>
    fetch(base + path, { method, headers: { ...(cookie ? { cookie } : {}), ...(body === undefined ? {} : { 'content-type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const signIn = async (userId) => (await call('/session', { method: 'POST', body: { userId } })).headers.get('set-cookie')?.split(';')[0] ?? null;
  try {
    return await run({ call, signIn });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

const codeOf = async (response) => (await response.json()).error?.code;
const ret = (body) => ({ method: 'POST', body });

describe('GET /api/orders/:id/return-context · una respuesta con lo que necesita la pantalla', () => {
  it('pedido, líneas con lo ya devuelto y la entrega, sin el formato del transportista', () =>
    withBff(async ({ call, signIn }) => {
      const response = await call('/orders/P-1004/return-context', { cookie: await signIn('u2') });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        ord_id: 'P-1004', cust_nm: 'Clínica Dental Mar', cust_tier: 'standard', ord_st: 'shipped',
        ln_items: [{ sku: 'E-50', qty: 3, unit_prc: 140, returned_qty: 1 }],
        delivery: { trk_no: 'TRK-88412', dlv_ts: '2026-11-12T10:00:00Z' },
      });
    }));

  it('un pedido en camino llega con delivery: null («no está entregado»), no con el estado del transportista', () =>
    withBff(async ({ call, signIn }) => {
      const body = await (await call('/orders/P-1002/return-context', { cookie: await signIn('u2') })).json();
      expect(body.delivery).toBeNull();
    }));

  it('un agente no recibe el contexto: 403', () =>
    withBff(async ({ call, signIn }) => {
      const response = await call('/orders/P-1004/return-context', { cookie: await signIn('u3') });
      expect(response.status).toBe(403);
      expect(await codeOf(response)).toBe('forbidden');
    }));

  it('sin sesión: 401', () => withBff(async ({ call }) => expect((await call('/orders/P-1004/return-context')).status).toBe(401)));
});

describe('POST /api/orders/:id/returns · el servidor calcula y autoriza', () => {
  it('registra con el importe que calcula EL SERVIDOR y quien dice la cookie', () =>
    withBff(async ({ call, signIn }) => {
      const cookie = await signIn('u2');
      const response = await call('/orders/P-1004/returns', { cookie, ...ret({ sku: 'E-50', qty: 1, reason: 'NO_LONGER_NEEDED' }) });
      expect(response.status).toBe(201);
      expect(await response.json()).toEqual({ rma_id: 'RMA-002', rfd_amt: 148.4 });
      const previous = await (await call('/returns?ord_id=P-1004', { cookie })).json();
      expect(previous.at(-1)).toMatchObject({ sku: 'E-50', qty: 1, rsn_cd: 'NO_LONGER_NEEDED', rfd_amt: 148.4, req_by: 'u2' });
    }));

  it.each([
    ['un importe inventado', { sku: 'E-50', qty: 1, reason: 'DEFECTIVE', rfd_amt: 9999 }],
    ['un rol inventado', { sku: 'E-50', qty: 1, reason: 'DEFECTIVE', req_role: 'admin' }],
    ['un motivo que no existe', { sku: 'E-50', qty: 1, reason: 'CAPRICHO' }],
    ['una cantidad que no es entera', { sku: 'E-50', qty: 1.5, reason: 'DEFECTIVE' }],
    ['una cantidad cero', { sku: 'E-50', qty: 0, reason: 'DEFECTIVE' }],
  ])('rechaza %s con 422: lista blanca', (_caso, body) =>
    withBff(async ({ call, signIn }) => {
      const response = await call('/orders/P-1004/returns', { cookie: await signIn('u1'), ...ret(body) });
      expect(response.status).toBe(422);
      expect(await codeOf(response)).toBe('invalid-body');
    }));

  it('un agente no registra devoluciones: 403 forbidden', () =>
    withBff(async ({ call, signIn }) => {
      const response = await call('/orders/P-1004/returns', { cookie: await signIn('u3'), ...ret({ sku: 'E-50', qty: 1, reason: 'DEFECTIVE' }) });
      expect([response.status, await codeOf(response)]).toEqual([403, 'forbidden']);
    }));

  it('no se devuelve más de lo que queda: 409 quantity-exceeded (3 pedidas, 1 ya devuelta)', () =>
    withBff(async ({ call, signIn }) => {
      const response = await call('/orders/P-1004/returns', { cookie: await signIn('u2'), ...ret({ sku: 'E-50', qty: 3, reason: 'DEFECTIVE' }) });
      expect([response.status, await codeOf(response)]).toEqual([409, 'quantity-exceeded']);
    }));

  it('fuera de plazo (12/12 a las 10:01 UTC): 409 not-returnable', () =>
    withBff(
      async ({ call, signIn }) => {
        const response = await call('/orders/P-1004/returns', { cookie: await signIn('u2'), ...ret({ sku: 'E-50', qty: 1, reason: 'DEFECTIVE' }) });
        expect([response.status, await codeOf(response)]).toEqual([409, 'not-returnable']);
      },
      { now: () => new Date('2026-12-12T10:01:00Z') },
    ));

  it('un pedido que no está entregado: 409 not-returnable', () =>
    withBff(async ({ call, signIn }) => {
      const response = await call('/orders/P-1002/returns', { cookie: await signIn('u2'), ...ret({ sku: 'C-30', qty: 1, reason: 'DEFECTIVE' }) });
      expect([response.status, await codeOf(response)]).toEqual([409, 'not-returnable']);
    }));

  it('un pedido que no existe: 404', () =>
    withBff(async ({ call, signIn }) => {
      const response = await call('/orders/P-9999/returns', { cookie: await signIn('u2'), ...ret({ sku: 'E-50', qty: 1, reason: 'DEFECTIVE' }) });
      expect(response.status).toBe(404);
    }));
});
