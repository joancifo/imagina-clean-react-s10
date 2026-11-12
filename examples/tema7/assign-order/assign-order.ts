// TEMA 7 · Caso de uso «Reasignar pedido» (equivalente a assignUserToTeam del temario).
// Intención de producto: «quiero que este pedido lo lleve otra persona».
// Anatomía: entrada explícita → validar → cargar → decidir → guardar → notificar → salida explícita.
import { err, ok, type Result } from '../../../src/orders/domain/result';
import type { Order } from '../../../src/orders/domain/order';

// ── Puertos que NECESITA este caso de uso (escritos en su lenguaje, no en el de HTTP) ──
export type User = { id: string; name: string; active: boolean };
export interface OrderStore {
  findById(id: string): Promise<Order | null>;
  saveOwner(orderId: string, ownerId: string): Promise<void>;
}
export interface UserDirectory {
  findById(id: string): Promise<User | null>;
}
export interface Notifier {
  notify(userId: string, message: string): Promise<void>;
}
export interface Clock {
  now(): Date;
}

// ── Entrada y salida explícitas ──
export type Actor = { id: string; role: 'admin' | 'manager' | 'agent' };
export type AssignOrderCommand = { orderId: string; assigneeId: string; actor: Actor };
export type Assignment = { orderId: string; from: string; to: string; at: string };
export type AssignOrderError = 'forbidden' | 'not-found' | 'unknown-user' | 'inactive-user' | 'order-closed' | 'same-owner';

export type AssignOrderDeps = { orders: OrderStore; users: UserDirectory; notifier: Notifier; clock: Clock };

export function createAssignOrder({ orders, users, notifier, clock }: AssignOrderDeps) {
  return async function assignOrder({ orderId, assigneeId, actor }: AssignOrderCommand): Promise<Result<Assignment, AssignOrderError>> {
    // Permiso: depende solo del actor → se comprueba ANTES de cualquier E/S.
    if (actor.role === 'agent') return err('forbidden');

    // Cargar lo necesario (en paralelo: no dependen entre sí).
    const [order, assignee] = await Promise.all([orders.findById(orderId), users.findById(assigneeId)]);
    if (!order) return err('not-found');
    if (!assignee) return err('unknown-user');

    // Decidir: reglas de negocio (aquí son pocas; si crecen, se mueven a domain/).
    if (!assignee.active) return err('inactive-user');
    if (order.status === 'shipped' || order.status === 'cancelled') return err('order-closed');
    if (order.ownerId === assignee.id) return err('same-owner');

    // Ejecutar y notificar.
    await orders.saveOwner(order.id, assignee.id);
    await notifier.notify(assignee.id, `Te han asignado el pedido ${order.id}`);
    return ok({ orderId: order.id, from: order.ownerId, to: assignee.id, at: clock.now().toISOString() });
  };
}
