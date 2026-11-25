# Ejercicio Sesión 9 · El journey, el pipeline y lo que los protege

**Duración:** 45 minutos (18:45 – 19:30) · **Corrección:** 15 minutos (19:30 – 19:45)
**Avance del proyecto final:** el primer E2E crítico de la feature, un pipeline que no puede ponerse en verde por error y una revisión de código con criterio.

> Hoy el ejercicio es **más guiado** que en las sesiones anteriores: tres partes de 15 minutos, cada una con su esqueleto ya escrito y los huecos o las preguntas señalados. Todo lo que tienes que hacer está descrito paso a paso. Si te atascas más de 3 minutos en un paso, mira la pista de ese paso: está para usarla.

```bash
git checkout -b s9/<tu-nombre>
npm install
npx playwright install chromium   # UNA vez · ~150 MB · hazlo en la pausa
npm test                          # 625 en verde y 11 omitidos (skipped): los de la Parte B
npm run test:e2e                  # 2 en verde y 2 omitidos (fixme): los de la Parte A
```

## Contexto
La Sesión 8 cerró con 623 tests en verde. Ninguno abre un navegador: nadie comprueba que pantalla, caso de uso, adapter, proxy, BFF y cookie de sesión funcionan **enchufados**. Y el pipeline del repositorio lleva meses en verde con `npm test || true`: aunque fallaran los 623, seguiría en verde.

```
Parte A (15 min)              Parte B (15 min)              Parte C (15 min)
El journey de cancelar   ──▶  El pipeline que no miente ──▶  El PR #142, en tres capas
e2e/cancel-order.spec.ts      .github/workflows/ci.yml       examples/tema22/
6 pasos · 2 tests             5 huecos · 11 tests            3 capas · 8 preguntas guía
```

**Ya está escrito** (léelo antes de empezar, 3 minutos):
| Archivo | Qué te da |
|---|---|
| `e2e/fixtures.ts` | `test` y `expect` con tres fixtures: `resetData` (automática: datos de partida en cada test), `signIn('Pau (manager)')` y `backstage.cancel('P-1005')` (otra persona cancelando por la API). Y `rowOf(page, 'P-1005')`: la fila de un pedido |
| `e2e/approve-urgent.spec.ts` | **El modelo.** Un journey completo: actuar dentro de la fila, buscar dentro del diálogo, aserciones web-first |
| `examples/tema21/ci-esqueleto.yml` | El pipeline nuevo, con cinco huecos marcados `HUECO` |
| `scripts/pipeline.test.mjs` | La especificación de la Parte B: 11 tests omitidos |
| `examples/tema22/` | El PR #142 (`pr-142.patch` y su descripción `pr-142.md`) y la plantilla de revisión `mi-revision.md` |

## Parte A · El journey de cancelar (15 min · 18:45 – 19:00)
Archivo: `e2e/cancel-order.spec.ts`. Tests: 2, marcados `test.fixme`.

1. Cambia los dos `test.fixme(` por `test(`.
2. Rellena los pasos 1 a 6 que hay como comentarios dentro de cada test. Cada comentario dice **qué** hacer y la pista dice **con qué**.
3. Ejecuta solo este archivo:
   ```bash
   npx playwright test e2e/cancel-order.spec.ts          # en la terminal
   npx playwright test e2e/cancel-order.spec.ts --ui     # con la interfaz: ves cada paso en el navegador
   ```
4. **Rómpelo a propósito.** En `src/orders/ui/OrdersListPage.tsx`, dentro de `handleCancel`, comenta `reload();`. Vuelve a ejecutar: el primer test **tiene que ponerse en rojo**. Si sigue en verde, no protege nada. Deshaz el cambio.

### Pautas de la Parte A
| Paso | Qué | Pista |
|---|---|---|
| 1 | Pulsa «Cancelar» **dentro de la fila** | `await row.getByRole('button', { name: 'Cancelar' }).click();` |
| 2 | Busca el diálogo por su nombre, escribe el motivo y confirma | `const dialog = page.getByRole('dialog', { name: 'Cancelar pedido' });` · `dialog.getByRole('textbox', { name: 'Motivo' }).fill('Cliente duplicado en el ERP')` · `dialog.getByRole('button', { name: 'Confirmar' }).click()` |
| 3 | Comprueba lo que ve la persona | El aviso: `page.getByRole('status')` con `toHaveText('Pedido cancelado')` · el diálogo: `toBeHidden()` · la fila: `toContainText('Cancelado')` · el botón de la fila: `toHaveCount(0)` |
| 4 | Recarga y comprueba que sigue cancelado | `await page.reload();` y **vuelve a pedir la fila** con `rowOf(page, 'P-1005')` |
| 5 | (2.º test) Otra persona cancela el pedido mientras Pau lo mira | `await backstage.cancel('P-1005');` · después, los pasos 1 y 2 otra vez |
| 6 | (2.º test) El diálogo explica el fallo y no hay aviso de éxito | `dialog.getByRole('alert')` con `toHaveText('Este pedido ya está cerrado y no se puede cancelar')` · `page.getByRole('status')` con `toHaveCount(0)` |

