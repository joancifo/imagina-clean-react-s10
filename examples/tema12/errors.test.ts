// @vitest-environment node
import { classify, withRetry } from './errors';

describe('clasificar por origen', () => {
  it('la red caída se reintenta', () => {
    expect(classify(new TypeError('Failed to fetch'))).toMatchObject({ origin: 'red', retryable: true });
  });
  it('una regla del dominio no se reintenta: reintentar no cambia el permiso', () => {
    expect(classify({ code: 'forbidden' })).toMatchObject({ origin: 'dominio', retryable: false });
  });
  it('un conflicto sí: el estado puede haber cambiado', () => {
    expect(classify({ code: 'conflict' }).retryable).toBe(true);
  });
  it('un error de la persona usuaria se distingue de uno del dominio', () => {
    expect(classify({ code: 'reason-too-short' }).origin).toBe('usuario');
  });
  it('lo desconocido no enseña su texto crudo en pantalla', () => {
    expect(classify(new Error('ORA-00942: table or view does not exist')).message).toBe('Ha ocurrido un error inesperado');
  });
});

describe('reintento', () => {
  it('reintenta lo reintentable hasta que sale bien', async () => {
    let intentos = 0;
    const result = await withRetry(async () => {
      intentos += 1;
      if (intentos < 3) throw new TypeError('Failed to fetch');
      return 'ok';
    }, { wait: async () => {} });
    expect([result, intentos]).toEqual(['ok', 3]);
  });

  it('no reintenta lo que no tiene arreglo', async () => {
    let intentos = 0;
    await expect(withRetry(async () => { intentos += 1; throw { code: 'forbidden' }; }, { wait: async () => {} })).rejects.toEqual({ code: 'forbidden' });
    expect(intentos).toBe(1);
  });
});
