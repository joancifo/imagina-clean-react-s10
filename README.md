# OrderDesk · repositorio de prácticas

Curso **Clean Architecture para Frontend con React y Node — SOLID, Code Smells, Patrones y Testing** · Imagina Formación · Joan Cifo

> Proyecto de formación con **code smells y errores sembrados a propósito**. Datos e historial de commits ficticios (el historial está simulado para practicar el análisis de hotspots). No lo despliegues ni reutilices su código.

OrderDesk es un backoffice de pedidos B2B: listado, detalle, aprobación, cancelación y panel. **Funciona, y ese es el problema:** su estructura hace que cada cambio sea caro y arriesgado.

## Requisitos
- Node.js LTS y npm · Git · Visual Studio Code con la extensión de GitHub Copilot

## Arranque
```bash
npm install
npm run dev     # web: http://localhost:5173 · API: http://localhost:3001
```
Usuario activo: clave `userId` de `localStorage` (`u1` admin, `u2` manager, `u3` agente).

## Comandos
| Comando | Qué responde |
|---|---|
| `npm test` | ¿Pasan los tests actuales? |
| `npm run coverage` | ¿Qué código ejecutan los tests? |
| `npm run demo:tema1` | Regla pura y caso de uso probados sin React, navegador ni red |
| `npm run map` | Inventario: líneas, imports salientes y entrantes por módulo |
| `npm run cycles` | Dependencias circulares (madge) |
| `npm run smells` | Complejidad, tamaño y reglas de hooks (ESLint) |
| `npm run deps` | Dependencias sin usar (knip) |
| `npm run hotspots` | Archivos con más commits |
| `npm run demo:tema3` | Ejemplos SOLID (SRP, OCP, LSP, ISP, DIP) |
| `npm run demo:tema4` | Núcleo por capas probado sin React, navegador ni red |
| `npm run lint:arch` | Regla de dependencia entre capas de `src/orders` |
| `npm run test:arch` | Test que demuestra que las reglas detectan violaciones |
| `npm run demo:tema5` | Vertical slice «Aprobar pedido»: regla, comando, adapter y UI en una carpeta |
| `npm run demo:tema6` | Value object, entidad y aggregate, domain service y specification |
| `npm run boundaries` | Imports entre carpetas y accesos que se saltan la API pública de Pedidos |
| `npm run rules` | Candidatos a reglas de negocio escondidas fuera del dominio |
| `npm run lint:boundaries` | El código heredado solo importa Pedidos desde `src/orders/index.ts` |
| `npm run demo:tema7` | Casos de uso: reasignar pedido (asíncrono, 4 puertos) y presupuesto (síncrono) |
| `npm run demo:tema8` | Adapters de almacenamiento con contrato, formas de inyección y composición en Node |
| `npm run test:contract` | El mismo contrato de `OrderGateway` contra el fake en memoria y contra la API real |
| `npm run demo:tema9` | Presentacional con cuatro estados, composición, view model y hooks de UI |
| `npm run demo:tema10` | Estado derivado, máquina de estados, URL como fuente de verdad y caché de servidor |
| `npm run state` | Mapa de `useState`, `useEffect`, store global, URL y `localStorage` por archivo |
| `npm run unused` | Archivos que ya no importa nadie (knip) |
| `npm run demo:tema11` | Node: endpoint de BFF, variables de entorno y script de scaffolding |
| `npm run demo:tema12` | Patrones, errores por origen y reintento |
| `npm run demo:tema13` | Datos de fuera, enlaces y logs sin datos personales |
| `npm run test:bff` | El BFF: sesión firmada, autorización real y recorte de datos |
| `npm run test:policy` | El dominio y el BFF deciden lo mismo (contrato de política) |
| `npm run audit:secrets` | Secretos, identidad del cliente, HTML sin escapar y sesión en localStorage |
| `npm run test:security` | Tests de sesión y de los controles de seguridad |
| `npm run demo:tema14` | Renders medidos con `<Profiler>`, carga bajo demanda y percentiles de latencia |
| `npm run demo:tema15` | Tests de caracterización contra la versión heredada y la refactorizada |
| `npm run demo:tema16` | Los cinco dobles de prueba, builders, tests frágiles y mutación |
| `npm run test:observability` | Logger con búfer, decoradores, `FeatureBoundary` y `/api/telemetry` |
| `npm run test:characterization` | Las redes de caracterización del detalle y del panel |
| `npm run mutate -- <archivo>` | Mutation testing: ¿qué comportamiento ejecutan los tests sin comprobarlo? |
| `npm run perf:budget` | JavaScript inicial (gzip) frente al presupuesto de `perf-budget.json` (antes: `npm run build`) |
| `npm run test:map` | Tests, tiempo y `vi.mock` por capa |
| `npm run demo:tema17` | Tests que comprueban frente a tests que ejecutan: nombres, tablas de transiciones e invariantes |
| `npm run demo:tema18` | La escalera de consultas de RTL, `fireEvent` frente a `userEvent` y los cuatro estados |
| `npm run demo:tema19` | Validar en la frontera, MSW en tres minutos y fixtures que no se pudren |
| `npm run test:frontera` | Adapters y kit de pruebas de la feature |
| `npm run test:components` | Los componentes presentacionales, probados como los usa una persona |
| `npm run test:integration` | El adapter HTTP contra una red simulada: un caso por código de estado |
| `npm run test:weak` | Aserciones que ejecutan sin comprobar, y `vi.mock` que el diseño ya no necesita |

