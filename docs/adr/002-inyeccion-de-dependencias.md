# ADR-002 · Inyección de dependencias y Composition Root en Pedidos

- **Estado:** aceptado (versión de referencia del profesor)
- **Fecha:** 16/11/2026
- **Autoría:** Joan Cifo

## Contexto
- Hasta la Sesión 3, `src/orders/composition.ts` exportaba una instancia global (`orderReader`) y `useOrderSummary(reader = orderReader)` la usaba como parámetro por defecto: una dependencia oculta.
- Los casos de uso necesitan cuatro puertos (`OrderReader`, `OrderGateway`, `Clock`, `EventPublisher`) con dos implementaciones cada uno: real y en memoria.
- El código heredado (`src/services/api.ts`) usa axios directamente desde las pantallas.
- Tamaño: una feature con 3 casos de uso, 4 puertos y 3 pantallas. Equipo pequeño.

## Opciones consideradas
| Opción | A favor | En contra |
|---|---|---|
| 1. Imports directos e instancias globales | Cero código de composición | Tests con `vi.mock`; dependencias ocultas |
| 2. Inyección manual: factories + Composition Root + Provider de React | Tipado completo, sin librerías, grafo visible en un archivo | Hay que escribir el cableado a mano |
| 3. Contenedor IoC (InversifyJS, tsyringe, Awilix) | Resolución automática y ciclos de vida | Decoradores y `reflect-metadata` (InversifyJS, tsyringe) o resolución por nombre (Awilix); más conceptos para el equipo |

## Decisión
Opción 2: **inyección manual** (*Pure DI*, Seemann y van Deursen, 2019).
- Casos de uso como **factories** que reciben sus puertos: `createCancelOrder({ orders, clock, events })`.
- **Composition Root** en dos piezas: `src/orders/composition.ts` (qué adapters existen y cómo se conectan) y `src/main.tsx` (cuáles se usan en la aplicación). Los tests componen con `createInMemoryAdapters`.
- React recibe **un único módulo tipado** (`OrdersModule`) por `OrdersProvider`. Ofrece casos de uso, no adapters ni un `get('nombre')`.

Criterio: con 4 puertos y 3 casos de uso, el cableado ocupa unas 30 líneas legibles y el compilador comprueba cada dependencia. Un contenedor añadiría configuración y conceptos sin quitar trabajo.

## Consecuencias
- Positivas: casos de uso probados sin `vi.mock`; el grafo completo se lee en un archivo; cambiar de backend o de proveedor de analítica toca un adapter y una línea de composición.
- Aceptadas: cada caso de uso nuevo añade una línea a `createOrdersModule`; las pantallas heredadas necesitan el Provider (también en sus tests).
- Controles: `npm run lint:arch` (capas y reloj), `npm run test:contract` (fakes fieles), `useOrdersModule()` falla en voz alta sin Provider.
- Revisaremos la decisión si: hay más de cinco features con grafos profundos, aparecen ciclos de vida por petición (BFF de la Sesión 6) o el cableado manual supera un archivo legible.

## Lo que decidimos NO hacer
- **Contenedor IoC**: InversifyJS y tsyringe necesitan decoradores (`experimentalDecorators`, `emitDecoratorMetadata`) y `reflect-metadata`; Awilix resuelve por nombre en tiempo de ejecución. Ninguno compensa con este tamaño.
- **Service Locator** (`useService('orderGateway')`): oculta las dependencias en la firma y convierte un error de cableado en un fallo en tiempo de ejecución.
- **Un Provider por adapter**: las pantallas acabarían conociendo la infraestructura.
- **Instancias globales con parámetros por defecto**: comodidad que se paga con tests que hablan con la red sin avisar.
