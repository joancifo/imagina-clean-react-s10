// Repaso · Adapters · NIVEL 1 (junior) · EL PROBLEMA.
// Dos «pantallas» (aquí, funciones que devuelven el texto que pintarían) llaman al backend directamente
// y usan SUS nombres: ord_st, cust_nm, ln_items, unit_prc. Funciona… hasta que el backend cambia un nombre.
// Pregunta: si el backend renombra ord_st → order_status, ¿cuántos sitios hay que tocar? (npm run repaso:adapter)

/** La cabecera del detalle: «P-1004 · Clínica Dental Mar · Enviado». */
export async function orderHeader(fetchFn: typeof fetch, id: string): Promise<string> {
  const o = await (await fetchFn(`/api/orders/${id}`)).json();
  const label = o.ord_st === 'shipped' ? 'Enviado' : o.ord_st === 'approved' ? 'Aprobado' : 'Pendiente';
  return `${o.ord_id} · ${o.cust_nm} · ${label}`;
}

/** El botón de devolución: solo para pedidos enviados. */
export async function canReturn(fetchFn: typeof fetch, id: string): Promise<boolean> {
  const o = await (await fetchFn(`/api/orders/${id}`)).json();
  return o.ord_st === 'shipped';
}

/** El total del pedido, con IVA. */
export async function orderTotal(fetchFn: typeof fetch, id: string): Promise<number> {
  const o = await (await fetchFn(`/api/orders/${id}`)).json();
  return o.ln_items.reduce((sum: number, l: { qty: number; unit_prc: number }) => sum + l.qty * l.unit_prc, 0) * 1.21;
}
