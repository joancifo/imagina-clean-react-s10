// Almacén en memoria compartido por la API heredada (app.mjs) y por el BFF (bff.mjs).
// No sabe nada de HTTP: recibe y devuelve datos. Así el BFF puede consultar el estado ACTUAL
// de un pedido antes de autorizar, sin hacerse una petición a sí mismo.
export const SEED_ORDERS = [
  { ord_id: 'P-1001', cust_nm: 'Talleres Norte', cust_tier: 'gold', ord_st: 'pending', owner_id: 'u2', crt_ts: '2026-10-02T09:15:00Z', ln_items: [{ sku: 'A-10', qty: 40, unit_prc: 32.5 }, { sku: 'B-20', qty: 4, unit_prc: 210 }] },
  { ord_id: 'P-1002', cust_nm: 'Ferretería Sol', cust_tier: 'silver', ord_st: 'approved', owner_id: 'u2', crt_ts: '2026-10-03T11:40:00Z', ln_items: [{ sku: 'C-30', qty: 12, unit_prc: 18 }] },
  { ord_id: 'P-1003', cust_nm: 'Construcciones Vega', cust_tier: 'gold', ord_st: 'pending', owner_id: 'u3', crt_ts: '2026-10-05T08:05:00Z', ln_items: [{ sku: 'D-40', qty: 60, unit_prc: 95 }] },
  { ord_id: 'P-1004', cust_nm: 'Clínica Dental Mar', cust_tier: 'standard', ord_st: 'shipped', owner_id: 'u3', crt_ts: '2026-10-06T16:20:00Z', ln_items: [{ sku: 'E-50', qty: 3, unit_prc: 140 }] },
  { ord_id: 'P-1005', cust_nm: 'Hotel Brisa', cust_tier: 'silver', ord_st: 'pending', owner_id: 'u2', crt_ts: '2026-10-08T10:00:00Z', ln_items: [{ sku: 'A-10', qty: 10, unit_prc: 32.5 }] },
  { ord_id: 'P-1006', cust_nm: 'Logística Ebro', cust_tier: 'standard', ord_st: 'cancelled', owner_id: 'u3', crt_ts: '2026-10-09T12:30:00Z', ln_items: [{ sku: 'F-60', qty: 1, unit_prc: 900 }] },
];

export const USERS = {
  u1: { usr_id: 'u1', usr_nm: 'Marta (admin)', usr_role: 'admin' },
  u2: { usr_id: 'u2', usr_nm: 'Pau (manager)', usr_role: 'manager' },
  u3: { usr_id: 'u3', usr_nm: 'Iris (agente)', usr_role: 'agent' },
};

/** Transiciones de estado válidas. El permiso para pedirlas es otra cosa (bff.mjs). */
export const ACTIONS = {
  approve: { from: ['pending'], to: 'approved' },
  cancel: { from: ['pending', 'approved'], to: 'cancelled' },
  ship: { from: ['approved'], to: 'shipped' },
};

export function createStore(seed = SEED_ORDERS) {
  const orders = structuredClone(seed);
  return {
    all: () => orders,
    find: (id) => orders.find((order) => order.ord_id === id) ?? null,
    /** Aplica la transición si el estado actual la permite. Devuelve null si no. */
    apply(id, action, extra = {}) {
      const order = this.find(id);
      if (!order) return { error: 'not-found' };
      const transition = ACTIONS[action];
      if (!transition.from.includes(order.ord_st)) return { error: 'conflict' };
      order.ord_st = transition.to;
      if (action === 'cancel' && extra.reason) order.cancel_rsn = extra.reason;
      return { order };
    },
  };
}
