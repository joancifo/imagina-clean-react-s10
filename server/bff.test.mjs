// @vitest-environment node
// Ejercicio S6 · Parte A · El BFF decide quién eres, si puedes y qué datos salen.
// Se prueba por HTTP, como lo usará el navegador: levantando el servidor en un puerto libre.
import { createBff } from './bff.mjs';
import { SEED_ORDERS } from './store.mjs';

const SECRET = 'secreto-de-prueba';

/** Levanta un BFF con datos nuevos y devuelve un cliente mínimo. */
async function withBff(run, { now = () => new Date('2026-11-19T17:00:00Z'), seed = SEED_ORDERS } = {}) {
  const server = createBff({ secret: SECRET, now, seed }).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const call = (path, { cookie, method = 'GET', body } = {}) =>
    fetch(base + path, {
      method,
      headers: { ...(cookie ? { cookie } : {}), ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  call.base = base;
  const signIn = async (userId) => {
    const response = await call('/session', { method: 'POST', body: { userId } });
    return response.headers.get('set-cookie')?.split(';')[0] ?? null;
  };
  try {
    return await run({ call, signIn });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

const codeOf = async (response) => (await response.json()).error?.code;

describe('Parte A · identidad', () => {
  it('sin cookie no se ven pedidos', () =>
    withBff(async ({ call }) => {
      const response = await call('/orders');
      expect(response.status).toBe(401);
      expect(await codeOf(response)).toBe('no-session');
    }));

  it('la cookie de sesión es HttpOnly y SameSite=Strict: el JavaScript de la página no la lee', () =>
    withBff(async ({ call }) => {
      const header = (await call('/session', { method: 'POST', body: { userId: 'u2' } })).headers.get('set-cookie');
      expect(header).toMatch(/HttpOnly/i);
      expect(header).toMatch(/SameSite=Strict/i);
    }));

  it('una cookie manipulada no vale: la firma no cuadra', () =>
    withBff(async ({ call, signIn }) => {
      const cookie = await signIn('u3');
      const [name, token] = cookie.split('=');
      const payload = Buffer.from(JSON.stringify({ sub: 'u1', role: 'admin', exp: Date.now() + 60_000 })).toString('base64url');
      const forged = `${name}=${payload}.${token.split('.')[1]}`;
      expect((await call('/orders', { cookie: forged })).status).toBe(401);
    }));

  it('la cabecera x-user-id ya no concede identidad: manda la cookie firmada', () =>
    withBff(async ({ call, signIn }) => {
      const cookie = await signIn('u3'); // agente
      const response = await fetch(call.base + '/orders/P-1005/approve', { method: 'POST', headers: { cookie, 'x-user-id': 'u1' } });
      expect(response.status).toBe(403);
      expect((await (await call('/me', { cookie })).json()).usr_role).toBe('agent');
    }));

  it('una sesión caducada deja de valer', () =>
    withBff(async ({ call, signIn }) => {
      const cookie = await signIn('u2');
      const later = createBff({ secret: SECRET, now: () => new Date('2026-11-19T19:00:00Z') }).listen(0, '127.0.0.1');
      await new Promise((resolve) => later.once('listening', resolve));
      const response = await fetch(`http://127.0.0.1:${later.address().port}/api/orders`, { headers: { cookie } });
      expect(response.status).toBe(401);
      await new Promise((resolve) => later.close(resolve));
      expect((await call('/orders', { cookie })).status).toBe(200);
    }));
});

describe('Parte A · autorización real', () => {
  it('un agente no aprueba, aunque la interfaz le enseñe el botón', () =>
    withBff(async ({ call, signIn }) => {
      const response = await call('/orders/P-1005/approve', { method: 'POST', cookie: await signIn('u3') });
      expect(response.status).toBe(403);
      expect(await codeOf(response)).toBe('forbidden');
    }));

  it('un manager aprueba por debajo del umbral', () =>
    withBff(async ({ call, signIn }) => {
      const response = await call('/orders/P-1005/approve', { method: 'POST', cookie: await signIn('u2') });
      expect(response.status).toBe(200);
      expect((await response.json()).ord_st).toBe('approved');
    }));

  it('un manager no aprueba por encima del umbral; un administrador sí', () => {
    // 20 × 700 € sin descuento, con IVA: 16 940 € > 10 000 € (shared/policy.json · approval.adminFrom)
    const grande = { ord_id: 'P-2001', cust_nm: 'Obra Mayor', cust_tier: 'standard', ord_st: 'pending', owner_id: 'u2', crt_ts: '2026-11-01T09:00:00Z', ln_items: [{ sku: 'G-70', qty: 20, unit_prc: 700 }] };
    return withBff(
      async ({ call, signIn }) => {
        expect((await call('/orders/P-2001/approve', { method: 'POST', cookie: await signIn('u2') })).status).toBe(403);
        expect((await call('/orders/P-2001/approve', { method: 'POST', cookie: await signIn('u1') })).status).toBe(200);
      },
      { seed: [...SEED_ORDERS, grande] },
    );
  });

  it('un pedido que ya no está pendiente da 409, no 403', () =>
    withBff(async ({ call, signIn }) => {
      const response = await call('/orders/P-1002/approve', { method: 'POST', cookie: await signIn('u1') });
      expect(response.status).toBe(409);
      expect(await codeOf(response)).toBe('conflict');
    }));

  it('cancelar: el manager tiene su propio límite y el administrador no', () =>
    withBff(async ({ call, signIn }) => {
      expect((await call('/orders/P-1003/cancel', { method: 'POST', cookie: await signIn('u2'), body: { reason: 'Duplicado en el ERP' } })).status).toBe(403);
      expect((await call('/orders/P-1003/cancel', { method: 'POST', cookie: await signIn('u1'), body: { reason: 'Duplicado en el ERP' } })).status).toBe(200);
    }));
});

describe('Parte A · entrada y salida', () => {
  it('un motivo vacío o de más de 140 caracteres no entra', () =>
    withBff(async ({ call, signIn }) => {
      const cookie = await signIn('u1');
      const short = await call('/orders/P-1001/cancel', { method: 'POST', cookie, body: { reason: '  ' } });
      expect(short.status).toBe(422);
      expect(await codeOf(short)).toBe('invalid-body');
      expect((await call('/orders/P-1001/cancel', { method: 'POST', cookie, body: { reason: 'x'.repeat(141) } })).status).toBe(422);
    }));

  it('un campo no previsto en el cuerpo no se ignora: se rechaza', () =>
    withBff(async ({ call, signIn }) => {
      const response = await call('/orders/P-1001/cancel', { method: 'POST', cookie: await signIn('u1'), body: { reason: 'Duplicado en el ERP', ord_st: 'shipped' } });
      expect(response.status).toBe(422);
    }));

  it('un agente no recibe importes ni responsables: el dato no sale del servidor', () =>
    withBff(async ({ call, signIn }) => {
      const [order] = await (await call('/orders', { cookie: await signIn('u3') })).json();
      expect(order.ln_items).toEqual([]);
      expect(order.owner_id).toBeUndefined();
      const manager = await (await call('/orders', { cookie: await signIn('u2') })).json();
      expect(manager[0].ln_items.length).toBeGreaterThan(0);
    }));

  it('el cuerpo del error solo lleva un código: ni rutas, ni pistas, ni el motivo real', () =>
    withBff(async ({ call, signIn }) => {
      const response = await call('/orders/P-9999/approve', { method: 'POST', cookie: await signIn('u1') });
      const body = await response.json();
      expect(response.status).toBe(404);
      expect(body).toEqual({ error: { code: 'not-found' } });
      expect(JSON.stringify(body)).not.toMatch(/stack|express|\/api|sql/i);
    }));

  it('la analítica solo acepta los campos previstos: un texto libre del cliente no se reenvía', () =>
    withBff(async ({ call, signIn }) => {
      const cookie = await signIn('u1');
      expect((await call('/logs', { method: 'POST', cookie, body: { level: 'info', name: 'order_approved', payload: { id: 'P-1001', by: 'u1', total: 1, at: 'x' } } })).status).toBe(204);
      expect((await call('/logs', { method: 'POST', cookie, body: { level: 'info', name: 'order_cancelled', payload: { id: 'P-1001', customerName: 'Talleres Norte' } } })).status).toBe(422);
    }));
});

// Sesión 9 · El reinicio de datos existe SOLO para los E2E. Un endpoint que borra el estado no puede llegar a producción.
describe('reinicio de datos para los E2E', () => {
  const withTestingBff = async (run, options) => {
    const server = createBff({ secret: SECRET, ...options }).listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    try {
      return await run(base);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  };
  const cookieFor = async (base, userId) =>
    (await fetch(`${base}/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) })).headers.get('set-cookie').split(';')[0];

  it('no existe si no se pide: el BFF de producción responde 404', async () => {
    await withTestingBff(async (base) => {
      const response = await fetch(`${base}/testing/reset`, { method: 'POST' });
      expect(response.status).toBe(404);
    });
  });

  it('con testing: true, devuelve los pedidos a su estado de partida', async () => {
    await withTestingBff(async (base) => {
      const cookie = await cookieFor(base, 'u1');
      const cancel = await fetch(`${base}/orders/P-1005/cancel`, { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ reason: 'Prueba E2E' }) });
      expect(cancel.status).toBe(200);

      const reset = await fetch(`${base}/testing/reset`, { method: 'POST' });
      expect(reset.status).toBe(204);

      const order = await (await fetch(`${base}/orders/P-1005`, { headers: { cookie } })).json();
      expect(order.ord_st).toBe('pending');
    }, { testing: true });
  });
});
