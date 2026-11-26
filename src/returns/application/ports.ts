// APLICACIÓN · Puertos de Devoluciones (paso 4 del plan). En el lenguaje del caso de uso, no en el de HTTP.
import type { ReturnReason } from '../domain/return-rules';
import type { ReturnableOrder } from '../domain/returnable-order';

/** Fallos previsibles. El BFF ya decide importe y permisos: algunos solo puede saberlos él. */
export type ReturnsFailure = 'not-found' | 'forbidden' | 'needs-admin' | 'not-returnable' | 'quantity-exceeded' | 'invalid' | 'unavailable';

export class ReturnsGatewayError extends Error {
  constructor(
    readonly failure: ReturnsFailure,
    message: string = failure,
  ) {
    super(message);
    this.name = 'ReturnsGatewayError';
  }
}

export type ReturnRequest = { orderId: string; sku: string; quantity: number; reason: ReturnReason };
/** Lo que confirma el servidor. El importe es SUYO: el cliente lo enseña, no lo decide. */
export type ReturnReceipt = { returnId: string; refund: number };

export interface ReturnsGateway {
  /** El pedido con lo necesario para devolver, o null si no existe. Lanza ReturnsGatewayError. */
  loadReturnable(orderId: string): Promise<ReturnableOrder | null>;
  /** Registra la devolución. Ni importe ni identidad: los pone el servidor. Lanza ReturnsGatewayError. */
  register(request: ReturnRequest): Promise<ReturnReceipt>;
}

export interface Clock {
  now(): Date;
}
