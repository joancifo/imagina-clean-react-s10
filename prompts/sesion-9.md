# Prompts de la Sesión 9 — GitHub Copilot en Visual Studio Code

Chat: `Ctrl+Alt+I` (Windows/Linux) · `⌃⌘I` (macOS). Usa **Ask** para analizar y **Agent** solo cuando decidas aplicar un cambio.
Regla de hoy: **la IA propone, el pipeline comprueba y una persona decide.** Nada que cambie permisos, secretos o reglas de rama se aplica sin que lo valide alguien con criterio y permisos.

Novedad: dos **agent skills** en `.github/skills/`. Se invocan con `/` en el chat (`/diagnosticar-fallo-ci`, `/revisar-pr`) o Copilot las carga solo cuando la petición encaja con su descripción. Los *prompt files* (`.github/prompts/*.prompt.md`) siguen funcionando en el modo local de Visual Studio Code, pero su documentación recomienda migrarlos a skills.

## P1 · ¿Qué merece un E2E? (Tema 20)
```
#file:docs/adr/006-estrategia-de-pruebas.md #file:e2e/approve-urgent.spec.ts
Lista los journeys de OrderDesk que podrían tener un E2E. Para cada uno:
qué capas cruza, qué test de nivel inferior YA cubre cada parte (con su ruta) y qué fallo
solo detectaría el E2E. Termina con los TRES que propondrías y los que descartarías. No escribas código.
```
Criterio: si propone un E2E por cada mensaje de error o por cada rol, está contando pantallas, no riesgos.

## P2 · Borrador de un journey (Tema 20)
```
#file:e2e/fixtures.ts #file:e2e/approve-urgent.spec.ts #file:src/orders/ui/OrderDetailScreen.tsx
Escribe un borrador de E2E para «cancelar un pedido desde su detalle». Reglas:
- importa de ./fixtures y usa signIn y rowOf;
- localizadores por rol y nombre accesible, acotados a su contexto; ni CSS ni nth-child;
- aserciones web-first; ningún waitForTimeout;
- di qué precondición de datos asumes y por qué es cierta tras resetData.
```
Después: ejecútalo, **rómpelo a mano** (quita el `onNotify` de `OrderDetailScreen.tsx`) y comprueba que se pone en rojo. Si sigue en verde, no protege nada.

## P3 · Leer un pipeline heredado (Tema 21)
```
#file:examples/tema21/ci-heredado.yml #file:package.json
Analiza este workflow de GitHub Actions. Para cada problema: línea, riesgo concreto
(seguridad, falso verde, coste, reproducibilidad) y el cambio mínimo.
Ordénalos por riesgo. No reescribas el archivo entero.
```
Criterio: si no menciona el título del PR dentro de `run:`, el `|| true` y el `continue-on-error`, no ha entendido qué protege un pipeline.

## P4 · Diagnosticar un fallo (Tema 21)
```
/diagnosticar-fallo-ci #file:examples/tema21/logs/03-e2e.log
```
Antes de leer la respuesta, escribe tu diagnóstico en una línea. Compara. Si la propuesta incluye subir `retries`, `.first()` o un `waitForTimeout`, es una propuesta que esconde el fallo.

## P5 · Borrador de ADR (Tema 22)
```
#file:docs/adr/README.md #file:playwright.config.ts #file:.github/workflows/ci.yml #file:server/e2e.mjs
Redacta un borrador de ADR-007 con la plantilla del README. Cada afirmación del Contexto
debe citar ruta:línea o un comando. Incluye la tabla de opciones para el aislamiento de datos
de los E2E y una sección «Cuándo revisarla» con una señal medible.
```
Después: comprueba **cada** cita contra el código. Un ADR con una cita falsa es peor que no tener ADR.

## P6 · Revisión del PR #142 (Tema 22)
```
/revisar-pr revisa los cambios de esta rama (aplicado examples/tema22/pr-142.patch)
```
Compara con lo que han encontrado `npm run lint:arch`, `npm run audit:secrets` y `npm run test:weak`, y con tu propia revisión.

## Criterio de revisión de las respuestas
1. ¿Propone silenciar un control (`continue-on-error`, `|| true`, `.skip`, más `retries`) para volver a verde?
2. ¿Toca permisos, secretos o reglas de rama sin decir que eso lo decide una persona?
3. ¿El E2E que genera busca por CSS, posición o `data-testid` por costumbre? ¿Usa `waitForTimeout`?
4. ¿Propone un E2E para algo que ya detecta un test unitario o de componente?
5. ¿Cita `ruta:línea` o habla en general? Sin cita, es una hipótesis.
6. ¿El ADR o la documentación que redacta describe el sistema real o uno parecido?