**Trampas que hacen fallar un test** (todas están en el log `examples/tema21/logs/03-e2e.log`, que verás en el Tema 21):
- `page.getByRole('button', { name: 'Cancelar' })` sin acotar a la fila: hay **dos** «Cancelar» y Playwright se niega a elegir (*strict mode violation*). La salida no es `.first()`: es `row.getByRole(…)`.
- `page.getByRole('button', { name: 'Confirmar' })` fuera del diálogo funciona hoy… hasta que alguien abre otro diálogo. Búscalo **dentro** de `dialog`.
- `expect(await row.textContent()).toContain('Cancelado')` lee el texto **una vez**, antes de que llegue la respuesta del servidor. Usa `await expect(row).toContainText('Cancelado')`: reintenta hasta 5 s.
- Comprobar el aviso **después** de recargar: el aviso dura 3 segundos y la recarga lo borra. Compruébalo antes.
- `page.waitForTimeout(…)`: si lo necesitas, te falta una aserción web-first.

> Lo que este ejercicio **no** hace, a propósito: un E2E para «el motivo es demasiado corto». Esa regla ya la prueban `cancellation-reason.test.ts` y `CancelDialog.test.tsx` en milisegundos. Un E2E por mensaje de error es una suite lenta que nadie quiere ejecutar.

## Parte B · El pipeline que no miente (15 min · 19:00 – 19:15)
Archivos: `.github/workflows/ci.yml` (el heredado) y `examples/tema21/ci-esqueleto.yml` (el nuevo, con huecos). Tests: `scripts/pipeline.test.mjs` (11).

1. Quita el `.skip` de los cuatro `describe.skip` de `scripts/pipeline.test.mjs` y ejecuta `npm run test:pipeline`: **11 en rojo** contra el pipeline heredado. Léelos: cada nombre es un hallazgo del Tema 21.
2. Copia el esqueleto encima del heredado: `cp examples/tema21/ci-esqueleto.yml .github/workflows/ci.yml`. Vuelve a ejecutar: **5 en rojo**, uno por hueco.
3. Rellena los cinco `HUECO` con las pautas de abajo, de uno en uno, ejecutando `npm run test:pipeline` después de cada uno.
4. `npm run test:pipeline && npm test` → verde.

### Pautas de la Parte B
Respeta la indentación: en YAML, dos espacios de más o de menos cambian el significado. La extensión **GitHub Actions** de Visual Studio Code marca los errores mientras escribes.

**HUECO 1 · permisos** (a la altura de `on:` y `concurrency:`, sin sangría)
```yaml
permissions:
  contents: read
```

**HUECO 2 · el título del PR, por variable de entorno** (sustituye el comentario; misma sangría que `if:`)
```yaml
        env:
          PR_TITLE: ${{ github.event.pull_request.title }}
        run: echo "Revisando $PR_TITLE"
```
Ojo: `run: echo "Revisando: $PR_TITLE"` (con dos puntos) **rompe el YAML**: `: ` dentro de un texto sin comillas abre un mapa. Deja el texto sin dos puntos o pon todo el comando entre comillas simples.

**HUECO 3 · los siete controles** (un `- run:` por línea, debajo de `npm ci`)
```yaml
      - run: npm run lint:arch
      - run: npm run lint:boundaries
      - run: npm run typecheck
      - run: npm test
      - run: npm run audit:secrets
      - run: npm run build
      - run: npm run perf:budget
```

**HUECO 4a · los E2E esperan a calidad** (debajo de `name:` del job `e2e`)
```yaml
    needs: quality
```

**HUECO 4b · solo Chromium, con sus dependencias del sistema** (antes de `npm run test:e2e`)
```yaml
      - run: npx playwright install --with-deps chromium
```

**HUECO 5 · el informe, aunque fallen** (dentro de `upload-artifact`, a la altura de `with:`)
```yaml
        if: ${{ !cancelled() }}
```
`always()` también lo sube cuando alguien **cancela** la ejecución; `failure()` no lo sube cuando todo pasa (y a veces quieres ver un *flaky*). `!cancelled()` es lo que recomienda la documentación de Playwright.

