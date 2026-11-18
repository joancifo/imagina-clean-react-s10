// PRESENTACIÓN · Esquema del formulario de aprobación. Módulo PURO: ni React, ni fetch, ni mensajes.
// Parsea, no «valida»: la entrada llega como la escribe una persona (strings) y sale como un dato del que te puedes fiar.
// Devuelve TODOS los errores a la vez, uno por campo: un formulario que corrige de uno en uno se abandona.
import { APPROVAL_CHANNELS, type ApprovalChannel, type ApprovalDraft } from '../domain/approval';
import { err, ok, type Result } from '../domain/result';

export const MAX_NOTE = 140;
export const MIN_NOTE = 10;

export type { ApprovalChannel, ApprovalDraft } from '../domain/approval';

/** Lo que hay en la pantalla: cadenas y casillas. */
export type ApprovalFormInput = { note: string; confirmTotal: boolean; channel: string };

export type ApprovalFieldError = 'note-required' | 'note-too-short' | 'note-too-long' | 'confirm-required' | 'channel-unknown';
export type ApprovalFormErrors = Partial<Record<keyof ApprovalFormInput, ApprovalFieldError>>;

export const EMPTY_APPROVAL_FORM: ApprovalFormInput = { note: '', confirmTotal: false, channel: 'web' };

/** `requiresJustification` lo decide el DOMINIO (needsJustification), no el formulario. */
export type ApprovalFormContext = { requiresJustification: boolean };

/**
 * PARTE B · Comprueba el formulario y devuelve el borrador listo para el caso de uso.
 * Reglas (las fijan los tests de approval-form.test.ts):
 *   · Devuelve TODOS los errores de campo a la vez, no el primero.
 *   · La nota se guarda recortada; vacía o solo espacios es null.
 *   · Con requiresJustification: nota de al menos MIN_NOTE caracteres útiles y confirmTotal marcado.
 *   · La nota nunca pasa de MAX_NOTE caracteres, haga falta o no.
 *   · El canal tiene que estar en APPROVAL_CHANNELS.
 * Quién necesita justificación lo decide el DOMINIO (needsJustification), no este módulo.
 */
export function parseApprovalForm(input: ApprovalFormInput, context: ApprovalFormContext): Result<ApprovalDraft, ApprovalFormErrors> {
  void input;
  void context;
  void APPROVAL_CHANNELS;
  void ok;
  return err({});
}
