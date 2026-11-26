# AGENTS.md · OrderDesk

Instrucciones para cualquier agente de código que trabaje en este repositorio (GitHub Copilot en modo agente, Codex, Claude y otros).
El detalle de arquitectura está en `.github/copilot-instructions.md` y en `.github/instructions/*.instructions.md`; este archivo no lo repite ni lo contradice.

## Qué es
Backoffice de pedidos B2B ficticio, material del curso de Clean Architecture para Frontend con React y Node (Imagina · Joan Cifo).
Tiene **code smells sembrados a propósito** en el código heredado (`src/pages`, `src/services`, `src/shared`, `src/store`, `src/components`).

## Comandos
| Para | Comando |
|---|---|
| Instalar | `npm ci` |
| Arrancar | `npm run dev` (web 5173 · BFF 3001) |
| Todo lo que comprueba el pipeline | `npm run lint:arch && npm run lint:boundaries && npm run typecheck && npm test && npm run audit:secrets && npm run build && npm run perf:budget` |
| Red de caracterización de Devoluciones | `npm run lab:red` |
| Reglas de Devoluciones | `npm run lab:rules` |
| Comprobación rápida del laboratorio | `npm run lab:check` |

## Mapa
- `src/orders/` · feature Pedidos, por capas: `domain` → `application` → `infrastructure` / `ui`, conectadas en `composition.ts`. API pública: `src/orders/index.ts`.
- `src/returns/` · feature Devoluciones (Sesión 10), en construcción. API pública: `src/returns/index.ts`.
- `src/pages/ReturnsPage.tsx` · Devoluciones HEREDADA: el código del laboratorio.
- `server/bff.mjs` · el BFF: sesión, autorización real y recorte de datos. `server/returns-legacy.mjs` · API heredada de devoluciones y del transportista.
- `shared/policy.json` · los números del negocio, compartidos por el dominio y el BFF.
- `docs/adr/` · decisiones de arquitectura. Un cambio de arquitectura sin ADR no está terminado.

## Cómo trabajar con código heredado
1. **Mapa antes que cambios.** Primero analiza y cita evidencia como `ruta:línea`. Separa hechos de hipótesis.
2. **Red antes que refactor.** No modifiques código de `src/pages` sin tests de caracterización que fijen su comportamiento actual, rarezas incluidas.
3. **Pasos pequeños.** Un paso = un PR revisable, con la red en verde antes y después. Nada de reescrituras completas.
4. **Un refactor no cambia comportamiento.** Si algo parece un error, no lo arregles en el mismo paso: anótalo como pregunta en `docs/devoluciones/plan.md`.
5. **Las decisiones son de una persona.** Propón; no apruebes PRs ni cambies permisos, secretos, workflows o reglas de rama.

## Nunca
- Enviar desde el navegador la identidad, el rol o un importe que el servidor deba calcular.
- Usar `as` sobre datos que llegan de fuera, `dangerouslySetInnerHTML`, secretos en variables `VITE_` o sesión en `localStorage`.
- Silenciar un control para volver a verde (`|| true`, `continue-on-error`, `.skip`, más `retries`).
- Escribir datos personales (nombres de cliente, motivos, notas) en logs, consola o analítica.
