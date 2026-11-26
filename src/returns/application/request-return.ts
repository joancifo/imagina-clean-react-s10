// APLICACIÓN · Caso de uso «Registrar una devolución».
// Orden: validar la entrada (sin red) → decidir con el dominio lo que se puede saber aquí → pedirlo al servidor.
// El servidor vuelve a decidirlo TODO (importe, rol, plazo, cantidad): lo de aquí es para no hacer esperar a la persona.
import { needsAdminApproval, refundFor, type ReturnReason } from '../domain/return-rules';
import { err, ok, type Result } from '../domain/result';
import { remainingOf, type ReturnableOrder } from '../domain/returnable-order';
import { ReturnsGatewayError, type ReturnReceipt, type ReturnsFailure, type ReturnsGateway } from './ports';

export type RequestReturnCommand = { order: ReturnableOrder; sku: string; quantity: number; reason: ReturnReason; role: string };
export type RequestReturnError = 'invalid-quantity' | ReturnsFailure;
export type RequestReturn = (command: RequestReturnCommand) => Promise<Result<ReturnReceipt, RequestReturnError>>;

export function createRequestReturn({ returns }: { returns: Pick<ReturnsGateway, 'register'> }): RequestReturn {
  return async ({ order, sku, quantity, reason, role }) => {
    const line = order.lines.find((item) => item.sku === sku);
    if (!line) return err('invalid');
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > remainingOf(line)) return err('invalid-quantity');
    if (needsAdminApproval(role, refundFor({ unitPrice: line.unitPrice, quantity, tier: order.tier, reason }))) return err('needs-admin');
    try {
      return ok(await returns.register({ orderId: order.orderId, sku, quantity, reason }));
    } catch (error) {
      if (error instanceof ReturnsGatewayError) return err(error.failure);
      throw error;
    }
  };
}
