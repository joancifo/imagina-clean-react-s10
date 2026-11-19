// @vitest-environment node
// Ejercicio S6 · Parte B · El adapter de errores: una tabla, no una escalera de if.
import { failureFor } from './gateway-failure';

describe('failureFor', () => {
  it('manda el código del cuerpo cuando el BFF lo envía', () => {
    expect(failureFor(403, { error: { code: 'forbidden' } })).toBe('forbidden');
    expect(failureFor(409, { error: { code: 'conflict' } })).toBe('conflict');
    expect(failureFor(422, { error: { code: 'invalid-body' } })).toBe('invalid');
  });

  it('una sesión caducada es «no puedes», no «no hay servidor»', () => {
    expect(failureFor(401, { error: { code: 'no-session' } })).toBe('forbidden');
  });

  it('sin cuerpo útil decide el estado HTTP', () => {
    expect(failureFor(404, null)).toBe('not-found');
    expect(failureFor(409, 'vaya')).toBe('conflict');
    expect(failureFor(500, null)).toBe('unavailable');
  });

  it('un código desconocido NO se interpreta: cae en el estado HTTP', () => {
    expect(failureFor(409, { error: { code: 'cosa-rara' } })).toBe('conflict');
    expect(failureFor(418, { error: { code: 'cosa-rara' } })).toBe('unavailable');
  });

  it('un cuerpo manipulado no rompe el adapter', () => {
    expect(failureFor(403, { error: { code: { toString: () => 'forbidden' } } })).toBe('forbidden');
    expect(failureFor(403, [])).toBe('forbidden');
  });
});
