# Ejercicio Sesión 7 · Medir, migrar con red y saber qué pasa cuando falla

**Duración:** 45 minutos (18:45 – 19:30) · **Corrección:** 15 minutos (19:30 – 19:45)
**Avance del proyecto final:** observabilidad de la feature, migración incremental del detalle y del panel, presupuesto de rendimiento y calidad real de los tests.

```bash
git checkout -b s7/<tu-nombre>
npm install
npm test                 # 451 tests en verde y 55 omitidos (skipped): 11 bloques que activarás tú
npm run build && npm run perf:budget   # 105,8 kB de JavaScript inicial. Presupuesto: 70 kB. FUERA.
npm run mutate -- src/orders/ui/orders-dashboard.ts   # 19 % de mutantes muertos con un 100 % de cobertura
```

## Contexto
La Sesión 6 cerró los agujeros de seguridad. Hoy toca la pregunta siguiente: **¿cómo sabemos que algo va mal en producción, y cómo cambiamos código heredado sin romper lo que funciona?**

Tres hechos de partida, todos comprobables:
1. **Un fallo silencioso.** Desde ayer, cada cancelación publica en la analítica un evento que el BFF rechaza con 422. El caso de uso ignora (a propósito) los fallos de analítica… y nadie se ha enterado. No hay ni un log.
2. **Dos pantallas heredadas.** `src/pages/OrderDetailPage.tsx` y `src/pages/DashboardPage.tsx` siguen con `axios`, `moment`, un `useEffect` para calcular el total y, en el panel, una fórmula propia que **no aplica el descuento por nivel**.
3. **Un bundle de 105 kB** (gzip) que descarga `axios` y `moment` aunque la primera pantalla, la lista, no los use.

```
Parte A                    Parte B                         Parte C
Observabilidad      ──▶    Migrar el detalle          ──▶  Migrar el panel y medir
logger con búfer           tests de caracterización        caracterización del panel
traced() en la             view model + hook + pantalla    tests que matan mutantes
composición                flag + carga perezosa           presupuesto de rendimiento
```

**Ya está escrito** (léelo antes de empezar): `src/observability/port.ts`, `log-entry.ts`, `memory-logger.ts`, `http-log-sink.ts`, `FeatureBoundary.tsx`; `server/bff.mjs` (`/api/telemetry`); `src/orders/application/load-order-detail.ts`; `src/shell/flags.tsx`; `src/orders/ui/orders-dashboard.ts`; `src/pages/characterization-harness.tsx` y los dos archivos `*.characterization.test.tsx` (la parte «heredada», activa).

Como en las Sesiones 5 y 6: **la especificación son los tests**, y en cada parte hay casos pensados para que la primera solución que se te ocurra falle.

## Antes de empezar (5 minutos de lectura que ahorran 20)

**Cómo trabajar con los tests.** Ejecuta solo el archivo en el que estás.
```bash
npx vitest run src/observability/buffered-logger.test.ts   # un archivo
npx vitest src/observability/traced.test.ts                # modo watch
npx vitest run -t "respuesta TARDÍA"                       # un test por su nombre
npm run test:characterization                              # las dos redes de caracterización
```

**Mapa de lo que ya existe y para qué te sirve.**

| Archivo | Qué te da | Lo usas en |
|---|---|---|
| `src/observability/port.ts` | `Logger`, `LogSink`, `LogRecord`, `LogEntry`, `LOG_FIELDS` (lista blanca) | A |
| `src/observability/log-entry.ts` | `toLogEntry(record, fecha)`: pone la hora, `traceId: null` si falta y filtra los campos | A |
| `src/observability/memory-logger.ts` | `createMemoryLogger()`: un fake con `entries` para leer en los tests | A, B |
| `src/orders/composition.ts` | `OrdersAdapters` ya trae `logger` y `newId`; `createInMemoryAdapters` los rellena (`t-1`, `t-2`…) | A |
| `src/orders/application/load-order-detail.ts` | Caso de uso del detalle: `Result<Order, 'not-found' \| 'unavailable'>`. Ya está en el módulo como `loadOrderDetail` | B |
| `src/orders/ui/formatters.ts` | `formatCurrency`, `formatDate` (los mismos que la lista) | B |
| `src/orders/domain/permissions.ts` y `cancellation.ts` | `canSeeAmounts(actor)` y `canCancel(order, actor)` | B |
| `src/shell/flags.tsx` | `useFlag('newOrderDetail')`, `FlagsProvider`, `readFlags` | B |
| `src/observability/FeatureBoundary.tsx` | Límite de error por feature que registra `ui.crash` | B |
| `src/orders/ui/useOrdersList.ts` | El hook de datos de la lista (Sesión 5): `{ state, reload }` | C |
| `src/orders/ui/orders-dashboard.ts` | `buildDashboardMetrics(orders, actor)`: la regla correcta, ya escrita | C |

