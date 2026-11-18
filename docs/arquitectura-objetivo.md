# Arquitectura objetivo de la feature Pedidos

```
src/orders/
├── domain/           Entidades, tipos y reglas del negocio (TypeScript puro)
├── application/      Casos de uso y puertos (interfaces que el núcleo necesita)
├── infrastructure/   Adapters: HTTP, memoria, storage, analytics + DTO y mappers
├── ui/               Contenedores, hooks, view models puros (orders-*.ts) y components/ (presentacionales)
├── composition.ts    Fábricas: createOrdersModule (casos de uso) y createHttpAdapters / createInMemoryAdapters
└── index.ts          API pública: lo único que el resto de la app puede importar
```

| Capa | Anillo de Clean Architecture | Puede importar | No puede importar |
|---|---|---|---|
| `domain` | Entidades | — | todo lo demás, frameworks, globales del navegador |
| `application` | Casos de uso | `domain` | `infrastructure`, `ui`, `composition`, frameworks |
| `infrastructure` | Adaptadores de interfaz (conducidos) | `domain`, `application` (puertos) | `ui`, `composition` |
| `ui` | Adaptadores de interfaz (presentación) | `domain`, `application`, `composition` | `infrastructure` |
| `composition.ts` | Frameworks y drivers / main | todo | — |

Reglas automáticas: `eslint.architecture.js` (`npm run lint:arch`) y su test (`npm run test:arch`); `eslint.boundaries.js` (`npm run lint:boundaries`) para la API pública.

El módulo se crea **una vez** en `src/main.tsx` (Composition Root) y llega a React con `OrdersProvider`. Los tests son otro Composition Root: crean el módulo con `createInMemoryAdapters`.

## Mapa de puertos (Sesión 4)
| Puerto | Lo necesita | Adapter real | Fake | Se compone en |
|---|---|---|---|---|
| `OrderReader` | `loadOrderSummary`, `listUrgentOrders` | `http-order-reader.ts` | `in-memory-order-gateway.ts` (`findAll`) | `composition.ts` |
| `OrderGateway` | `cancelOrder` | `http-order-gateway.ts` | `in-memory-order-gateway.ts` | `composition.ts` |
| `Clock` | `cancelOrder` | `system-clock.ts` | `fixedClock(…)` o un literal | `composition.ts` |
| `EventPublisher` | `cancelOrder` | `analytics-event-publisher.ts` | `in-memory-event-publisher.ts` | `composition.ts` |

### Mi mapa de puertos (tarea antes de la Sesión 5)
Candidatos en el código heredado: filtros en `localStorage`, usuario activo (`userId`), navegación, avisos (toast), analítica de aprobación. Para cada uno decide si merece puerto o no y por qué.

| Dependencia | Evidencia `ruta:línea` | ¿Puerto? | Adapter real / fake | Motivo |
|---|---|---|---|---|
| Filtros guardados | `src/pages/OrdersPage.tsx` · Efecto 1 | Sí | `localStorage` / memoria | JSON corrupto rompe la pantalla; SSR y tests sin `localStorage` |
| | | | | |

## Mapa de estado (Sesión 5)
| Estado | Tipo | Dónde vive | Antes |
|---|---|---|---|
| Búsqueda, estado, «solo míos», orden | URL | `useOrdersCriteria` + `orders-criteria.ts` | Store global + `localStorage` + 2 efectos |
| Pedidos | Servidor | `useOrdersList` (reducer + caso de uso `listOrders`) | Store global, cargado en `useOrders` |
| Lista filtrada, contadores, acciones de fila | Derivado | `buildOrdersListViewModel` (se calcula) | 4 `useState` + 2 efectos |
| Modo compacto, pedido que se está cancelando, texto del motivo | Local de UI | `useState` en `OrdersListPage` y `CancelDialog` | `useState` en `OrdersPage` |
| Sesión (usuario) | Global | `src/store/appStore.tsx` → `src/shell/session.ts` | Igual |
| Aviso (toast) | Global | Store + `src/shell/ToastHost.tsx` | Store, pintado solo por la lista |

Reglas automáticas nuevas en `eslint.architecture.js`: `ui/orders-*.ts` no importa React ni el router; `ui/components/**` no importa el router, `OrdersProvider`, hooks `use…` ni la aplicación.

### Mi mapa de estado (tarea antes de la Sesión 6)
Clasifica el estado de `OrderDetailPage.tsx` y `DashboardPage.tsx` (`npm run state`).

| Estado | Evidencia `ruta:línea` | Tipo | Destino | Motivo |
|---|---|---|---|---|
| `total` del detalle | `src/pages/OrderDetailPage.tsx` · segundo `useEffect` | Derivado | View model | Se calcula a partir de `order` |
| | | | | |

## Mi clasificación del código heredado (tarea antes de la Sesión 3)
Copia este archivo como `docs/arquitectura-<tu-nombre>.md` y completa la tabla.

| Responsabilidad en el código actual | Evidencia `ruta:línea` | Capa destino | Primer paso para moverla |
|---|---|---|---|
| Total con descuento e IVA | `src/shared/utils.ts:13` | domain | Ya existe `calculateTotal` en `src/orders/domain/order.ts` |
| | | | |

## Mapa de confianza (Sesión 6)
| Dato | Quién lo controla | Dónde se comprueba | Qué pasa si es falso |
|---|---|---|---|
| Identidad (actor) | El servidor: cookie firmada `od_session` | `server/bff.mjs` · `actorOf` | La firma no cuadra → 401 |
| Rol y permisos | El servidor, con `shared/policy.json` | `server/bff.mjs` · `denyReason` | 403 aunque la pantalla enseñara el botón |
| Estado del pedido | El servidor (`server/store.mjs`) | `store.apply` | 409: la transición no se aplica |
| Motivo y justificación | La persona usuaria | `approval-form.ts` (ayuda) y el BFF (protege) | 422 y el dominio no llega a verlo |
| Importes visibles | El servidor: recorta antes de responder | `visibleFor` | El dato no está en la respuesta, ni en DevTools |
| Secretos | Solo Node (`SESSION_SECRET`) | `examples/tema11/env.mjs` · `scripts/secrets.mjs` | El servidor no arranca; el test falla |

```
src/session/            Slice de sesión: puerto, adapter HTTP, fake, Provider y entrada de usuario
server/bff.mjs          BFF: identidad, autorización y recorte de datos (lo único que mira el navegador)
server/app.mjs          API heredada: estados y datos. No comprueba permisos (no es nuestra)
shared/policy.json      Umbrales compartidos por el dominio y el BFF
```

### Mi mapa de confianza (tarea antes de la Sesión 7)
Para cada dato que tu feature recibe de fuera (URL, formulario, respuesta del backend, almacenamiento): quién lo controla, dónde se comprueba y qué pasa si llega falso. Lo que no tenga una casilla de «dónde se comprueba» es un riesgo abierto.
