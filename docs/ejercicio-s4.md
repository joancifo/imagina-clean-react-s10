# Ejercicio Sesión 4 · Cancelar pedido de extremo a extremo

**Duración:** 45 minutos (18:45 – 19:30) · **Corrección:** 15 minutos (19:30 – 19:45)
**Avance del proyecto final:** caso de uso, puertos, adapter con test de contrato, fakes y Composition Root.

```bash
git checkout -b s4/<tu-nombre>
npm install
npm test        # 134 tests en verde y 26 omitidos (skipped): 7 bloques que activarás tú
```

## Contexto
Hoy `OrdersPage.handleCancel` hace seis cosas: valida el motivo, llama a `doAction` (axios), actualiza la lista, mide con `trackEvent`, muestra el aviso y cierra el diálogo. Además decide con el pedido que **cargó la pantalla**, que puede estar desactualizado.

Objetivo: la pantalla solo traduce; el resto es un caso de uso que depende de puertos y se prueba sin red.

```
OrdersPage ─▶ useCancelOrder ─▶ cancelOrder (caso de uso) ─▶ OrderGateway   ─▶ HTTP · memoria
   (ui)          (ui)              (application)         ├─▶ Clock          ─▶ sistema · fijo
                                                          └─▶ EventPublisher ─▶ /api/logs · memoria
            todo se conecta en src/orders/composition.ts y src/main.tsx (Composition Root)
```

Los puertos ya están escritos en `src/orders/application/ports.ts`. **Léelos antes de empezar.**
Diferencia con la Sesión 3: las pistas son más cortas. **La especificación son los tests**: léelos antes de escribir código.

## Parte A · Caso de uso (15 min · 18:45 – 19:00)
Archivo: `src/orders/application/cancel-order.ts` (los tipos ya están escritos). Test: `cancel-order.test.ts`.

1. Quita `.skip` de los tres `describe` del test. Fallan 10 tests: es lo esperado.
2. Implementa `createCancelOrder(deps)`. Requisitos (los fija el test):
   - Un motivo no válido se rechaza **sin ninguna llamada** a los puertos.
   - La regla se decide con `cancelOrder` del dominio sobre el pedido **recién cargado** (`findById`), no sobre el que mostraba la pantalla. La hora sale de `clock`.
   - Efectos en este orden: `findById` → `cancel` → `publish`. Si un paso falla, no hay efectos posteriores.
   - `OrderGatewayError` → `err(error.failure)`. Cualquier otro error **se propaga**: un bug no se disfraza de `unavailable`.
   - Si `publish` falla, el resultado sigue siendo `ok`: el pedido ya está cancelado.
3. `npm test && npm run lint:arch` → verde. `lint:arch` falla si usas `new Date()` en la aplicación.

> Pista: el dominio ya tiene una función `cancelOrder`. Impórtala con alias: `import { cancelOrder as decideCancellation } from '../domain/cancellation'`.

## Parte B · Adapter HTTP con test de contrato (15 min · 19:00 – 19:15)
Archivo: `src/orders/infrastructure/http-order-gateway.ts`. Tests: `order-gateway.contract.test.ts` y `http-order-gateway.test.ts`.

1. En `order-gateway.contract.test.ts`, quita `{ skip: true }` del contrato HTTP. En `http-order-gateway.test.ts`, quita `.skip`.
2. Implementa `createHttpOrderGateway(fetchFn, baseUrl)`:
   - `findById`: `GET {baseUrl}/orders/:id`. Un 404 devuelve `null`. El DTO se traduce con `toOrder`.
   - `cancel`: `POST {baseUrl}/orders/:id/cancel`, cabeceras `content-type: application/json` y `x-user-id` (= `cancelledBy`), cuerpo `{ "reason": … }`.
   - Todo fallo previsible sale como `OrderGatewayError`: 404 → `not-found` · 409 → `conflict` · cualquier otra respuesta no-ok → `unavailable` · `fetch` rechazado (sin respuesta) → `unavailable`.
3. `npm run test:contract`: el **mismo** contrato pasa contra el fake en memoria **y** contra la API real de `server/app.mjs` (Express en un puerto libre).

> Recuerda: `fetch` no rechaza con un 404 ni con un 500; solo rechaza cuando no hay respuesta.

## Parte C · Composition Root y pantalla (15 min · 19:15 – 19:30)
1. `src/orders/composition.ts`: en `createOrdersModule`, conecta `cancelOrder` con `createCancelOrder` y los adapters recibidos.
2. `src/orders/ui/cancellation-messages.ts`: cambia el `satisfies` a `Record<CancelOrderError, string>`. `npm run typecheck` dirá qué tres mensajes faltan. El de `conflict` lo fija el test; los otros dos los redactas tú.
3. `src/orders/ui/useCancelOrder.ts`: implementa el hook. Devuelve `{ cancel, pending }`. `cancel(command)` resuelve `{ ok: true }` o `{ ok: false, message }`. Un error inesperado devuelve `UNEXPECTED_ERROR` sin romper la pantalla. Quita `.skip` en `useCancelOrder.test.tsx`.
4. `src/pages/OrdersPage.tsx` · `handleCancel`: usa `useCancelOrder()`. Para cancelar, la pantalla ya no valida ni llama a `doAction` o `trackEvent`. Si falla: `alert(outcome.message)`. Si va bien: marca la fila (`{ ...reasonFor, ord_st: 'cancelled' }`), aviso «Pedido cancelado» y cierre del diálogo. Quita `.skip` en `src/pages/cancel-order-flow.test.tsx`.
5. Un test de la Sesión 3 se pondrá rojo. Antes de tocarlo, decide: ¿ha cambiado el comportamiento o el test dependía de un detalle? Arréglalo **sin cambiar lo que comprueba**.
6. Comprobación final:
   ```bash
   npm test && npm run typecheck && npm run lint:arch && npm run lint:boundaries
   grep -n "doAction\|order_cancelled" src/pages/OrdersPage.tsx     # ninguna línea
   ```

## Entrega
```bash
git add -A
git commit -m "feat(orders): caso de uso cancelOrder con puertos, adapter HTTP y Composition Root"
git push -u origin s4/<tu-nombre>
```
Abre el Pull Request y completa la checklist de la plantilla (incluye el bloque «Casos de uso y composición»).

## Ampliación (si terminas antes)
- Migra el botón «Cancelar pedido» de `OrderDetailPage` al caso de uso. Hoy cancela **sin motivo**: ¿qué dice la regla de producto?
- Añade un puerto `Logger` para que el fallo de analítica de la Parte A no se pierda en silencio. ¿Quién debe registrarlo, el caso de uso o el adapter?
- Con el prompt P1 de `prompts/sesion-4.md`, genera el esqueleto de un caso de uso `approveOrder` con los mismos puertos y compáralo con `examples/tema5/approve-order`.
- Hito del proyecto final: completa `docs/adr/002-inyeccion-de-dependencias.md` y la tabla «Mi mapa de puertos» de `docs/arquitectura-objetivo.md`.
