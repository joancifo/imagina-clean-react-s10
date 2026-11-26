// Repaso · Adapters · NIVEL 2 · LA IDEA: un adapter traduce una interfaz a la que espera quien la usa.
// Patrón Adapter (Gamma, Helm, Johnson y Vlissides, «Design Patterns», 1994): como el adaptador de un enchufe.
// Dos tipos distintos, a propósito:
//   · OrderDto: lo que ENVÍA el backend, con sus nombres. Vive solo aquí.
//   · Order:    lo que USA nuestra aplicación, con nombres de negocio.
// El mapper es el único sitio que conoce los dos. Si el backend cambia, cambia UNA función.

export type OrderDto = { ord_id: string; cust_nm: string; cust_tier: string; ord_st: string; ln_items: { sku: string; qty: number; unit_prc: number }[] };
export type OrderStatus = 'pending' | 'approved' | 'shipped' | 'cancelled';
export type Order = { id: string; customerName: string; tier: string; status: OrderStatus; lines: { sku: string; quantity: number; unitPrice: number }[] };

export function toOrder(dto: OrderDto): Order {
  return {
    id: dto.ord_id,
    customerName: dto.cust_nm,
    tier: dto.cust_tier,
    status: dto.ord_st as OrderStatus, // ← NIVEL 4 quita este `as`: lo que llega de fuera se comprueba
    lines: dto.ln_items.map((line) => ({ sku: line.sku, quantity: line.qty, unitPrice: line.unit_prc })),
  };
}

export async function getOrder(fetchFn: typeof fetch, id: string): Promise<Order> {
  return toOrder(await (await fetchFn(`/api/orders/${id}`)).json());
}

// Las mismas tres «pantallas» del nivel 1. Ya no saben que existe ord_st.
const LABELS: Record<OrderStatus, string> = { pending: 'Pendiente', approved: 'Aprobado', shipped: 'Enviado', cancelled: 'Cancelado' };
export const orderHeader = async (fetchFn: typeof fetch, id: string) => {
  const order = await getOrder(fetchFn, id);
  return `${order.id} · ${order.customerName} · ${LABELS[order.status]}`;
};
export const canReturn = async (fetchFn: typeof fetch, id: string) => (await getOrder(fetchFn, id)).status === 'shipped';
export const orderTotal = async (fetchFn: typeof fetch, id: string) =>
  (await getOrder(fetchFn, id)).lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0) * 1.21;
