# ADR-002 · Inyección de dependencias y Composition Root en Pedidos

- **Estado:** propuesto
- **Fecha:** 16/11/2026
- **Autoría:** <tu-nombre>

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
<!-- Escribe tu decisión y el criterio que la justifica. -->

## Consecuencias
<!-- Qué ganamos, qué aceptamos, qué controles lo protegen (comandos) y cuándo revisaríamos la decisión. -->

## Lo que decidimos NO hacer
<!-- p. ej. contenedor IoC, Service Locator, un Provider por adapter… y por qué. -->
