// INFRAESTRUCTURA · La frontera: lo que envía GET /api/orders/:id/return-context, validado y traducido al dominio.
// Lista blanca (Sesión 8): se construye un objeto NUEVO con los campos conocidos. Ni `as`, ni campos que se cuelan.
// Es el ÚNICO archivo de src/returns que conoce los nombres del backend (ord_id, ln_items, trk_no, dlv_ts…).
import { err, ok, type Result } from '../domain/result';
import type { ReturnableLine, ReturnableOrder } from '../domain/returnable-order';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
const isCount = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0;
const isMoney = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const isDate = (value: unknown): value is string => typeof value === 'string' && !Number.isNaN(Date.parse(value));

function parseLine(raw: unknown): ReturnableLine | null {
  if (!isRecord(raw) || !isText(raw.sku) || !isCount(raw.qty) || !isMoney(raw.unit_prc) || !isCount(raw.returned_qty)) return null;
  return { sku: raw.sku, ordered: raw.qty, unitPrice: raw.unit_prc, alreadyReturned: raw.returned_qty };
}

/** Devuelve el pedido o el nombre del primer campo que no cumple. */
export function parseReturnContext(raw: unknown): Result<ReturnableOrder, string> {
  if (!isRecord(raw)) return err('cuerpo');
  if (!isText(raw.ord_id)) return err('ord_id');
  if (!isText(raw.cust_nm)) return err('cust_nm');
  if (!isText(raw.cust_tier)) return err('cust_tier');
  if (!Array.isArray(raw.ln_items)) return err('ln_items');
  const lines = raw.ln_items.map(parseLine);
  if (lines.some((line) => line === null)) return err('ln_items[]');

  let delivery: ReturnableOrder['delivery'] = null;
  if (raw.delivery !== null) {
    if (!isRecord(raw.delivery) || !isText(raw.delivery.trk_no) || !isDate(raw.delivery.dlv_ts)) return err('delivery');
    delivery = { trackingNumber: raw.delivery.trk_no, deliveredAt: raw.delivery.dlv_ts };
  }
  return ok({ orderId: raw.ord_id, customerName: raw.cust_nm, tier: raw.cust_tier, lines: lines as ReturnableLine[], delivery });
}
