// TEMA 11 · Un endpoint de BFF: agrega datos de varias fuentes y devuelve lo que necesita UNA pantalla.
// Lo que SÍ hace: juntar, filtrar y recortar. Lo que NO hace: textos, formatos, colores ni decisiones de pantalla.
// Sin BFF, la pantalla haría tres peticiones, conocería tres formatos y esperaría tres veces.
export function createDashboardEndpoint({ orders, invoices, incidents }) {
  return async function dashboardFor(actor) {
    // En paralelo: el BFF está para que la pantalla espere UNA vez, no tres.
    const [pedidos, facturas, incidencias] = await Promise.all([orders.findAll(), invoices.pending(), incidents.openFor(actor.id)]);

    const pendientes = pedidos.filter((order) => order.status === 'pending');
    return {
      pendingCount: pendientes.length,
      // El importe total NO viaja si quien pregunta no puede verlo.
      pendingAmount: actor.role === 'agent' ? null : pendientes.reduce((sum, order) => sum + order.total, 0),
      overdueInvoices: facturas.filter((invoice) => invoice.overdue).length,
      myIncidents: incidencias.length,
      // Ni «3 pedidos pendientes» ni «color: rojo»: eso lo decide la pantalla.
    };
  };
}
