// Repaso · Adapters · El backend «de mentira» de los ejemplos: responde como la API heredada de OrderDesk.
// `version: 2` simula el cambio que llega un martes cualquiera: el backend renombra ord_st → order_status.

export type BackendVersion = 1 | 2;

const ORDER_V1 = { ord_id: 'P-1004', cust_nm: 'Clínica Dental Mar', cust_tier: 'standard', ord_st: 'shipped', ln_items: [{ sku: 'E-50', qty: 3, unit_prc: 140 }] };

export function fakeBackend({ version = 1, extra = {}, status = 200 }: { version?: BackendVersion; extra?: Record<string, unknown>; status?: number } = {}): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const id = String(input).split('/').pop();
    if (status !== 200) return new Response(JSON.stringify({ error: { code: status === 409 ? 'conflict' : 'boom' } }), { status });
    if (id !== 'P-1004') return new Response(JSON.stringify({ error: { code: 'not-found' } }), { status: 404 });
    const { ord_st, ...rest } = ORDER_V1;
    const body = version === 1 ? { ...ORDER_V1, ...extra } : { ...rest, order_status: ord_st, ...extra };
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
}
