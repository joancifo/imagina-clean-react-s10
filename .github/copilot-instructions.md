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

## Sesión 6 · Node, errores y seguridad
- La identidad la decide el servidor. No generes código que envíe `x-user-id`, lea el rol de `localStorage` o acepte el actor como parámetro de una petición.
- No guardes tokens ni sesiones en `localStorage` ni en `sessionStorage`: la sesión va en una cookie `HttpOnly` que pone el BFF (`credentials: 'include'` en el cliente).
- Nada que empiece por `VITE_` puede contener un secreto: viaja en el bundle. Los secretos se leen en Node desde `process.env`.
- Los datos que llegan de fuera se parsean (lista blanca de campos y de valores) antes de llegar al dominio. No uses `as` sobre datos externos.
- Los errores del BFF son `{ error: { code } }`: ni rutas, ni stack, ni mensajes del backend. En el cliente se traducen con una tabla (`gateway-failure.ts`) y se muestran con los mensajes de `ui/*-messages.ts`.
- A la analítica solo viajan `id`, `by`, `code`, `total` y `at`. Nunca nombres de cliente, motivos ni notas escritas a mano.
- Los umbrales de negocio viven en `shared/policy.json` y los usan el dominio y el BFF. Si cambias uno, el test `src/orders/policy.contract.test.ts` debe seguir en verde.
- No uses `dangerouslySetInnerHTML`. Si hace falta un enlace externo, valida el protocolo (`examples/tema13/external-data.ts`).

## Sesión 7 · Rendimiento, observabilidad y refactor
- No propongas `memo`, `useMemo` o `useCallback` sin una medición (React DevTools Profiler o un test con `<Profiler>` como `examples/tema14/render-count.test.tsx`). Indica qué número cambia.
- Las pantallas que no forman parte de la primera vista se cargan con `lazy()` desde el shell. Comprueba cualquier cambio de dependencias con `npm run build && npm run perf:budget`.
- Los logs pasan por el puerto `Logger` de `src/observability`. Dominio y aplicación no registran nada: la medición se añade en `composition.ts` con `traced()` y `observePublisher()`.
- Campos de log: solo los de `LOG_FIELDS` (`shared/telemetry.json`). Nunca mensajes de error, pilas, nombres, motivos ni notas: se registra el tipo de error (`errorName`).
- Antes de modificar código de `src/pages`, escribe o amplía sus tests de caracterización. Propón la migración en pasos: caracterizar → extraer funciones puras → versión nueva detrás de una abstracción → misma tabla de tests contra las dos → borrar la vieja.
- Un cambio de comportamiento durante un refactor se declara en el test con `{ heredada, nueva }` y en el PR. Si no está declarado, es un error.
- Para tests nuevos: valores exactos (`toBe`, `toEqual`), no `toBeDefined` ni `toBeGreaterThan(0)`. Comprueba los módulos críticos con `npm run mutate -- <archivo>`.

## Sesión 8 · Pruebas: datos, pantalla y frontera
- Todo lo que llega de fuera se valida en `infrastructure/order-dto.ts` (`parseOrderDto`) antes de traducirse al dominio. No generes `as` sobre una respuesta HTTP, un `localStorage` ni un parámetro de URL.
- Lista blanca también aquí: el parser devuelve un objeto nuevo con los campos conocidos. Un campo nuevo del backend no rompe al cliente, pero tampoco entra solo.
- Un campo que el backend puede no enviar se modela con `null` («no lo sé»), no con `undefined` ni con una cadena vacía. Si la interfaz no puede hacer algo sin ese dato, no lo ofrece.
- Datos de prueba: `src/orders/testing` (builders, madres con nombre de negocio, dobles escritos a mano, fixtures importadas de `server/store.mjs`, `renderOrders`, `startBff`). No propongas fixtures copiadas ni `vi.mock` en código nuevo.
- Tests de componente: React Testing Library con `userEvent`, consultas por rol y nombre accesible, y los mensajes de error atados a su campo (`aria-invalid` + `aria-describedby`). Nada de clases CSS, estructura del HTML ni snapshots completos.
- Tests de adapter: MSW (`src/orders/testing/msw.ts`), con un caso por código de estado y uno por respuesta imposible (sin JSON, sin red, cuerpo con otra forma).
- El contrato de un puerto se ejecuta contra el fake y contra `server/bff.mjs`, nunca contra `server/app.mjs`. Si un caso solo lo puede cumplir el adapter HTTP, va fuera del contrato compartido.
- Si un fake acepta algo que el backend rechaza, el arreglo es el fake (y el dato compartido en `shared/policy.json`), no bajarle la exigencia al contrato.
- Aserciones: valores exactos. `npm run test:weak` lista las débiles; `npm run mutate -- <archivo>` dice si los tests comprueban o solo ejecutan.

## Sesión 9 · E2E, CI y revisión de código
- E2E solo para journeys críticos (`e2e/`), con las fixtures de `e2e/fixtures.ts`, localizadores por rol acotados a su contexto y aserciones web-first. Nada de `waitForTimeout` ni CSS por posición. Detalle en `.github/instructions/e2e.instructions.md`.
- El pipeline (`.github/workflows/ci.yml`) está especificado por `scripts/pipeline.test.mjs`. Nunca propongas silenciar un control (`continue-on-error`, `|| true`, `.skip`, más `retries`) para volver a verde.
- Cambios en permisos, secretos, entornos o reglas de rama: explica y deja la decisión a una persona.
- Al revisar un PR: comenta con Conventional Comments (`issue`, `suggestion`, `question`, `nitpick`, `praise`), indica si es bloqueante y cita `ruta:línea`. Prioriza límites de capa, datos de fuera sin parsear, secretos y datos personales, y tests que no comprueban. No comentes estilo que ya resuelven las herramientas. No apruebes: la decisión es de una persona.
- Un cambio de arquitectura sin ADR en `docs/adr/` (formato en `docs/adr/README.md`) es un hallazgo de revisión.

