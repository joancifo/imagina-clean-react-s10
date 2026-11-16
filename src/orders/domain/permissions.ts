// DOMINIO · Permisos de ACCESO a pantallas, modelados como reglas puras.
// Las rutas y los guards (src/routes) preguntan; no deciden. Sin sesión, la respuesta es siempre no (fail closed).
// Importante: esto es autorización VISUAL. La autorización real la hace el backend (Sesión 6).
import type { Actor } from './cancellation';

export const canViewOrders = (actor: Actor | null): boolean => actor !== null;
export const canViewDashboard = (actor: Actor | null): boolean => actor?.role === 'admin' || actor?.role === 'manager';
/** Un agente no ve importes ni responsables de los pedidos. */
export const canSeeAmounts = (actor: Actor | null): boolean => actor !== null && actor.role !== 'agent';
