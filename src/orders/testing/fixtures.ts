// PRUEBAS · Los datos del backend, en un solo sitio.
// Fixture COMPARTIDA pero no copiada: se importa de `server/store.mjs`, que es lo que sirven de verdad
// la API heredada y el BFF. Copiarlos aquí los dejaría obsoletos el día que cambie el seed, y los tests
// seguirían en verde probando un backend que ya no existe.
import { SEED_ORDERS } from '../../../server/store.mjs';
import type { OrderDto } from '../infrastructure/order-dto';
import { toOrder } from '../infrastructure/order-mapper';
import type { Order } from '../domain/order';

/** Los seis pedidos del backend, con los nombres de campo del backend. */
export const SEED_DTOS: readonly OrderDto[] = SEED_ORDERS as unknown as readonly OrderDto[];

/** Los mismos, ya traducidos al dominio: lo que debería devolver cualquier implementación del puerto. */
export const SEED_ORDERS_IN_DOMAIN: readonly Order[] = SEED_DTOS.map(toOrder);

export const dtoFor = (id: string): OrderDto | undefined => SEED_DTOS.find((dto) => dto.ord_id === id);
export const orderFor = (id: string): Order | undefined => SEED_ORDERS_IN_DOMAIN.find((order) => order.id === id);

/** Usuarios del backend de pruebas (server/store.mjs). u1 admin · u2 manager · u3 agente. */
export const USER_IDS = { admin: 'u1', manager: 'u2', agent: 'u3' } as const;
