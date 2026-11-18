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

function noteError(note: string, { requiresJustification }: ApprovalFormContext): ApprovalFieldError | null {
  const trimmed = note.trim();
  if (note.length > MAX_NOTE) return 'note-too-long';
  if (!requiresJustification) return null;
  if (trimmed === '') return 'note-required';
  return trimmed.length < MIN_NOTE ? 'note-too-short' : null;
}

export function parseApprovalForm(input: ApprovalFormInput, context: ApprovalFormContext): Result<ApprovalDraft, ApprovalFormErrors> {
  const errors: ApprovalFormErrors = {};
  const note = noteError(input.note, context);
  if (note) errors.note = note;
  if (context.requiresJustification && !input.confirmTotal) errors.confirmTotal = 'confirm-required';
  if (!(APPROVAL_CHANNELS as string[]).includes(input.channel)) errors.channel = 'channel-unknown';

  if (Object.keys(errors).length > 0) return err(errors);
  const trimmed = input.note.trim();
  return ok({ note: trimmed === '' ? null : trimmed, channel: input.channel as ApprovalChannel });
}
