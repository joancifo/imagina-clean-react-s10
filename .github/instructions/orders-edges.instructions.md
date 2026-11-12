---
applyTo: "src/orders/infrastructure/**,src/orders/ui/**"
---
# Bordes de pedidos (infraestructura y presentación)

- Infraestructura implementa puertos de `application/ports.ts` y traduce DTO ↔ dominio en un mapper. Valida en tiempo de ejecución los valores que llegan del backend.
- Presentación no importa `infrastructure`: obtiene implementaciones desde `composition.ts`.
- Los hooks de `ui` adaptan casos de uso a React y exponen estados `loading`, `ready` y `error`; no usan `alert()`.

## Adapters (Sesión 4)
- `fetch` no rechaza con respuestas 4xx/5xx: comprueba `response.ok` y traduce el estado a `OrderGatewayError` (404 `not-found`, 409 `conflict`, resto `unavailable`). Un `fetch` rechazado es `unavailable`.
- Cada adapter real tiene un fake en memoria que cumple el mismo test de contrato (`*.contract.ts`).
- Los hooks obtienen los casos de uso con `useOrdersModule()`; nunca importan `composition.ts` para crear adapters.
