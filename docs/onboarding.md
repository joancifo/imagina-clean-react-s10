# Onboarding · tu primer día en OrderDesk

Objetivo: que en una mañana puedas arrancar la aplicación, ejecutar todos los controles y saber **dónde va cada cosa y por qué**. Si algo de esta página no es verdad, arreglarla es tu primer PR.

## 1 · Arrancar (15 min)
```bash
nvm use                 # Node de .nvmrc
npm ci
npm run dev             # web http://localhost:5173 · BFF http://localhost:3001
```
Entra con los botones de la barra: Marta (admin), Pau (manager) o Iris (agente). No hay contraseñas: es un entorno de formación.

## 2 · Comprobar que todo está en verde (15 min)
Lo mismo que ejecuta el pipeline (`.github/workflows/ci.yml`), en el mismo orden:
```bash
npm run lint:arch && npm run lint:boundaries && npm run typecheck
npm test
npm run audit:secrets && npm run build && npm run perf:budget
npx playwright install chromium && npm run test:e2e
```

## 3 · Dónde va cada cosa (30 min)
| Si vas a… | Va en | Lee antes |
|---|---|---|
| Añadir una regla de negocio | `src/orders/domain/` | ADR-001 |
| Añadir una acción de usuario | `src/orders/application/` + puerto en `ports.ts` | ADR-002 |
| Hablar con el backend | `src/orders/infrastructure/` (y parsear en `order-dto.ts`) | ADR-002, ADR-006 |
| Cambiar una pantalla | `src/orders/ui/` (contenedor, view model, componentes) | ADR-003 |
| Tocar el BFF, la sesión o los permisos | `server/bff.mjs`, `shared/policy.json` | ADR-004 |
| Tocar una pantalla heredada (`src/pages`) | Primero, tests de caracterización | ADR-005 |
| Escribir tests | `src/orders/testing/` (kit) · `e2e/` solo para journeys | ADR-006, ADR-007 |
| Cambiar el pipeline | `.github/workflows/ci.yml` + `scripts/pipeline.test.mjs` | ADR-007 |

Mapa de capas y reglas de dependencia: `docs/arquitectura-objetivo.md`.

## 4 · Tu primer PR (el resto del día)
- Rama propia, PR pequeño, plantilla completa (`.github/pull_request_template.md`).
- Si la decisión es cara de revertir o alguien la cuestionará en seis meses: ADR en el mismo PR (`docs/adr/README.md`).
- Copilot revisa primero; una persona decide. Criterios en `docs/revision-de-codigo.md`.

## Excepciones aceptadas a la arquitectura
Lo que parece un error y no lo es (o todavía no se ha arreglado, y se sabe):
| Excepción | Dónde | Por qué | Hasta cuándo |
|---|---|---|---|
| Código heredado con smells | `src/pages`, `src/services`, `src/shared`, `src/store`, `src/hooks`, `src/components` | Material de formación; se migra por pasos | Migración de cada pantalla (ADR-005) |
| Un endpoint de reinicio de datos | `POST /api/testing/reset`, solo con `server/e2e.mjs` | Aislar los E2E | ADR-007, Decisión 3 |
| Los E2E en un solo worker | `playwright.config.ts` | Un BFF con datos en memoria compartido | Cuando el lote pase de 2 minutos |
