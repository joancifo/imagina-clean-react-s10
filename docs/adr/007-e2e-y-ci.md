# ADR-007 · E2E de los journeys críticos y pipeline de CI de OrderDesk

- **Estado:** aceptado (versión de referencia del profesor)
- **Fecha:** 26/11/2026
- **Autoría:** Joan Cifo

## Contexto
- Al terminar la Sesión 8, OrderDesk tenía 623 tests: dominio, casos de uso, componentes, adapters con red simulada y el contrato contra el BFF. **Ninguno abría un navegador.** Ningún test comprobaba que pantalla, caso de uso, adapter HTTP, proxy de Vite, BFF y sesión en cookie funcionan **enchufados**.
- El pipeline heredado (`examples/tema21/ci-heredado.yml`) llevaba meses en verde, y no podía ponerse en rojo por los tests: `npm test || true`. La regla de capas tenía `continue-on-error: true`. `lint:boundaries`, `audit:secrets` y `perf:budget` no se ejecutaban.
- El mismo pipeline pegaba el título del PR dentro de un script (`${{ github.event.pull_request.title }}` en un `run:`), usaba Node 18 frente al 24 del equipo, instalaba con `npm install` y no declaraba permisos ni tiempo máximo.
- El BFF guarda los pedidos en memoria: cualquier test que cancele un pedido cambia el punto de partida del siguiente.

## Decisión 1 · Qué merece un E2E
Un E2E por **journey crítico**, no por regla. Hoy son tres:

| Journey | Archivo | Qué capas cruza que ningún otro test cruza |
|---|---|---|
| Entrar y ver la lista (smoke) | `e2e/smoke.spec.ts` | Arranque, sesión en cookie, proxy, BFF |
| Aprobar un pedido urgente | `e2e/approve-urgent.spec.ts` | Diálogo con formulario → caso de uso → BFF → navegación al detalle |
| Cancelar un pedido (y el conflicto con otra sesión) | `e2e/cancel-order.spec.ts` | Diálogo → caso de uso → BFF → recarga desde el servidor; dos sesiones a la vez |

**Lo que NO se prueba con E2E:** mensajes de validación de formularios, permisos por rol, recorte de datos para un agente, cada código de estado HTTP. Ya lo cubren `approval-form.test.ts`, `ApproveDialog.test.tsx`, `server/bff.test.mjs` y `http-order-gateway.integration.test.ts` en milisegundos. Repetirlo en E2E multiplica el tiempo y los puntos de fallo sin añadir detección.

## Decisión 2 · Cómo se escriben
- Localizadores por rol y nombre accesible, acotados a su contexto (`rowOf(page, id)`, el diálogo por su nombre). Ni CSS por posición ni `data-testid` por costumbre.
- Aserciones web-first. Ningún `waitForTimeout`.
- Fixtures compartidas en `e2e/fixtures.ts`: `resetData` (automática), `signIn` y `backstage`.

## Decisión 3 · Datos y aislamiento

| Opción | A favor | En contra |
|---|---|---|
| 1. Sin reinicio; tests que no se pisan | Nada que mantener en el servidor | El resultado depende del orden; el día que alguien añade un test, se rompe otro |
| 2. **Reinicio por test (`POST /api/testing/reset`) y un solo worker** | Cada test empieza igual; simple | El lote no se paraleliza; un endpoint que solo existe en pruebas |
| 3. Un BFF por worker (puerto por worker) | Paralelo y aislado | Arranque más complejo; hoy, para cuatro tests, no compensa |

Se elige la 2. El endpoint solo existe con `createBff({ testing: true })`, que solo usa `server/e2e.mjs`; `server/e2e.mjs` se niega a arrancar con `NODE_ENV=production`, y `server/bff.test.mjs` comprueba que el BFF normal responde 404. **Revisar** cuando el lote supere los 2 minutos: entonces compensa la 3.

## Decisión 4 · El pipeline
`.github/workflows/ci.yml`, especificado por `scripts/pipeline.test.mjs` (`npm run test:pipeline`):
- Se ejecuta en PR y push a `main`. Un push nuevo a un PR cancela la ejecución anterior.
- `permissions: contents: read`. Ningún dato del evento dentro de un `run:` (entra por `env:`).
- Job `quality`: `npm ci` con Node de `.nvmrc` → `lint:arch` → `lint:boundaries` → `typecheck` → `test` → `audit:secrets` → `build` → `perf:budget`. Ningún paso puede fallar en silencio.
- Job `e2e`: depende de `quality`; instala solo Chromium; en CI prueba el **build** (`vite preview`), no el servidor de desarrollo; dos reintentos con traza en el primero; sube `playwright-report` salvo cancelación.

Los reintentos son para **capturar la traza**, no para esconder el fallo: un test que pasa al segundo intento aparece como *flaky* y se revisa como un fallo.

## Consecuencias
- Un PR ya no se puede fusionar con la arquitectura rota, un secreto en `src/`, el presupuesto superado o un journey roto, **si** `quality` y `e2e` se marcan como checks obligatorios en la regla de la rama `main` (configuración del repositorio, la hace una persona con permisos de administración).
- El pipeline tarda más que el heredado: es el precio de que el verde signifique algo.
- Las acciones se referencian por etiqueta mayor (`@v6`). GitHub recomienda fijarlas por SHA completo; queda como mejora con Dependabot para mantenerlas.

## Cuándo revisarla
- El lote E2E supera 2 minutos → Opción 3 de la Decisión 3.
- Un E2E aparece como *flaky* dos veces en una semana → se investiga su traza antes de añadir ninguno más.
- Aparece un journey nuevo que cruza una capa sin cubrir (por ejemplo, el panel con datos en directo).
