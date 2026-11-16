// PRESENTACIÓN · Mensajes de los errores previsibles de «Aprobar pedido».
import type { ApproveOrderError } from '../application/approve-order';

export const APPROVAL_MESSAGES = {
  'no-session': 'Debes iniciar sesión',
  forbidden: 'No tienes permisos para aprobar',
  'not-pending': 'Solo se aprueban pedidos pendientes',
  'invalid-lines': 'El pedido tiene líneas no válidas',
  'needs-admin': 'Los pedidos de más de 10000 € los aprueba un administrador',
  'not-found': 'Este pedido ya no existe',
  conflict: 'Otra persona ha cambiado este pedido. Recarga la lista y vuelve a intentarlo',
  unavailable: 'No hay conexión con el servidor. Inténtalo de nuevo en unos segundos',
} satisfies Record<ApproveOrderError, string>;

export const UNEXPECTED_APPROVAL_ERROR = 'No se pudo aprobar el pedido por un error inesperado';
