// PRESENTACIÓN · Decisiones de NAVEGACIÓN, separadas de las reglas de negocio y del router.
// Funciones puras: se prueban sin MemoryRouter. La pantalla llama a navigate() con lo que devuelven.
import { calculateTotal, type Order } from '../domain/order';

export const orderDetailPath = (orderId: string): string => `/orders/${encodeURIComponent(orderId)}`;

/** Decisión de UX (no de negocio): tras aprobar un pedido grande se abre su detalle para revisarlo. */
export const OPEN_DETAIL_FROM = 5000;
export const opensDetailAfterApproval = (order: Order): boolean => calculateTotal(order) > OPEN_DETAIL_FROM;