## Material de la Sesión 1
- `examples/tema1/` — ejemplos ejecutables del Tema 1
- `prompts/sesion-1.md` — prompts de GitHub Copilot en modo de solo análisis
- `docs/ejercicio-s1.md` — ejercicio de diagnóstico y matriz de deuda
- `docs/proyecto-final.md` — proyecto final evolutivo
- `.github/copilot-instructions.md` — instrucciones del repositorio para Copilot

## Material de la Sesión 2
- `examples/tema3/` — un ejemplo ejecutable por principio SOLID
- `examples/tema4/` y `src/orders/` — arquitectura por capas: dominio, aplicación, infraestructura, presentación y composición
- `eslint.architecture.js` — reglas de importación por capa
- `docs/checklist-pr.md` y `.github/pull_request_template.md` — checklist SOLID para Pull Requests
- `docs/arquitectura-objetivo.md` — arquitectura objetivo de la feature Pedidos
- `.github/instructions/` — instrucciones de Copilot por ruta
- `prompts/sesion-2.md` — prompts de GitHub Copilot
- `docs/ejercicio-s2.md` — ejercicio de la sesión

## Material de la Sesión 3
- `examples/tema5/approve-order/` — un vertical slice completo con su API pública
- `examples/tema6/` — Money, entidad y aggregate, domain service y specification
- `src/orders/domain/result.ts` — errores previsibles como valores
- `src/orders/index.ts` y `eslint.boundaries.js` — API pública de la feature Pedidos
- `scripts/boundaries.mjs` y `scripts/find-rules.mjs` — análisis de estructura y de reglas
- `docs/adr/001-estructura-pedidos.md` — decisión de estructura (proyecto final)
- `prompts/sesion-3.md` — prompts de GitHub Copilot
- `docs/ejercicio-s3.md` — ejercicio de la sesión

## Material de la Sesión 4
- `examples/tema7/` — casos de uso con dobles de prueba (asíncrono y síncrono) y el antipatrón del reenvío
- `examples/tema8/` — puerto de almacenamiento con dos adapters, formas de inyección, Service Locator y ciclos de vida en Node
- `src/orders/application/ports.ts` — puertos `OrderGateway`, `Clock` y `EventPublisher`
- `src/orders/infrastructure/` — adapters HTTP y en memoria, reloj, analítica y test de contrato
- `src/orders/composition.ts`, `src/orders/ui/OrdersProvider.tsx` y `src/main.tsx` — Composition Root
- `server/app.mjs` — API ficticia reutilizable (`createApp`) que ya rechaza transiciones imposibles con 409
- `docs/adr/002-inyeccion-de-dependencias.md` — decisión de composición (proyecto final)
- `prompts/sesion-4.md` — prompts de GitHub Copilot
- `docs/ejercicio-s4.md` — ejercicio de la sesión

## Material de la Sesión 5
- `examples/tema9/` — componente presentacional con cuatro estados, composición frente a flags, view model del detalle y hooks de UI
- `examples/tema10/` — estado derivado con y sin efecto, flujo de cancelación como máquina de estados, paginación en la URL y TanStack Query sobre casos de uso
- `src/orders/ui/` — `OrdersListPage` (contenedor), `components/` (presentacionales), view model, criterios de URL y hook de datos
- `src/orders/domain/approval.ts`, `permissions.ts` y `credit-risk.ts` — reglas que antes vivían en la pantalla
- `src/shell/` — mapa de rutas, guard `RequireAccess`, páginas 403 y 404, sesión y avisos
- `scripts/state-map.mjs` — mapa de estado y efectos (`npm run state`)
- `docs/adr/003-estado-y-presentacion.md` — decisión de estado y presentación (proyecto final)
- `prompts/sesion-5.md` — prompts de GitHub Copilot
- `docs/ejercicio-s5.md` — ejercicio de la sesión

