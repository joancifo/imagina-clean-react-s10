# Prompts de la Sesión 10 · GitHub Copilot en Visual Studio Code

Chat: `Ctrl+Alt+I` (Windows/Linux) · `⌃⌘I` (macOS). **Ask** para analizar, **Agent** solo cuando decidas aplicar un cambio.
Regla de hoy: **la IA acelera el mapa, la red y el plan; la persona decide cada paso y revisa cada diff.**

Novedades del repositorio para trabajar con código heredado:
- `AGENTS.md` en la raíz: instrucciones para cualquier agente (Copilot, Codex, Claude). Convive con `.github/copilot-instructions.md`; no se contradicen.
- `.github/instructions/returns.instructions.md`: se aplica sola a los archivos de Devoluciones (`applyTo`).
- Tres skills en `.github/skills/`: `/mapear-modulo`, `/caracterizar` y `/planificar-refactor`.

Comprueba qué instrucciones ha usado Copilot en cada respuesta: despliega **Referencias** (*References*) bajo la respuesta.

## P0 · ¿Qué instrucciones tiene este repositorio? (2 min, antes de empezar)
```
¿Qué archivos de instrucciones y qué skills de este repositorio se aplican si trabajo en src/pages/ReturnsPage.tsx?
Para cada uno: ruta, cuándo se carga y la regla más importante que impone. No modifiques nada.
```
Criterio: tiene que nombrar `AGENTS.md` o `copilot-instructions.md`, `returns.instructions.md` y las skills. Si no aparece `returns.instructions.md`, revisa su `applyTo`.

## P1 · Fase 1 · El mapa
```
/mapear-modulo #file:src/pages/ReturnsPage.tsx
Rellena las secciones 1 a 4 de #file:docs/devoluciones/mapa.md. Evidencia ruta:línea en cada fila.
```
Después, en la terminal: `npm run rules`, `npm run state`, `npm run map`. Compara.
Criterio: si una fila no tiene `ruta:línea` o la línea no dice lo que afirma, no entra. Apunta en la sección 5 lo que no era cierto.

## P2 · Fase 2 · Los casos que faltan
```
/caracterizar #file:src/pages/ReturnsPage.tsx #file:src/pages/returns-harness.tsx #file:src/pages/returns.characterization.test.tsx
Lista los casos que faltan, uno por rama de decisión y uno por frontera, con la ruta:línea de la rama que cubre cada uno.
No escribas código todavía.
```
```
Escribe el test T3 (ventana de 30 días, dos tests: 09:59 y 10:01 UTC del 12/12) con el arnés existente.
Si no puedes ejecutarlo, deja '???' como valor esperado.
```
Criterio: el valor esperado lo da la **ejecución**, no Copilot. Si Copilot «corrige» una rareza en el valor esperado, el test está mal aunque parezca razonable.

## P3 · Fase 3 · El plan
```
/planificar-refactor #file:docs/devoluciones/mapa.md #file:src/pages/returns.characterization.test.tsx
Propón un plan de 5 a 7 pasos para docs/devoluciones/plan.md. Incluye la parte de servidor:
hoy el cliente envía el importe y el rol (#file:server/returns-legacy.mjs).
```
```
Para el paso 2 de tu plan: ¿qué archivo exacto se crea, qué líneas de ReturnsPage.tsx se sustituyen y qué comando demuestra que no ha cambiado nada?
```
Criterio: descarta y anota en «Lo que la IA propuso y he descartado» cualquier paso que reescriba la pantalla entera, añada una librería o un patrón sin problema concreto, o cambie comportamiento sin decirlo.

## P4 · Fase 4 · El primer paso (modo Agent)
```
#file:src/returns/domain/return-rules.ts #file:src/pages/ReturnsPage.tsx
Rellena los HUECOS 1 a 4 de return-rules.ts copiando las reglas de ReturnsPage.tsx TAL CUAL, rarezas incluidas.
No cambies ReturnsPage.tsx todavía. Al terminar, ejecuta npm run lab:rules.
```
Revisa el diff antes de aceptar. Después, en un segundo paso:
```
Sustituye en ReturnsPage.tsx el cálculo del reembolso, la ventana de 30 días, las unidades restantes y la condición de la nota
por las funciones de '../returns'. No cambies nada más. Ejecuta npm run lab:check.
```
Criterio: `npm run lab:check` en verde. Si Copilot «mejora» algo (`>=` en lugar de `>`, la reposición sobre el precio con descuento, un `Math.round` de menos), la red se pondrá en rojo: es exactamente para lo que está.

## Lo que la IA suele hacer mal con código heredado
| Señal | Por qué es un problema | Qué haces |
|---|---|---|
| «He corregido el cálculo de la reposición» | Un refactor ha cambiado comportamiento sin decisión | Revertir ese hunk; pregunta en `plan.md` |
| Un test con el valor «correcto» en lugar del observado | La red deja de describir el sistema real | Ejecutar y copiar el valor real |
| Un `ReturnsRepository`, un `ReturnsService` y un `ReturnsFacade` para una pantalla | Abstracciones sin problema (guía, sección 2) | Pedir el paso más pequeño |
| `import … from '../returns/domain/return-rules'` desde `src/pages` | Se salta la API pública | `npm run lint:boundaries` |
| Un `vi.mock('../shared/utils')` para aislar la pantalla | El repositorio no usa `vi.mock` en código nuevo | Usar el arnés |
| Pegar en el chat datos reales de clientes para «probar mejor» | Datos personales fuera de su sitio | Solo datos ficticios del arnés |