**Orden recomendado.** A → B → C. Si te atascas más de 5 minutos en un paso, pasa al siguiente y vuelve después. Las partes son independientes salvo una cosa: el presupuesto de la Parte C solo se cumple si la Parte B carga el detalle heredado bajo demanda.

## Parte A · Que quede rastro (15 min · 18:45 – 19:00)
Archivos: `src/observability/buffered-logger.ts`, `traced.ts`, `observed-publisher.ts`, `src/orders/composition.ts` y `src/orders/infrastructure/analytics-event-publisher.ts`.
Tests: `buffered-logger.test.ts` (8), `traced.test.ts` (7), `src/orders/observability.test.ts` (4) y `analytics-event-publisher.test.ts` (2).

1. Quita los `.skip` de esos cuatro archivos.
2. `createBufferedLogger`: agrupa entradas y las envía por lotes. Nunca lanza, nunca envía dos veces, nunca crece sin límite.
3. `traced(nombre, casoDeUso, deps)`: decorador que mide y registra **una** entrada por llamada, sin cambiar lo que devuelve.
4. `observePublisher(events, deps)`: si publicar falla, registra `events.publish_failed` y relanza.
5. En `createOrdersModule`: envuelve `cancelOrder`, `approveOrder` y `loadOrderDetail` con `traced`, y los eventos con `observePublisher`.
6. Ejecuta `analytics-event-publisher.test.ts`: **lee el 422** y corrige el publicador.
7. `npm run test:observability && npm run lint:arch` → verde.

> El núcleo no sabe que lo miden. Si te encuentras importando `observability` desde `domain/` o `application/`, para: `lint:arch` lo prohíbe.

### Pautas de la Parte A

> `buffered-logger.test.ts` tiene **tres** `describe.skip` y `traced.test.ts` uno. Quítalos todos.

**`createBufferedLogger({ sink, clock, maxBatch = 20, maxBuffer = 200 })`** · devuelve `{ log, flush, pending, dropped }`.
- Estado interno: `let buffer: LogEntry[] = []`, `let dropped = 0`, `let inFlight: Promise<void> | null = null`.
- `log(record)`: `buffer.push(toLogEntry(record, clock.now()))`; si pasa de `maxBuffer`, quita las **más antiguas** (`buffer = buffer.slice(exceso)`) y súmalas a `dropped`; si `buffer.length >= maxBatch`, `void flush()`.
- `flush()`:
  - Si hay un envío en marcha, devuelve **ese mismo** `inFlight`. Así dos `flush()` seguidos no mandan dos veces lo mismo.
  - Si no hay nada, `Promise.resolve()` sin llamar al destino.
  - Si hay: `const batch = buffer; buffer = [];` (el lote se lleva el array; el búfer empieza otro). **No** hagas `sink.send(buffer)` y luego `buffer.length = 0`: vaciarías el array que el destino está enviando.
  - `inFlight = sink.send(batch).catch(() => { buffer = [...batch, ...buffer]; /* y vuelve a aplicar el tope */ }).finally(() => { inFlight = null; })`.
  - Devuelve `inFlight`. Gracias al `catch`, **nunca rechaza**.

**`traced(name, useCase, { logger, clock, newId, feature })`** · devuelve `async (command) => …`.
- Al empezar: `const traceId = newId()` y `const startedAt = clock.now().getTime()`.
- `orderId`: solo si `command.orderId` es un `string`. **Ningún otro campo** del comando (ni `reason`, ni `draft`, ni `actor`).
- Resultado `ok` → `level: 'info'`, `fields: { orderId, outcome: 'ok', durationMs }`.
- Resultado con error → `level: 'warn'`, `fields: { orderId, outcome: 'error', code: result.error, durationMs }`.
- Excepción → `level: 'error'`, `fields: { orderId, outcome: 'exception', errorName: error.name, durationMs }` y `throw error` (**el mismo** objeto: `rejects.toBe(boom)`).
- `durationMs = clock.now().getTime() - startedAt`, calculado **después** de que termine el caso de uso.
- Devuelve el `result` tal cual (no una copia: el test usa `toBe`).

