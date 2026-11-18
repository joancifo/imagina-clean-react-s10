// @vitest-environment node
import { parseExternalOrder, safeHref } from './external-data';
import { publishablePayload, redact } from './logging';

describe('datos de fuera', () => {
  it('lo que cuadra, pasa', () => {
    expect(parseExternalOrder({ id: 'P-1005', total: 10, status: 'pending' })).toEqual({ id: 'P-1005', total: 10, status: 'pending' });
  });
  it('un campo con otro tipo no pasa (aunque TypeScript lo diera por bueno con un `as`)', () => {
    expect(parseExternalOrder({ id: 'P-1005', total: '10', status: 'pending' })).toBeNull();
  });
  it('un estado inventado no pasa', () => {
    expect(parseExternalOrder({ id: 'P-1005', total: 10, status: 'aprobadísimo' })).toBeNull();
  });
  it('null, un número o una cadena tampoco', () => {
    expect([parseExternalOrder(null), parseExternalOrder(7), parseExternalOrder('P-1005')]).toEqual([null, null, null]);
  });
  it('los campos de más se quedan fuera: solo sale lo previsto', () => {
    expect(parseExternalOrder({ id: 'P-1005', total: 10, status: 'pending', isAdmin: true })).not.toHaveProperty('isAdmin');
  });
});

describe('enlaces de fuera', () => {
  it('http y https valen', () => {
    expect(safeHref('https://proveedor.example/factura')).toBe('https://proveedor.example/factura');
  });
  it('javascript: no', () => {
    expect(safeHref('javascript:alert(document.cookie)')).toBeNull();
  });
  it('data: tampoco', () => {
    expect(safeHref('data:text/html;base64,PHNjcmlwdD4=')).toBeNull();
  });
});

describe('lo que se guarda en los logs', () => {
  it('lista blanca: el nombre del cliente y el motivo no se publican', () => {
    expect(publishablePayload({ id: 'P-1', by: 'u2', customerName: 'Talleres Norte', reason: 'El cliente se ha arrepentido' })).toEqual({ id: 'P-1', by: 'u2' });
  });
  it('los datos personales que se cuelan en un mensaje se recortan', () => {
    expect(redact('Fallo al avisar a pau@taller.example con DNI 12345678Z')).toBe('Fallo al avisar a [correo] con DNI [dni]');
  });
  it('una cabecera de autorización copiada en el mensaje no se guarda', () => {
    expect(redact('request failed: authorization: Bearer abc.def.ghi')).toBe('request failed: authorization: [oculto]');
  });
});
