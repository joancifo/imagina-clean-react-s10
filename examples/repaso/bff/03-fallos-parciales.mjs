// Repaso · BFF · NIVEL 4 (senior) · LO QUE NO SE VE EN UN DIAGRAMA.
// Agregar tres fuentes con Promise.all tiene dos problemas en producción:
//   1. Si UNA falla, falla TODO: el transportista caído deja sin pantalla a quien solo quería ver el pedido.
//   2. La respuesta tarda lo que tarde la fuente MÁS LENTA: un transportista a 8 segundos son 8 segundos de «Cargando…».
// Solución: Promise.allSettled + un tiempo máximo por fuente + respuesta PARCIAL declarada (`unavailable`).
// La pantalla decide qué hacer con un dato que falta; el BFF no se lo esconde ni se lo inventa.
import express from 'express';

const withTimeout = (promise, ms) => Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(`timeout ${ms} ms`)), ms))]);

export function createResilientBff({ apis, timeoutMs = 300 }) {
  const app = express();
  app.get('/api/return-screen/:id', async (req, res) => {
    const id = req.params.id;
    const [order, shipment, previous] = await Promise.allSettled([apis.order(id), withTimeout(apis.shipment(id), timeoutMs), withTimeout(apis.returns(id), timeoutMs)]);

    // El pedido es imprescindible: sin él no hay pantalla. Lo demás es secundario.
    if (order.status === 'rejected') return res.status(503).json({ error: { code: 'unavailable' } });
    if (!order.value) return res.status(404).json({ error: { code: 'not-found' } });

    const unavailable = [shipment.status === 'rejected' && 'delivery', previous.status === 'rejected' && 'returns'].filter(Boolean);
    res.json({
      ord_id: order.value.ord_id,
      cust_nm: order.value.cust_nm,
      delivery: shipment.status === 'fulfilled' && shipment.value?.sts_cd === 'DLV' ? { trk_no: shipment.value.trk_no, dlv_ts: shipment.value.dlv_ts } : null,
      returns: previous.status === 'fulfilled' ? previous.value.map(({ sku, qty }) => ({ sku, qty })) : null,
      unavailable, // ['delivery'] = «no lo sé», que NO es lo mismo que «no está entregado» (delivery: null)
    });
  });
  return app;
}