## Material de la Sesión 6
- `examples/tema11/` — endpoint de BFF que agrega sin presentación, configuración de entorno y Node como herramienta
- `examples/tema12/` — Strategy, Factory, Adapter, Command, Observer (y Singleton como contraejemplo), errores por origen y reintento
- `examples/tema13/` — datos externos validados, enlaces seguros, logs sin datos personales y `inseguro/` con cinco errores sembrados
- `server/bff.mjs`, `server/session.mjs` y `server/store.mjs` — el BFF: identidad, autorización y recorte de datos
- `shared/policy.json` y `src/orders/policy.contract.test.ts` — umbrales compartidos y el test que impide que se separen
- `src/session/` — slice de sesión: puerto, adapter HTTP, fake, Provider y entrada de usuario
- `src/orders/ui/approval-form.ts` y `components/ApproveDialog.tsx` — esquema de formulario y diálogo de aprobación
- `src/orders/infrastructure/gateway-failure.ts` — adapter de errores del BFF
- `scripts/secrets.mjs` y `src/security.test.ts` — controles de seguridad del cliente
- `docs/adr/004-bff-sesion-y-seguridad.md` — decisión de BFF y límites de confianza (proyecto final)
- `prompts/sesion-6.md` — prompts de GitHub Copilot
- `docs/ejercicio-s6.md` — ejercicio de la sesión

## Material de la Sesión 7
- `examples/tema14/` — renders medidos con `<Profiler>`, carga bajo demanda con `lazy()` y percentiles de latencia
- `examples/tema15/` — tests de caracterización («golden master») y refactor en pasos de una función heredada
- `examples/tema16/` — dummy, stub, spy, mock y fake; builders; tests frágiles; mutación (`discount.ts`)
- `src/observability/` — puerto `Logger`, logger con búfer, `traced()`, `observePublisher()` y `FeatureBoundary`
- `server/bff.mjs` (`/api/telemetry`) y `shared/telemetry.json` — telemetría con la misma lista blanca en cliente y servidor
- `src/pages/*.characterization.test.tsx` — la red de la migración del detalle y del panel
- `src/shell/flags.tsx` — flags de lanzamiento (`?flags=-newOrderDetail`)
- `scripts/mutate.mjs`, `scripts/budget.mjs`, `scripts/test-map.mjs` y `perf-budget.json` — medir antes de opinar
- `docs/adr/005-migracion-y-observabilidad.md` y `docs/estrategia-testing.md` — hitos del proyecto final
- `prompts/sesion-7.md` — prompts de GitHub Copilot
- `docs/ejercicio-s7.md` — ejercicio de la sesión

## Material de la Sesión 8
- `examples/tema17/` — el mismo comportamiento probado bien y mal, la tabla completa de transiciones e invariantes sobre datos generados
- `examples/tema18/` — prioridad de consultas de RTL, el error que solo destapa `userEvent` y los cuatro estados de una pantalla
- `examples/tema19/` — lo que cuesta un `as` sobre datos de fuera, MSW en tres minutos y fixtures que salen de una sola fuente
- `src/orders/testing/` — el kit de pruebas de la feature: builders y madres con nombre de negocio, los cinco dobles, fixtures importadas de `server/store.mjs`, MSW, `renderOrders()` y `startBff()`
- `src/orders/infrastructure/order-dto.ts` — `parseOrderDto`: lista blanca y comprobación de tipos en la frontera
- `src/orders/infrastructure/order-mapper.test.ts` — qué hace el cliente cuando el backend envía algo que no esperaba
- `src/orders/infrastructure/http-order-gateway.integration.test.ts` — un caso por código de estado, con red simulada
- `src/orders/infrastructure/order-gateway.contract.test.ts` — el contrato, contra el fake y contra el BFF de verdad
- `scripts/weak-asserts.mjs` — la lista de aserciones que no comprueban nada (`npm run test:weak`)
- `docs/adr/006-estrategia-de-pruebas.md` — decisión de validación y niveles de prueba (proyecto final)
- `prompts/sesion-8.md` — prompts de GitHub Copilot
- `docs/ejercicio-s8.md` — ejercicio de la sesión

Trabaja en una rama propia por sesión: `git checkout -b s8/<tu-nombre>`.

## Entorno
`SESSION_SECRET` firma la cookie de sesión del BFF. En desarrollo hay un valor por defecto; en cualquier otro sitio, se pasa por variable de entorno. Nada que empiece por `VITE_` puede contener un secreto: viaja en el bundle.
