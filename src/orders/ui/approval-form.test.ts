// @vitest-environment node
// Ejercicio S6 · Parte B · El esquema del formulario, sin pintar nada.
import { EMPTY_APPROVAL_FORM, parseApprovalForm, type ApprovalFormInput } from './approval-form';

const form = (patch: Partial<ApprovalFormInput> = {}): ApprovalFormInput => ({ ...EMPTY_APPROVAL_FORM, ...patch });
const SIMPLE = { requiresJustification: false };
const EXIGENTE = { requiresJustification: true };

describe('pedido corriente (no hace falta justificar)', () => {
  it('el formulario vacío vale y la nota sale como null, no como cadena vacía', () => {
    expect(parseApprovalForm(form(), SIMPLE)).toEqual({ ok: true, value: { note: null, channel: 'web' } });
  });

  it('una nota con espacios alrededor se guarda limpia', () => {
    expect(parseApprovalForm(form({ note: '  Confirmado por teléfono  ' }), SIMPLE)).toEqual({
      ok: true,
      value: { note: 'Confirmado por teléfono', channel: 'web' },
    });
  });

  it('solo espacios es lo mismo que vacío', () => {
    expect(parseApprovalForm(form({ note: '    ' }), SIMPLE)).toEqual({ ok: true, value: { note: null, channel: 'web' } });
  });

  it('una nota demasiado larga se rechaza aunque no sea obligatoria', () => {
    expect(parseApprovalForm(form({ note: 'x'.repeat(141) }), SIMPLE)).toEqual({ ok: false, error: { note: 'note-too-long' } });
  });

  it('un canal que no está en la lista no pasa', () => {
    expect(parseApprovalForm(form({ channel: 'carta' }), SIMPLE)).toEqual({ ok: false, error: { channel: 'channel-unknown' } });
  });
});

describe('pedido urgente (el dominio pide justificación)', () => {
  it('sin nota y sin confirmar devuelve LOS DOS errores a la vez', () => {
    expect(parseApprovalForm(form(), EXIGENTE)).toEqual({
      ok: false,
      error: { note: 'note-required', confirmTotal: 'confirm-required' },
    });
  });

  it('una nota corta se distingue de una nota vacía', () => {
    const result = parseApprovalForm(form({ note: 'ok', confirmTotal: true }), EXIGENTE);
    expect(result).toEqual({ ok: false, error: { note: 'note-too-short' } });
  });

  it('los nueve caracteres no llegan; los diez sí', () => {
    expect(parseApprovalForm(form({ note: '123456789', confirmTotal: true }), EXIGENTE).ok).toBe(false);
    expect(parseApprovalForm(form({ note: '1234567890', confirmTotal: true }), EXIGENTE).ok).toBe(true);
  });

  it('la cuenta de caracteres es sobre el texto limpio, no sobre los espacios', () => {
    expect(parseApprovalForm(form({ note: `   ${'a'.repeat(9)}   `, confirmTotal: true }), EXIGENTE)).toEqual({
      ok: false,
      error: { note: 'note-too-short' },
    });
  });

  it('con nota suficiente, confirmación y canal válido, sale el borrador', () => {
    expect(parseApprovalForm(form({ note: 'Cliente histórico, riesgo revisado', confirmTotal: true, channel: 'phone' }), EXIGENTE)).toEqual({
      ok: true,
      value: { note: 'Cliente histórico, riesgo revisado', channel: 'phone' },
    });
  });
});
