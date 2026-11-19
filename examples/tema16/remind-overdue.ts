// TEMA 16 · Un caso de uso pequeño con CINCO dependencias, para ver los cinco tipos de doble de prueba.
// «Avisar de pedidos pendientes que llevan más de N días sin tocarse».
import { calculateTotal, type Order } from '../../src/orders/domain/order';

export type RemindDeps = {
  orders: { findPending(): Promise<Order[]> }; // → FAKE (implementación en memoria de verdad)
  clock: { now(): Date }; //                     → STUB (devuelve una respuesta preparada)
  mailer: { send(to: string, subject: string): Promise<void> }; // → SPY / MOCK (se comprueba cómo se usó)
  audit: { record(entry: string): void }; //      → DUMMY (hace falta en la firma; este test no lo usa)
};

const DAY = 24 * 60 * 60 * 1000;

export async function remindOverdue({ orders, clock, mailer, audit }: RemindDeps, days: number): Promise<number> {
  const limit = clock.now().getTime() - days * DAY;
  const overdue = (await orders.findPending()).filter((order) => Date.parse(order.createdAt) < limit);
  for (const order of overdue) {
    await mailer.send(`${order.ownerId}@orderdesk.test`, `Pedido ${order.id} pendiente (${Math.round(calculateTotal(order))} €)`);
  }
  if (overdue.length > 0) audit.record(`recordatorios:${overdue.length}`);
  return overdue.length;
}
