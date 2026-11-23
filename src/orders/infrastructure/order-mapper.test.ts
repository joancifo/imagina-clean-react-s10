// @vitest-environment node
// Ejercicio S8 · Parte A · La frontera por la que entran TODOS los datos de fuera.
//
// Hasta hoy este archivo no existía. `order-mapper.ts` llevaba siete sesiones traduciendo todo lo que
// llega del backend sin un solo test, y el adapter escribía `const dto: OrderDto = await response.json()`:
// una promesa que nadie había comprobado. TypeScript no comprueba la red.
//
// Los casos «raros» de este archivo no son inventados: son lo que el BFF envía de verdad (recorta campos
// para un agente) y lo que cualquier backend acaba enviando algún día (un número como texto, un estado nuevo).
// OMITIDO de partida · Quita los `.skip` cuando empieces la Parte A.
import { aDto, aTrimmedDto, SEED_DTOS } from '../testing';
import { describeProblem, parseOrderDto } from './order-dto';
import { parseOrder, parseOrders, toOrder } from './order-mapper';

const value = <T>(result: { ok: true; value: T } | { ok: false; error: unknown }): T => {
  if (!result.ok) throw new Error(`se esperaba ok y ha llegado ${JSON.stringify(result.error)}`);
  return result.value;
};

describe.skip('Parte A · traducir el backend al dominio', () => {
  it('traduce los nombres del backend al lenguaje del negocio', () => {
    expect(toOrder(aDto({ ord_id: 'P-7', cust_nm: 'Hotel Brisa', cust_tier: 'silver', ord_st: 'approved' }))).toEqual({
      id: 'P-7',
      customerName: 'Hotel Brisa',
      customerTier: 'silver',
      status: 'approved',
      ownerId: 'u2',
      createdAt: '2026-11-02T09:00:00Z',
      lines: [{ sku: 'A-10', quantity: 1, unitPrice: 100 }],
    });
  });

  // Sesión 6 · El BFF no le dice a un agente de quién es el pedido. El campo NO LLEGA.
  it('un pedido sin responsable llega con ownerId null, nunca con undefined', () => {
    const order = value(parseOrder(aTrimmedDto()));
    expect(order.ownerId).toBeNull();
    expect('ownerId' in order).toBe(true); // el campo existe y dice «no lo sé»; no desaparece del objeto
  });

  it('la nota del cliente solo existe si llega como texto', () => {
    expect(value(parseOrder(aDto({ cust_note: 'Entregar el viernes' }))).customerNote).toBe('Entregar el viernes');
    expect('customerNote' in value(parseOrder(aDto()))).toBe(false);
    // «Opcional» no quiere decir «lo que sea»: si llega, tiene que ser texto.
    expect(parseOrder({ ...aDto(), cust_note: 42 })).toEqual({ ok: false, error: { field: 'cust_note', reason: 'type' } });
  });

  it('un campo nuevo del backend no rompe al cliente, pero tampoco entra', () => {
    const parsed = value(parseOrderDto({ ...aDto(), priority_flag: true, internal_notes: 'no mirar' }));
    expect(parsed).toEqual(aDto());
  });
});

