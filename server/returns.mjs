// Sesión 10 · Paso 3 del plan · Devoluciones en el BFF.
// Lo que antes decidía el navegador (y la API heredada se creía), ahora lo decide el servidor:
//   1. El IMPORTE: lo calcula aquí, con los números de shared/policy.json. El cliente ya no lo envía.
//   2. QUIÉN puede: el rol sale de la cookie firmada, no del cuerpo de la petición.
//   3. QUÉ se puede devolver: entregado, en plazo y sin pasar de lo que queda.
// Y agrega: la pantalla pide UNA vez (pedido + entrega + lo ya devuelto) en vez de cuatro.
// Las reglas están escritas también en src/returns/domain: no se comparte el código, se comparten los números,
// y src/returns/policy.contract.test.ts comprueba que los dos lados deciden igual (como en Pedidos, Sesión 6).
import policy from '../shared/policy.json' with { type: 'json' };

export const RETURN_REASONS = ['NO_LONGER_NEEDED', 'DEFECTIVE', 'WRONG_ITEM'];
const HOUR = 3_600_000;

/** Importe a devolver. Mismas rarezas que la pantalla heredada (docs/devoluciones/plan.md, preguntas 1 y 2). */
export function refundOf({ unitPrice, quantity, tier, reason }) {
  const base = quantity * unitPrice;
  let amount = base * (1 - (policy.pricing.discountByTier[tier] ?? 0)) * (1 + policy.pricing.vat);
  if (reason !== 'DEFECTIVE' && tier !== 'gold') amount -= base * policy.returns.restockingFee;
  return Math.round(amount * 100) / 100;
}

/** Pregunta 3: 720 horas desde la hora de entrega. */
export const withinWindow = (deliveredAt, now) => (now.getTime() - new Date(deliveredAt).getTime()) / HOUR <= policy.returns.windowDays * 24;

const delivered = (order, shipment) => order.ord_st === 'shipped' && shipment?.sts_cd === 'DLV';
const returnedOf = (previous, sku) => previous.filter((item) => item.sku === sku).reduce((sum, item) => sum + item.qty, 0);

/** Autorización REAL de una devolución. Devuelve null si se permite, o el código del fallo. */
export function returnDenial({ order, shipment, previous, actor, sku, quantity, reason, now }) {
  if (actor.role !== 'admin' && actor.role !== 'manager') return 'forbidden';
  if (!delivered(order, shipment) || !withinWindow(shipment.dlv_ts, now)) return 'not-returnable';
  const line = order.ln_items.find((item) => item.sku === sku);
  if (!line) return 'invalid-body';
  if (quantity > line.qty - returnedOf(previous, sku)) return 'quantity-exceeded';
  const amount = refundOf({ unitPrice: line.unit_prc, quantity, tier: order.cust_tier, reason });
  if (actor.role === 'manager' && amount > policy.returns.managerRefundLimit) return 'needs-admin';
  return null;
}

/** Lista blanca del cuerpo: qué se devuelve y por qué. Ni importe, ni rol, ni quién lo pide. */
function readReturnBody(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) return null;
  if (Object.keys(body).some((key) => !['sku', 'qty', 'reason'].includes(key))) return null;
  const { sku, qty, reason } = body;
  if (typeof sku !== 'string' || !Number.isInteger(qty) || qty < 1 || !RETURN_REASONS.includes(reason)) return null;
  return { sku, quantity: qty, reason };
}

const STATUS = { forbidden: 403, 'needs-admin': 403, 'not-returnable': 409, 'quantity-exceeded': 409, 'invalid-body': 422 };

/** Monta las dos rutas. `orders()` y `returns()` devuelven el almacén ACTUAL (los E2E lo reinician). */
export function mountReturnRoutes(app, { authenticated, orders, returns, now, fail }) {
  // Contexto de la pantalla: lo que necesita, en una respuesta. Datos, no textos.
  app.get('/api/orders/:id/return-context', authenticated, (req, res) => {
    if (req.actor.role !== 'admin' && req.actor.role !== 'manager') return fail(res, 403, 'forbidden');
    const order = orders().find(req.params.id);
    if (!order) return fail(res, 404, 'not-found');
    const shipment = returns().shipmentOf(order.ord_id);
    const previous = returns().returnsOf(order.ord_id);
    return res.json({
      ord_id: order.ord_id,
      cust_nm: order.cust_nm,
      cust_tier: order.cust_tier,
      ord_st: order.ord_st,
      ln_items: order.ln_items.map((line) => ({ ...line, returned_qty: returnedOf(previous, line.sku) })),
      // El formato del transportista se queda aquí: al navegador le llega solo lo que usa.
      delivery: delivered(order, shipment) ? { trk_no: shipment.trk_no, dlv_ts: shipment.dlv_ts } : null,
    });
  });

  app.post('/api/orders/:id/returns', authenticated, (req, res) => {
    const body = readReturnBody(req.body);
    if (!body) return fail(res, 422, 'invalid-body');
    const order = orders().find(req.params.id);
    if (!order) return fail(res, 404, 'not-found');
    const store = returns();
    const context = { order, shipment: store.shipmentOf(order.ord_id), previous: store.returnsOf(order.ord_id), actor: req.actor, now: now(), ...body };
    const denied = returnDenial(context);
    if (denied) return fail(res, STATUS[denied], denied);

    const line = order.ln_items.find((item) => item.sku === body.sku);
    const refund = refundOf({ unitPrice: line.unit_prc, quantity: body.quantity, tier: order.cust_tier, reason: body.reason });
    const saved = store.add({ ord_id: order.ord_id, sku: body.sku, qty: body.quantity, rsn_cd: body.reason, rfd_amt: refund, req_by: req.actor.id, crt_ts: now().toISOString() });
    return res.status(201).json({ rma_id: saved.rma_id, rfd_amt: refund });
  });
}
