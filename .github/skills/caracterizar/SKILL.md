---
name: caracterizar
description: Propone y escribe tests de caracterización para código heredado de OrderDesk que fijan su comportamiento ACTUAL, rarezas incluidas, antes de refactorizar. Úsala cuando pidan tests de caracterización, golden master, una red de seguridad o casos para src/pages/returns.characterization.test.tsx.
---
# Tests de caracterización

Un test de caracterización no dice cómo DEBERÍA comportarse el código: fija cómo se comporta HOY (M. Feathers, «Working Effectively with Legacy Code», cap. 13).

## Pasos
1. Lee el código y el arnés (`src/pages/returns-harness.tsx`). Usa sus datos (`STANDARD`, `GOLD`, `SILVER`, `IN_TRANSIT`, `ADMIN`, `AGENT`), `legacyBackend()`, `openReturns()` y `atDate()`. No crees datos ni dobles nuevos si el arnés ya los tiene.
2. Propón primero una **lista** de casos: uno por cada rama de decisión (`if`, ternario, `&&` en JSX) y uno por cada frontera (justo antes y justo después de un umbral o de una fecha). Indica `ruta:línea` de la rama que cubre cada caso.
3. Escribe los tests con el **valor observado**, no con el que te parezca correcto. Si no puedes ejecutarlos, deja el valor esperado como `'???'` y dilo: la persona lo ejecuta y copia el real.
4. Si un valor observado parece un error, NO lo corrijas: añade encima un comentario `// RAREZA · …` y una pregunta para `docs/devoluciones/plan.md`.

## Estilo (el del repositorio)
- Consultas por rol y nombre accesible (`getByRole('spinbutton')`, `getByRole('combobox', { name: /Motivo/ })`), `userEvent`, aserciones exactas (`toBe`, `toEqual`, `toHaveTextContent`).
- Nada de `vi.mock` de módulos, snapshots completos, clases CSS ni `waitForTimeout`.
- Nombre del test = comportamiento con su valor: «defectuoso: sin gastos de reposición, 169,40 €».

## Límites
- No modifiques el código de producción. Solo el archivo de tests.
- Si un caso no se puede montar con el arnés, explica qué le falta en lugar de inventarlo.