**`observePublisher(events, { logger, feature })`** · un objeto con `publish(event)` que hace `try { await events.publish(event) } catch (error) { logger.log({ level: 'warn', event: 'events.publish_failed', feature, fields: { code: event.type, errorName } }); throw error; }`.

**Composición** (`src/orders/composition.ts`):
```ts
const trace = { logger, clock, newId, feature: 'orders' };
const observedEvents = observePublisher(events, { logger, feature: 'orders' });
cancelOrder: traced('orders.cancel', createCancelOrder({ orders: gateway, clock, events: observedEvents }), trace),
```
Igual para `approveOrder` (`'orders.approve'`) y `loadOrderDetail` (`'orders.load_detail'`). Importa desde `'../observability'`.

**El 422.** Con el `.skip` quitado, `analytics-event-publisher.test.ts` levanta el BFF de verdad y publica una cancelación. Lee el fallo y mira qué campos acepta `/api/logs` en `server/bff.mjs`. La corrección es una línea en `toLog`.

**Trampas que hacen fallar un test:** pasar el mismo array al destino y vaciarlo después; un segundo `flush` que vuelve a enviar; dejar que `flush` rechace; meter el comando entero en `fields`; registrar el `error.message` (lleva datos); relanzar `new Error(…)` en vez del original; registrar antes de que termine el caso de uso.

## Parte B · Migrar el detalle con red (15 min · 19:00 – 19:15)
Archivos: `src/orders/ui/orders-detail-view-model.ts`, `useOrderDetail.ts`, `OrderDetailScreen.tsx`, `src/shell/OrderDetailRoute.tsx` y `src/shell/AppRoutes.tsx`.
Tests: `orders-detail-view-model.test.ts` (7), `useOrderDetail.test.tsx` (5), el bloque «nueva» de `order-detail.characterization.test.tsx` (13) y `OrderDetailRoute.test.tsx` (4).

1. Lee el bloque **heredada** de `order-detail.characterization.test.tsx`. Está en verde: es lo que hace hoy la pantalla, bugs incluidos. Esa es tu red.
2. `buildOrderDetailViewModel(order, actor)`: función pura con todo lo que pinta el detalle.
3. `useOrderDetail(orderId)`: cuatro estados (`loading`, `not-found`, `error`, `ready`) y **ninguna respuesta tardía**.
4. `OrderDetailScreen`: misma marca que la heredada; datos del hook, texto del view model y cancelación con `useCancelOrder`.
5. Quita el `.skip` del bloque **nueva** de la caracterización: las dos versiones tienen que pasar la misma tabla.
6. `OrderDetailRoute`: el flag `newOrderDetail` elige versión. La heredada se carga con `lazy()`.
7. `npm test && npm run lint:arch && npm run typecheck` → verde.

> Un test de caracterización no dice si el comportamiento es correcto: dice que **no ha cambiado sin querer**. Donde cambia a propósito, ya está escrito con `{ heredada, nueva }`. No toques esas expectativas: impleméntalas.

### Pautas de la Parte B

**Paso 2 · `buildOrderDetailViewModel`** (`orders-detail-view-model.ts`, sin React: lo vigila `lint:arch`).

| Campo | Valor | Ojo |
|---|---|---|
| `title` | `` `Pedido ${order.id}` `` | |
| `status` | `{ label, danger }` con una tabla `{ pending: 'Pendiente', approved: 'Aprobado', shipped: 'Enviado', cancelled: 'Cancelado' } satisfies Record<OrderStatus, string>` | `danger` solo para `cancelled` |
| `subtitle` | `` `${customerName} · ${formatDate(createdAt)} · ${customerTier}` `` | El nivel **tal cual** («gold»): así lo enseña la heredada |
| `lines` | `{ sku, quantity: String(…), unitPrice: formatCurrency(…), amount: formatCurrency(quantity * unitPrice) }` | Importe de línea **sin** descuento |
| `note` | `order.customerNote` si tiene texto; si no, `null` | Cadena vacía → `null` |
| `total` | `` `Total con IVA: ${formatCurrency(calculateTotal(order))}` `` o `null` si `!canSeeAmounts(actor)` | Cambio a propósito: un agente ya no ve «0,00 €» |
| `canCancel` | `canCancel(order, actor)` del dominio | |

