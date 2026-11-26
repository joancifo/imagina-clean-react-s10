// Repaso · BFF · Las tres APIs «de detrás» de los ejemplos, simuladas: pedidos, transportista y devoluciones.
// Cada una tarda lo que tarda (`delayMs`) y puede fallar (`down`). Así se ven la latencia y los fallos parciales.
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function createApis({ delayMs = 50, carrierDown = false, carrierDelayMs = delayMs } = {}) {
  return {
    async order(id) {
      await wait(delayMs);
      return id === 'P-1004' ? { ord_id: 'P-1004', cust_nm: 'Clínica Dental Mar', cust_tier: 'standard', ord_st: 'shipped', internal_margin: 0.42, ln_items: [{ sku: 'E-50', qty: 3, unit_prc: 140 }] } : null;
    },
    async shipment(id) {
      await wait(carrierDelayMs);
      if (carrierDown) throw new Error('carrier 503');
      return id === 'P-1004' ? { trk_no: 'TRK-88412', sts_cd: 'DLV', dlv_ts: '2026-11-12T10:00:00Z', carrier_cost: 7.9 } : null;
    },
    async returns(id) {
      await wait(delayMs);
      return id === 'P-1004' ? [{ rma_id: 'RMA-001', sku: 'E-50', qty: 1 }] : [];
    },
  };
}
