// PRESENTACIÓN · Un mensaje por error de campo. Tabla, no if: añadir un error obliga a escribir su texto (satisfies).
import type { ApprovalFieldError } from './approval-form';
import { MAX_NOTE, MIN_NOTE } from './approval-form';

export const APPROVAL_FORM_MESSAGES = {
  'note-required': 'Escribe por qué apruebas este pedido',
  'note-too-short': `La justificación necesita al menos ${MIN_NOTE} caracteres`,
  'note-too-long': `La justificación no puede pasar de ${MAX_NOTE} caracteres`,
  'confirm-required': 'Confirma que has revisado el importe',
  'channel-unknown': 'Elige un canal de la lista',
} satisfies Record<ApprovalFieldError, string>;
