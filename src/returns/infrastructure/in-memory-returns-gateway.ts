// INFRAESTRUCTURA · Fake en memoria de ReturnsGateway, para tests, demos y desarrollo sin backend.
// Decide como el BFF (mismas reglas del dominio y mismos números): un fake más permisivo que el servidor
// haría pasar tests que en producción fallan (Sesión 8).
import { ReturnsGatewayError, type Clock, type ReturnReceipt, type ReturnRequest, type ReturnsGateway } from '../application/ports';
import { canManageReturns, needsAdminApproval, refundFor } from '../domain/return-rules';
import { remainingOf, returnWindowOf, type ReturnableOrder } from '../domain/returnable-order';

export type InMemoryReturnsGateway = ReturnsGateway & { registered: ReturnRequest[] };

export function createInMemoryReturnsGateway({ orders, role, clock }: { orders: ReturnableOrder[]; role: string; clock: Clock }): InMemoryReturnsGateway {
  const data = structuredClone(orders);
  const registered: ReturnRequest[] = [];
  return {
    registered,
    async loadReturnable(orderId) {
      if (!canManageReturns(role)) throw new ReturnsGatewayError('forbidden');
      return structuredClone(data.find((order) => order.orderId === orderId) ?? null);
    },
    async register(request): Promise<ReturnReceipt> {
      if (!canManageReturns(role)) throw new ReturnsGatewayError('forbidden');
      const order = data.find((item) => item.orderId === request.orderId);
      if (!order) throw new ReturnsGatewayError('not-found');
      if (returnWindowOf(order, clock.now()) !== 'open') throw new ReturnsGatewayError('not-returnable');
      const line = order.lines.find((item) => item.sku === request.sku);
      if (!line) throw new ReturnsGatewayError('invalid');
      if (request.quantity > remainingOf(line)) throw new ReturnsGatewayError('quantity-exceeded');
      const refund = refundFor({ unitPrice: line.unitPrice, quantity: request.quantity, tier: order.tier, reason: request.reason });
      if (needsAdminApproval(role, refund)) throw new ReturnsGatewayError('needs-admin');
      line.alreadyReturned += request.quantity;
      registered.push(request);
      return { returnId: `RMA-${String(100 + registered.length)}`, refund };
    },
  };
}