**Paso 3 · `useOrderDetail(orderId)`** · lee `loadOrderDetail` con `useOrdersModule()`.
- Guarda el resultado **junto con el pedido al que pertenece**: `useState<{ orderId: string; state: OrderDetailState } | null>(null)`.
- Devuelve `loaded?.orderId === orderId ? loaded.state : { status: 'loading' }`. Así, al cambiar de pedido, vuelve a «cargando» sin un `setState` en el efecto.
- En el `useEffect([loadOrderDetail, orderId])`: `let active = true;` → `loadOrderDetail({ orderId }).then(ok, fallo)` → en ambos, `if (!active) return;` → la limpieza pone `active = false`. Es el mismo patrón que `useOrdersList`.
- `result.ok` → `ready`; `result.error === 'not-found'` → `not-found`; cualquier otro error **o una excepción** → `error`.

**Paso 4 · `OrderDetailScreen({ orderId, actor, onNotify })`.**
- `loading` → `<main className="page">Cargando…</main>`.
- `not-found` → `<h1>No existe el pedido {orderId}</h1>` y `<Link to="/">Volver a Pedidos</Link>`.
- `error` → un `role="alert"` con un mensaje para la persona usuaria.
- `ready` → copia la marca de `OrderDetailPage.tsx` sustituyendo cada cálculo por un campo del view model: `<h1>{title} <span className={…}>{status.label}</span></h1>`, `<p>{subtitle}</p>`, la tabla, la nota con `className="note"` (como **texto**), el total solo si no es `null`, el botón solo si `canCancel`.
- Cancelar: `cancel({ orderId, reason: 'Cancelado desde el detalle', actor })` con `useCancelOrder()`. Si va bien: `onNotify('Pedido cancelado')` y `navigate('/')`. Si no: el mensaje en un `role="alert"`.

**Paso 6 · `OrderDetailRoute({ session, onNotify })`.**
```tsx
const LegacyOrderDetailPage = lazy(() => import('../pages/OrderDetailPage')); // fuera del componente
// flag apagado → <Suspense fallback={<main className="page">Cargando…</main>}><LegacyOrderDetailPage /></Suspense>
// flag encendido → <RequireAccess session={session} can={canViewOrders}>{(actor) =>
//     <FeatureBoundary feature="orders-detail"><OrderDetailScreen key={id} orderId={id} actor={actor} onNotify={onNotify} /></FeatureBoundary>}
// </RequireAccess>
```
- `id` sale de `useParams()`. `OrderDetailScreen` y `canViewOrders` se importan de `'../orders'`; `FeatureBoundary`, de `'../observability'`.
- En `AppRoutes.tsx`: `<Route path="/orders/:id" element={<OrderDetailRoute session={session} onNotify={onNotify} />} />` y **borra** el `import OrderDetailPage` estático (si queda, `lazy` no sirve de nada: el código ya va en el bundle principal).

**Trampas que hacen fallar un test:** traducir el nivel («Cliente Gold»); aplicar el descuento al importe de cada línea; `customerNote ?? null` (deja pasar `''`); olvidar el `active` (la respuesta de P-1 llega tarde y pisa a P-2); un `catch` que no existe y deja la pantalla en blanco; pintar la nota con `dangerouslySetInnerHTML`; dejar el import estático del detalle heredado.

## Parte C · El panel, la calidad de los tests y el presupuesto (15 min · 19:15 – 19:30)
Archivos: `src/orders/ui/DashboardScreen.tsx`, `src/orders/ui/orders-dashboard.test.ts`, `src/shell/AppRoutes.tsx` y lo que sobre.
Tests: el bloque «nueva» de `dashboard.characterization.test.tsx` (5) y **los que escribas tú** en `orders-dashboard.test.ts`.

1. `DashboardScreen({ actor })`: `useOrdersList()` + `buildDashboardMetrics()`. Quita el `.skip` del bloque «nueva» de la caracterización del panel.
2. Cambia la ruta `/dashboard` para que use `DashboardScreen` (sin flag: los dos cambios de comportamiento están decididos y probados).
3. Borra `src/pages/DashboardPage.tsx`, su bloque «heredada» de la caracterización y el test del panel de `cancel-order.test.tsx`. Anótalo en el PR.
4. `npm run mutate -- src/orders/ui/orders-dashboard.ts`: **13 supervivientes**. Escribe en `orders-dashboard.test.ts` los tests que los matan hasta llegar al 100 %. No toques `orders-dashboard.ts`.
5. `npm run build && npm run perf:budget` → **DENTRO**. `npm run unused` → nada en `src/`.