**Trampas que hacen fallar un test:** `npm run test` en vez de `npm test` (el test acepta las dos formas, pero no `npm run test -- --run`); juntar varios controles en un solo `run:` con `&&` (funciona, pero el log ya no dice cuál ha fallado y el test exige un paso por control); poner `permissions:` dentro de un job en vez de arriba; `needs: [quality]` funciona en GitHub, pero el test espera la forma corta `needs: quality`.

## Parte C · El PR #142, revisado en tres capas (15 min · 19:15 – 19:30)
Archivos: `examples/tema22/pr-142.patch`, `pr-142.md` (la descripción del PR) y `mi-revision.md` (tu entrega). Guía: `docs/checklist-pr.md` y `docs/revision-de-codigo.md`.

Un PR de verdad: añade «Exportar CSV» a la lista de pedidos. Compila, sus tests pasan y trae un E2E en verde. Tu trabajo es decidir si entra.

1. **Prepárala (2 min).** Guarda antes lo de las partes A y B:
   ```bash
   git add -A && git commit -m "S9: partes A y B"
   git apply examples/tema22/pr-142.patch       # sobre tu rama, sin commit
   npm test                     # en verde: eso no quiere decir nada todavía
   ```
2. **Capa 1 · Herramientas (3 min).** Ejecuta y apunta en `mi-revision.md` qué encuentra cada una:
   ```bash
   npm run lint:arch && npm run audit:secrets && npm run test:weak
   ```
3. **Capa 2 · Copilot (3 min).** En el chat: `/revisar-pr revisa los cambios de esta rama`. Apunta sus comentarios y marca los que te parezcan falsos o irrelevantes.
4. **Capa 3 · Tú (6 min).** Responde las preguntas guía de abajo. Cada respuesta que sea un problema, escríbela como Conventional Comment (formato en `mi-revision.md`).
5. **Veredicto (1 min).** ¿Aprobarías, pedirías cambios o lo hablarías antes en persona? Una frase, con el motivo.
6. Guarda **solo** tu revisión y descarta el parche:
   ```bash
   git add examples/tema22/mi-revision.md && git commit -m "S9: revisión del PR #142"
   git restore . && git clean -fd     # quita los cambios y los archivos nuevos del PR
   npm test                           # vuelves a tus 636 en verde
   ```

### Pautas de la Parte C · Preguntas guía
Cada pregunta apunta a un archivo y a un bloque de `docs/checklist-pr.md`. No todas esconden un problema… pero casi todas.

| # | Dónde mirar | Pregunta |
|---|---|---|
| 1 | `pr-142.md` | ¿Dice por qué, qué datos salen en el CSV y cómo se ha comprobado? |
| 2 | `ExportButton.tsx`, la línea del `if` | ¿Quién decide qué roles pueden exportar? ¿Dónde vive esa regla en el resto de la feature? (Presentación y estado) |
| 3 | `ExportButton.tsx`, el `fetch` | ¿Por dónde llegan los datos a la pantalla en el resto de Pedidos? (Casos de uso y composición) |
| 4 | `ExportButton.tsx`, la línea del `as` | ¿Qué pasa si el backend envía algo distinto? ¿Qué nombres de campo llegan a la UI? (Sesión 8) |
| 5 | `ExportButton.tsx`, el `console.log` | ¿Qué datos salen y adónde van? (Rendimiento, observabilidad y refactor) |
| 6 | `ExportButton.tsx`, `setBusy` | ¿Qué ve la persona si la petición falla? Recorre el código con un error de red |
| 7 | `e2e/export.spec.ts` | Repasa los localizadores y las esperas con el Tema 20. Y antes: ¿exportar un CSV es un journey crítico? |
| 8 | `export-csv.ts` y su test | ¿Hay algo que merezca un `praise`? |

**Trampas de revisión:** dar por bueno el PR porque «el pipeline está en verde» (las herramientas solo ven 3 de los problemas); comentar sin `ruta:línea`; mezclar estilo con riesgo (un `nitpick` nunca es bloqueante); aceptar un comentario de Copilot sin comprobarlo en el código; olvidar decir lo que está bien.

## Si te sobra tiempo
- Ejecuta `npm run test:e2e:smoke`: solo el test etiquetado `@smoke`. ¿Cuál de tus dos tests de la Parte A etiquetarías también, y por qué?
- Si tienes actionlint instalado: `actionlint .github/workflows/ci.yml` sobre el heredado y sobre el tuyo.
- Empieza el ADR-007 (`docs/adr/007-e2e-y-ci.md`): es el hito del proyecto final de hoy.