describe.skip('Parte A · rechazar lo que no se puede usar', () => {
  it('un campo obligatorio que no llega se dice por su nombre', () => {
    const { ord_id: _omit, ...withoutId } = aDto();
    expect(parseOrder(withoutId)).toEqual({ ok: false, error: { field: 'ord_id', reason: 'missing' } });
  });

  // El caso que de verdad hace daño: "40" × 32,5 = NaN, y un NaN viaja hasta la pantalla sin que salte nada.
  it('una cantidad que llega como texto es un error de TIPO, no un total de NaN', () => {
    const dto = { ...aDto(), ln_items: [{ sku: 'A-10', qty: '40', unit_prc: 32.5 }] };
    expect(parseOrder(dto)).toEqual({ ok: false, error: { field: 'ln_items[0].qty', reason: 'type' } });
  });

  it('una lista de líneas que no es una lista', () => {
    expect(parseOrder({ ...aDto(), ln_items: null })).toEqual({ ok: false, error: { field: 'ln_items', reason: 'type' } });
    expect(parseOrder({ ...aDto(), ln_items: undefined })).toEqual({ ok: false, error: { field: 'ln_items', reason: 'missing' } });
  });

  it('un estado o un nivel de cliente que no conocemos se detectan en la frontera', () => {
    expect(parseOrder({ ...aDto(), ord_st: 'on_hold' })).toEqual({ ok: false, error: { field: 'ord_st', reason: 'value' } });
    expect(parseOrder({ ...aDto(), cust_tier: 'platinum' })).toEqual({ ok: false, error: { field: 'cust_tier', reason: 'value' } });
  });

  it('lo que ni siquiera es un objeto', () => {
    expect(parseOrder(null).ok).toBe(false);
    expect(parseOrder([aDto()]).ok).toBe(false);
    expect(parseOrder('<html>502</html>').ok).toBe(false);
  });

  it('una lista con una fila mala no se enseña a medias: falla entera y dice cuál', () => {
    const broken = [aDto({ ord_id: 'P-1' }), { ...aDto({ ord_id: 'P-2' }), crt_ts: 1762070400000 }];
    expect(parseOrders(broken)).toEqual({ ok: false, error: { field: '[1].crt_ts', reason: 'type' } });
  });

  it('una lista vacía es una lista, no un error', () => {
    expect(parseOrders([])).toEqual({ ok: true, value: [] });
  });

  // Los casos de abajo salen de `npm run mutate -- src/orders/infrastructure/order-dto.ts`:
  // cada uno mata un mutante que sobrevivía, es decir, una línea que se ejecutaba sin que nadie la comprobara.
  it('no llegar nada se distingue de llegar algo con la forma equivocada', () => {
    expect(parseOrder(undefined)).toEqual({ ok: false, error: { field: '(raíz)', reason: 'missing' } });
    expect(parseOrders(undefined)).toEqual({ ok: false, error: { field: '(raíz)', reason: 'missing' } });
    expect(parseOrders('nada de esto')).toEqual({ ok: false, error: { field: '(raíz)', reason: 'type' } });
  });

  it('cada campo de una línea se comprueba por separado y se dice por su nombre', () => {
    expect(parseOrder({ ...aDto(), ln_items: [{ qty: 1, unit_prc: 10 }] })).toEqual({ ok: false, error: { field: 'ln_items[0].sku', reason: 'missing' } });
    expect(parseOrder({ ...aDto(), ln_items: [{ sku: 'A-10', qty: 1 }] })).toEqual({ ok: false, error: { field: 'ln_items[0].unit_prc', reason: 'missing' } });
    expect(parseOrder({ ...aDto(), ln_items: [['A-10', 1, 10]] })).toEqual({ ok: false, error: { field: 'ln_items[0]', reason: 'type' } });
  });

  // Un backend que divide entre cero envía `null` en el JSON… o un NaN si el dato nunca llegó a serializarse.
  it('un número que no es un número tampoco pasa', () => {
    expect(parseOrder({ ...aDto(), ln_items: [{ sku: 'A-10', qty: Number.NaN, unit_prc: 10 }] })).toEqual({ ok: false, error: { field: 'ln_items[0].qty', reason: 'type' } });
    expect(parseOrder({ ...aDto(), ln_items: [{ sku: 'A-10', qty: 1, unit_prc: Number.POSITIVE_INFINITY }] })).toEqual({ ok: false, error: { field: 'ln_items[0].unit_prc', reason: 'type' } });
  });

  it('un responsable con el tipo equivocado se rechaza, y si no llega NO se inventa la clave', () => {
    expect(parseOrder({ ...aDto(), owner_id: 42 })).toEqual({ ok: false, error: { field: 'owner_id', reason: 'type' } });
    const parsed = parseOrderDto(aTrimmedDto());
    expect(parsed.ok && 'owner_id' in parsed.value).toBe(false);
  });

  it('el problema se cuenta en una frase que sirve para depurar', () => {
    expect(describeProblem({ field: 'ord_id', reason: 'missing' })).toBe('Respuesta inesperada del backend: ord_id (no llega)');
    expect(describeProblem({ field: 'ln_items[0].qty', reason: 'type' })).toBe('Respuesta inesperada del backend: ln_items[0].qty (tipo incorrecto)');
    expect(describeProblem({ field: 'ord_st', reason: 'value' })).toBe('Respuesta inesperada del backend: ord_st (valor desconocido)');
  });
});

// Contrato con el backend del curso: si alguien cambia server/store.mjs, este test lo dice aquí
// y no tres capas más adentro, con otro nombre y sin pistas.
describe.skip('Parte A · los datos reales del backend pasan por la frontera', () => {
  it.each(SEED_DTOS.map((dto) => [dto.ord_id, dto] as const))('%s', (_id, dto) => {
    expect(parseOrder(dto).ok).toBe(true);
  });
});
