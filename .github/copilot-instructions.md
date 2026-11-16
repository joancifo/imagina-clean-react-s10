# Instrucciones para GitHub Copilot — OrderDesk

Este repositorio es material de formación con code smells intencionados en el código heredado (`src/pages`, `src/services`, `src/shared`, `src/store`, `src/hooks`, `src/components`).

## Forma de trabajar
- Durante el diagnóstico, no modifiques archivos: analiza y propón.
- Cita siempre la evidencia como `ruta:línea`. Si no encuentras evidencia, indícalo.
- Separa hechos observados de hipótesis.
- Propón cambios pequeños, reversibles y revisables en un solo Pull Request.
- No propongas reescrituras completas ni nuevas librerías sin justificar el coste.

## Arquitectura objetivo (`src/orders`)
- Capas: `domain` → `application` → `infrastructure` / `ui`, conectadas en `composition.ts`.
- Las dependencias de código fuente apuntan hacia dentro: `domain` no importa nada de otras capas.
- `domain` y `application` no importan React, react-router ni axios, ni usan `window`, `document`, `localStorage` o `fetch`.
- `ui` no importa `infrastructure`: usa casos de uso y la composición.
- Los nombres del backend (`ord_st`, `cust_nm`…) solo aparecen en `infrastructure/order-dto.ts` y `order-mapper.ts`.
- El código de fuera de `src/orders` importa solo su API pública: `import { … } from '../orders'` (`npm run lint:boundaries`).
- Comprueba cualquier propuesta con `npm run lint:arch`, `npm run test:arch` y `npm run lint:boundaries`.
- No crees interfaces con una sola implementación si no cruzan un límite de capa.

## Composición (Sesión 4)
- Las implementaciones concretas se eligen solo en `src/orders/composition.ts` y se crean una vez en `src/main.tsx` (o en el test).
- No exportes instancias globales de adapters ni uses parámetros por defecto con instancias reales.
- React recibe casos de uso mediante `OrdersProvider`/`useOrdersModule()`. No crees registros globales ni hooks del tipo `useService('nombre')`.
- No introduzcas contenedores IoC ni decoradores sin un ADR que lo justifique.

## Presentación y estado (Sesión 5)
- Una pantalla se divide en contenedor (`ui/*Page.tsx`), view model puro (`ui/orders-*.ts`) y componentes presentacionales (`ui/components/`).
- No guardes estado derivado: lo que se puede calcular a partir de props o de otro estado se calcula en el render. No propongas `useEffect` para sincronizar dos estados.
- Filtros, orden y paginación viven en la URL (`useSearchParams`), no en stores globales ni en `localStorage`.
- Los permisos de acceso son reglas de `domain/permissions.ts`; las rutas las aplican con `RequireAccess` (`src/shell`).
- No añadas librerías de estado o de caché sin un ADR. `examples/tema10/server-state.tsx` muestra el patrón aceptado si se adopta TanStack Query.
- Comprueba con `npm run lint:arch`, `npm run state` y los tests de `src/shell/AppRoutes.test.tsx`.