### Pautas de la Parte C

**Paso 1 · `DashboardScreen`.** Tres estados de `useOrdersList`: `loading` → «Cargando…» (la heredada enseñaba ceros), `error` → `role="alert"` con un botón «Reintentar» que llama a `reload`, `ready` → la misma marca que `DashboardPage.tsx` con los tres valores de `buildDashboardMetrics(state.orders, actor)`. En `AppRoutes.tsx`: `{(actor) => <DashboardScreen actor={actor} />}` dentro del `RequireAccess` que ya existe, importando `DashboardScreen` de `'../orders'`.

**Paso 4 · Matar mutantes.** Lee cada línea `SOBREVIVE` como una pregunta: «¿qué test fallaría si el código hiciera esto?».

| Superviviente | Qué significa | Test que lo mata |
|---|---|---|
| `order.status === 'pending'` → `true` / `!==` | Nadie comprueba que **solo** se cuentan los pendientes | Mezcla de estados y `toBe(2)` exacto |
| `'approved'`, `'shipped'` → `''`, `===` → `!==`, `\|\|` → `&&` | Nadie comprueba **qué** estados se facturan | Un aprobado solo, un enviado solo y los dos juntos, con el importe exacto |
| `revenue += …` → `-=` | Nadie mira el **valor** de la facturación | `'121,00 €'` exacto (100 € standard + IVA). Ojo: Intl pone U+00A0 antes del €; normaliza con `.replace(/\s+/g, ' ')` |
| condición de facturación → `true` | Nadie comprueba que un pendiente o un cancelado **no** facturan | Pendiente + cancelado → `'0,00 €'` |
| `canCancel(…)` → `true` / `false`, `cancellable += 1` → `-=` | Nadie mira el número exacto de cancelables | Un admin y un manager con los mismos pedidos y su número exacto |

- `toBeGreaterThan(0)` y `toBeDefined()` ejecutan la línea pero no la comprueban: por eso sobreviven los mutantes con un 100 % de cobertura.
- Cada ejecución tarda unos segundos (un `vitest run` por mutante). Mientras tanto, escribe el siguiente test.

**Paso 5 · Presupuesto.** Si `perf:budget` sigue FUERA, alguien importa de forma **estática** algo que arrastra `axios` o `moment` en la primera pantalla. Comprueba que `AppRoutes.tsx` ya no importa ninguna página de `src/pages`.

**Trampas que hacen fallar un test:** pintar «0» mientras carga; calcular la facturación en la pantalla; borrar `DashboardPage.tsx` sin borrar su bloque de caracterización (no compila); «matar» mutantes cambiando `orders-dashboard.ts`; dejar un import estático de `src/pages`.

## Comprobación final
```bash
npm test && npm run typecheck && npm run lint:arch && npm run lint:boundaries
npm run mutate -- src/orders/ui/orders-dashboard.ts --check   # 100 %
npm run build && npm run perf:budget                          # DENTRO
npm run unused                                                # nada en src/
npm run dev    # abre /orders/P-1001 y /orders/P-1001?flags=-newOrderDetail: ¿qué chunk descarga cada una? (pestaña Red)
```

## Entrega
```bash
git add -A
git commit -m "feat(orders): observabilidad, detalle y panel nuevos con caracterización y presupuesto de rendimiento"
git push -u origin s7/<tu-nombre>
```
Abre el Pull Request y completa la checklist (incluye el bloque «Rendimiento, observabilidad y refactor»). En el PR anota: cada test borrado y qué test lo sustituye; los dos cambios de comportamiento del panel y los dos del detalle; antes y después de `perf:budget` y de `mutate`.

## Ampliación (si terminas antes)
- Con la aplicación arrancada, cancela un pedido y mira la salida del BFF: ¿qué líneas de telemetría llegan? ¿Cuántas había antes de hoy?
- `npm run test:map`: ¿qué capa concentra el tiempo de la suite? ¿Dónde siguen quedando `vi.mock`? Propón cómo eliminar uno.
- `npm run mutate -- src/orders/domain/cancellation.ts`: ¿sobrevive algo? ¿Es un hueco de los tests o un mutante equivalente?
- Copia `examples/tema14/render-count.test.tsx` y mide `OrdersTable` al marcar «Vista compacta». ¿Compensa `memo`? Decide con el número.
- Hito del proyecto final: completa `docs/adr/005-migracion-y-observabilidad.md` y `docs/estrategia-testing.md`.
