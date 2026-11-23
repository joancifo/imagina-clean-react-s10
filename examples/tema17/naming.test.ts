// TEMA 17 · El mismo comportamiento, probado de dos maneras.
// El primer bloque sobrevive a cualquier refactor que no cambie lo que hace el código.
// El segundo se rompe en cuanto alguien cambia un nombre interno, aunque el negocio siga igual.
// Referencia: K. Beck, «Test-Driven Development» (2002) · V. Khorikov, «Unit Testing» (2020), cap. 4.
import { aManager, anAdmin, anAgent, anOrder, anApprovedOrder, aShippedOrder, aHugeOrder } from '../../src/orders/testing';
import { checkCancellation } from '../../src/orders/domain/cancellation';

describe('ASÍ · el test dice QUÉ pasa y CUÁNDO', () => {
  it('un manager puede cancelar un pedido pendiente pequeño', () => {
    expect(checkCancellation(anOrder(), aManager()).ok).toBe(true);
  });

  it('un manager NO puede cancelar un pedido pendiente por encima de su límite', () => {
    expect(checkCancellation(aHugeOrder(), aManager())).toEqual({ ok: false, error: 'over-manager-limit' });
  });

  it('un pedido enviado ya no se cancela, lo pida quien lo pida', () => {
    expect(checkCancellation(aShippedOrder(), anAdmin())).toEqual({ ok: false, error: 'already-closed' });
  });

  // Una tabla hace visible lo que falta. Las filas vacías de una tabla se ven; los tests que nadie escribió, no.
  it.each([
    ['admin', 'pendiente', anOrder, anAdmin, true],
    ['admin', 'aprobado', anApprovedOrder, anAdmin, true],
    ['manager', 'pendiente', anOrder, aManager, true],
    ['manager', 'aprobado', anApprovedOrder, aManager, false], //  ← el caso que nadie recuerda
    ['agente', 'pendiente', anOrder, anAgent, false],
    ['agente', 'aprobado', anApprovedOrder, anAgent, false],
  ] as const)('un %s con un pedido %s: %s', (_role, _status, order, actor, allowed) => {
    expect(checkCancellation(order(), actor()).ok).toBe(allowed);
  });
});

describe('ASÍ NO · el test describe la implementación', () => {
  it('checkCancellation devuelve un objeto con la propiedad ok', () => {
    // Cierto, inútil: pasaría aunque la regla estuviera del revés.
    expect(checkCancellation(anOrder(), aManager())).toHaveProperty('ok');
  });

  it('checkCancellation no lanza', () => {
    // «No explota» no es un comportamiento de negocio. Un `return null` también pasaría este test.
    expect(() => checkCancellation(aShippedOrder(), anAdmin())).not.toThrow();
  });

  it('el resultado está definido', () => {
    // toBeDefined ejecuta la línea y no comprueba nada: cobertura del 100 %, cero información.
    expect(checkCancellation(anOrder(), null)).toBeDefined();
  });
});
