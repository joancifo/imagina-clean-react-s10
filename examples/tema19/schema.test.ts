// @vitest-environment node
// TEMA 19 · Validar en la frontera: lo que cuesta un `as` sobre datos que llegan de fuera.
//
// `const dto = await response.json() as Pedido` no comprueba nada: es una promesa del programador,
// no del backend. El tipo desaparece al compilar; el dato equivocado sigue ahí.
import { err, ok, type Result } from '../../src/orders/domain/result';

type PedidoDeFuera = { id: string; unidades: number; precio: number };

const totalDe = (pedido: PedidoDeFuera) => pedido.unidades * pedido.precio;

/** Lo que de verdad responde un backend al que alguien ha «mejorado» para que los números se lean bien. */
const RESPUESTA = { id: 'P-1', unidades: 40, precio: '32,5' };

describe('sin validar', () => {
  it('el `as` compila, el NaN viaja', () => {
    const pedido = RESPUESTA as unknown as PedidoDeFuera; // el compilador se calla
    expect(Number.isNaN(totalDe(pedido))).toBe(true); // 40 * "32,5" → NaN
  });

  it('y el NaN llega a la pantalla con un formato impecable', () => {
    const pedido = RESPUESTA as unknown as PedidoDeFuera;
    expect(new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalDe(pedido))).toContain('NaN');
  });

  // El caso silencioso, que es peor: una cadena vacía se convierte en CERO y nadie ve un error.
  it('un campo vacío no da NaN: da 0 €, y un 0 € parece un dato', () => {
    const pedido = { id: 'P-1', unidades: 40, precio: '' } as unknown as PedidoDeFuera;
    expect(totalDe(pedido)).toBe(0);
  });
});

describe('validando en la frontera', () => {
  type Problema = { campo: string; motivo: 'falta' | 'tipo' };

  function parsear(raw: unknown): Result<PedidoDeFuera, Problema> {
    if (raw === null || typeof raw !== 'object') return err({ campo: '(raíz)', motivo: 'tipo' });
    const source = raw as Record<string, unknown>;
    for (const [campo, esperado] of [['id', 'string'], ['unidades', 'number'], ['precio', 'number']] as const) {
      if (source[campo] === undefined) return err({ campo, motivo: 'falta' });
      if (typeof source[campo] !== esperado) return err({ campo, motivo: 'tipo' });
    }
    return ok({ id: source.id as string, unidades: source.unidades as number, precio: source.precio as number });
  }

  it('el error aparece donde está la causa, con el nombre del campo', () => {
    expect(parsear(RESPUESTA)).toEqual({ ok: false, error: { campo: 'precio', motivo: 'tipo' } });
  });

  it('lo que pasa, pasa con el tipo que promete', () => {
    const parsed = parsear({ id: 'P-1', unidades: 40, precio: 32.5 });
    expect(parsed.ok && totalDe(parsed.value)).toBe(1300);
  });

  it('un campo que no llega se distingue de un campo con el tipo equivocado', () => {
    expect(parsear({ id: 'P-1', precio: 32.5 })).toEqual({ ok: false, error: { campo: 'unidades', motivo: 'falta' } });
  });
});
