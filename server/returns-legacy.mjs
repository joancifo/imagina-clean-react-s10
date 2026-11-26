// Sesión 10 · API HEREDADA de devoluciones y API del TRANSPORTISTA (simulada).
// Así es lo que hay, no lo que queremos:
//   · Devoluciones guarda lo que le mandan: importe, quién lo pide y CON QUÉ ROL. No calcula ni comprueba nada.
//   · El transportista habla su propio idioma: trk_no, sts_cd ('DLV' entregado, 'TRN' en tránsito), dlv_ts.
//   · El BFF las monta tal cual (server/bff.mjs): exige sesión y nada más. Es una pasarela, todavía no un BFF.
// Es el backend del laboratorio de la Sesión 10: el plan de refactor decide qué se hace con él.
import { Router } from 'express';

/** Datos del transportista. Solo P-1004 está entregado; P-1002 va en camino. */
export const SEED_SHIPMENTS = {
  'P-1004': { trk_no: 'TRK-88412', sts_cd: 'DLV', dlv_ts: '2026-11-12T10:00:00Z' },
  'P-1002': { trk_no: 'TRK-88501', sts_cd: 'TRN', dlv_ts: null },
};

/** Devoluciones ya registradas. De P-1004 (3 unidades de E-50) ya se devolvió una. */
export const SEED_RETURNS = [
  { rma_id: 'RMA-001', ord_id: 'P-1004', sku: 'E-50', qty: 1, rsn_cd: 'DEFECTIVE', rfd_amt: 169.4, req_by: 'u2', crt_ts: '2026-11-14T09:00:00Z' },
];

export function createReturnsStore({ shipments = SEED_SHIPMENTS, returns = SEED_RETURNS } = {}) {
  const data = { shipments: structuredClone(shipments), returns: structuredClone(returns) };
  return {
    shipmentOf: (orderId) => data.shipments[orderId] ?? null,
    returnsOf: (orderId) => data.returns.filter((item) => item.ord_id === orderId),
    add(item) {
      const saved = { ...item, rma_id: `RMA-${String(data.returns.length + 1).padStart(3, '0')}` };
      data.returns.push(saved);
      return saved;
    },
  };
}

/** Rutas heredadas. `store()` devuelve el almacén ACTUAL (los E2E lo reinician); `now` decide la fecha de alta. */
export function legacyReturnsRoutes({ store, now = () => new Date() }) {
  const router = Router();

  // API del transportista (en producción, otro dominio y otra clave). Respuesta en SU formato.
  router.get('/carrier/shipments/:orderId', (req, res) => {
    const shipment = store().shipmentOf(req.params.orderId);
    return shipment ? res.json(shipment) : res.status(404).json({ msg: 'unknown shipment' });
  });

  router.get('/returns', (req, res) => res.json(store().returnsOf(String(req.query.ord_id ?? ''))));

  // Guarda lo que llega. Ni lista blanca, ni cálculo, ni autorización: confía en el cliente.
  router.post('/returns', (req, res) => {
    const saved = store().add({ ...req.body, crt_ts: now().toISOString() });
    return res.status(201).json(saved);
  });

  return router;
}
