// Repaso · BFF · NIVEL 2 · LA IDEA: un backend hecho a medida de UNA interfaz (S. Newman, «Backends For Frontends», 2015).
// La pantalla de devoluciones hoy hace 4 peticiones, 2 encadenadas, y recibe campos que no usa (internal_margin, carrier_cost).
// Este BFF mínimo hace una sola cosa: AGREGAR. Pide las tres fuentes EN PARALELO y devuelve SOLO lo que la pantalla pinta.
// Pruébalo: npm run repaso:bff  ·  o arráncalo: node examples/repaso/bff/serve.mjs y abre http://localhost:3201/api/return-screen/P-1004
import express from 'express';

export function createMiniBff({ apis }) {
  const app = express();
  app.get('/api/return-screen/:id', async (req, res) => {
    let order, shipment, previous;
    try {
      [order, shipment, previous] = await Promise.all([apis.order(req.params.id), apis.shipment(req.params.id), apis.returns(req.params.id)]);
    } catch {
      // Express 4 no captura errores de funciones async: sin este try, la petición se queda colgada.
      // Con Promise.all, si UNA fuente falla, falla todo (nivel 4: 03-fallos-parciales.mjs).
      return res.status(502).json({ error: { code: 'upstream' } });
    }
    if (!order) return res.status(404).json({ error: { code: 'not-found' } });
    res.json({
      ord_id: order.ord_id,
      cust_nm: order.cust_nm,
      ln_items: order.ln_items.map((line) => ({ ...line, returned_qty: previous.filter((item) => item.sku === line.sku).reduce((sum, item) => sum + item.qty, 0) })),
      delivery: shipment?.sts_cd === 'DLV' ? { trk_no: shipment.trk_no, dlv_ts: shipment.dlv_ts } : null,
      // Ni internal_margin ni carrier_cost: lo que la pantalla no pinta, no viaja.
    });
  });
  return app;
}
