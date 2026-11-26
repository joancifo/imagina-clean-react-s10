# Repaso · ¿Dónde va? Dominio, adapter, BFF o pantalla

Dinámica de la Sesión 10 (10 min). Ocho situaciones reales de OrderDesk. En el chat, todo a la vez: `1A 2B 3D…`
**D** dominio · **A** adapter (infraestructura del cliente) · **B** BFF (Node) · **P** pantalla (presentación). Alguna va en dos sitios: decid cuáles y por qué.

| # | Situación | Pista en el repositorio |
|---|---|---|
| 1 | El backend devuelve `ord_st`; la interfaz habla de `status` | `src/orders/infrastructure/order-mapper.ts` |
| 2 | Un agente no debe recibir los importes de los pedidos | `server/bff.mjs` · `visibleFor` |
| 3 | Reembolso = precio con descuento e IVA, menos los gastos de reposición | `src/returns/domain/` |
| 4 | El transportista responde 503 y la persona tiene que leer «El transportista no responde. Inténtalo en unos minutos» | `src/orders/infrastructure/gateway-failure.ts` · `src/orders/ui/*-messages.ts` |
| 5 | Devoluciones necesita pedido + entrega + devoluciones previas, y hoy espera tres veces | `examples/tema11/bff-aggregation.mjs` |
| 6 | La clave de la API del transportista | `docs/adr/004-bff-sesion-y-seguridad.md` |
| 7 | Mostrar «Incluye gastos de reposición del 15 %» solo cuando se cobran | `src/pages/ReturnsPage.tsx` |
| 8 | Si aún no se ha entregado, el transportista envía `dlv_ts: null` | `src/orders/infrastructure/order-dto.ts` |
