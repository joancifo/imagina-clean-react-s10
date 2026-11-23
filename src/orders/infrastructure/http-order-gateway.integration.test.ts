// @vitest-environment node
// Ejercicio S8 · Parte C · El adapter HTTP contra una red SIMULADA (MSW).
//
// Qué se prueba aquí que no se prueba en otro sitio:
//   · la petición que SALE: ruta, método, credenciales (la cookie de sesión viaja o no viaja);
//   · la respuesta que ENTRA: un código de estado por cada cosa que puede ir mal, y el fallo estable
//     que el caso de uso recibirá a cambio.
//
// Qué NO se prueba aquí: que el backend responda de verdad así. Eso lo dice el test de CONTRATO
// (order-gateway.contract.test.ts), que habla con `server/bff.mjs`. Los dos hacen falta:
// el contrato dice qué respuestas EXISTEN; este archivo dice qué hacemos con cada una.
// OMITIDO de partida · Quita los `.skip` cuando empieces la Parte C.
import { OrderGatewayError } from '../application/ports';
import { createCancellationReason, type CancellationReason } from '../domain/cancellation-reason';
import { API, aDto, failsWith, networkIsDown, ordersServer, recordRequests, respondsWithJson, respondsWithText } from '../testing';
import { createHttpOrderGateway } from './http-order-gateway';

const server = ordersServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const gateway = () => createHttpOrderGateway(fetch, API);

const reason = createCancellationReason('Cliente duplicado en el ERP');
if (!reason.ok) throw new Error('motivo de prueba no válido');
const REASON: CancellationReason = reason.value;

const failureOf = async (promise: Promise<unknown>) => {
  try {
    await promise;
    return 'no-error';
  } catch (error) {
    return error instanceof OrderGatewayError ? error.failure : `otra excepción: ${String(error)}`;
  }
};

describe.skip('Parte C · la petición que sale', () => {
  it('pide el pedido por su ruta, con la cookie de sesión y sin inventarse cabeceras', async () => {
    const { requests, handler } = recordRequests();
    server.use(handler);

    await gateway().findById('P-1005');

    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe(`${API}/orders/P-1005`);
    expect(requests[0].method).toBe('GET');
    expect(requests[0].credentials).toBe('include'); // sin esto, el BFF no sabe quién pregunta
  });

  it('escapa el identificador antes de meterlo en la URL', async () => {
    const { requests, handler } = recordRequests();
    server.use(handler, respondsWithJson('get', '/orders/:id', aDto()));

    await gateway().findById('P 10/05');

    expect(requests[0].url).toBe(`${API}/orders/P%2010%2F05`);
  });

  it('cancelar envía el motivo en el cuerpo y NADA más (el BFF rechaza los campos de sobra)', async () => {
    const { requests, handler } = recordRequests();
    server.use(handler);

    await gateway().cancel({ orderId: 'P-1005', reason: REASON, cancelledBy: 'u2' });

    expect(requests[0].method).toBe('POST');
    expect(await requests[0].json()).toEqual({ reason: REASON });
  });
});

describe.skip('Parte C · cada respuesta, un fallo estable', () => {
  it('404 al leer no es un error: es «no existe»', async () => {
    expect(await gateway().findById('P-9999')).toBeNull();
  });

  it.each([
    ['401 sin sesión', 401, 'no-session', 'forbidden'],
    ['403 sin permiso', 403, 'forbidden', 'forbidden'],
    ['404 al cancelar', 404, 'not-found', 'not-found'],
    ['409 estado incompatible', 409, 'conflict', 'conflict'],
    ['422 cuerpo no válido', 422, 'invalid-body', 'invalid'],
  ])('%s → %s', async (_label, status, code, expected) => {
    server.use(failsWith('post', '/orders/:id/cancel', status, code));
    expect(await failureOf(gateway().cancel({ orderId: 'P-1005', reason: REASON, cancelledBy: 'u2' }))).toBe(expected);
  });

  it('400 sin cuerpo reconocible: manda el estado HTTP', async () => {
    server.use(failsWith('post', '/orders/:id/approve', 400));
    expect(await failureOf(gateway().approve({ orderId: 'P-1005', approvedBy: 'u1' }))).toBe('invalid');
  });

  it('500: no hay nada que el caso de uso pueda hacer, salvo reintentar', async () => {
    server.use(failsWith('get', '/orders/:id', 500, 'boom'));
    expect(await failureOf(gateway().findById('P-1005'))).toBe('unavailable');
  });

  it('una respuesta que no es JSON (el 502 de un proxy, el HTML de un portal) no revienta el parseo', async () => {
    server.use(respondsWithText('get', '/orders/:id', 502));
    expect(await failureOf(gateway().findById('P-1005'))).toBe('unavailable');
  });

  it('sin respuesta (red caída, DNS, CORS): fetch RECHAZA, no devuelve un 500', async () => {
    server.use(networkIsDown('get', '/orders/:id'));
    expect(await failureOf(gateway().findById('P-1005'))).toBe('unavailable');
  });
});

describe.skip('Parte C · un 200 con el cuerpo equivocado también es un fallo', () => {
  it('un backend que cambia un tipo sin avisar se detecta en la frontera, no en la pantalla', async () => {
    server.use(respondsWithJson('get', '/orders/:id', { ...aDto(), ln_items: [{ sku: 'A-10', qty: '40', unit_prc: 32.5 }] }));
    expect(await failureOf(gateway().findById('P-1005'))).toBe('invalid');
  });

  it('un estado nuevo del backend no entra en el dominio disfrazado', async () => {
    server.use(respondsWithJson('get', '/orders/:id', { ...aDto(), ord_st: 'on_hold' }));
    expect(await failureOf(gateway().findById('P-1005'))).toBe('invalid');
  });

  it('un 200 con el cuerpo de otra cosa (una redirección a la pantalla de login, por ejemplo)', async () => {
    server.use(respondsWithJson('get', '/orders/:id', { login: true }));
    expect(await failureOf(gateway().findById('P-1005'))).toBe('invalid');
  });
});
