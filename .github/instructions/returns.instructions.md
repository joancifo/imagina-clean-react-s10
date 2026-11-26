---
applyTo: "src/pages/ReturnsPage.tsx,src/pages/returns*,src/returns/**,server/returns*.mjs,docs/devoluciones/**"
---
# Devoluciones (Sesión 10)

Contexto: `src/pages/ReturnsPage.tsx` es código HEREDADO que se está migrando a la feature `src/returns/` siguiendo `docs/devoluciones/plan.md`.

## Mientras sea heredado
- Su comportamiento lo fija `src/pages/returns.characterization.test.tsx`. Cualquier cambio en `ReturnsPage.tsx` deja esa red en verde (`npm run lab:red`).
- Las rarezas marcadas con `RAREZA ·` en los tests son comportamiento ACTUAL: se conservan hasta que una persona decida cambiarlas (pregunta en `plan.md`).
- Si un cambio de comportamiento se decide, se declara en el test con `{ heredada, nueva }` y en el PR.

## Destino (`src/returns/`)
- Mismas capas y reglas que `src/orders` (ver `orders-core.instructions.md` y `orders-edges.instructions.md`).
- Reglas como funciones puras en `src/returns/domain/`: sin React, sin fetch y sin `Date.now()`; la fecha llega por parámetro.
- Los números del negocio (plazo, reposición, límite del manager) salen de `shared/policy.json`, como los de Pedidos.
- Los nombres del transportista (`trk_no`, `sts_cd`, `dlv_ts`) y de la API heredada (`rsn_cd`, `rfd_amt`) solo aparecen en el adapter de `src/returns/infrastructure/`.
- El importe del reembolso y la autorización los decide el servidor (BFF). El cliente envía qué se devuelve y por qué; nunca el importe ni el rol.
- Desde fuera de `src/returns`, solo `import { … } from '../returns'` (`npm run lint:boundaries`).
