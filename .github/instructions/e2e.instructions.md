---
applyTo: "e2e/**,examples/tema20/**,playwright.config.ts"
---
# Tests E2E con Playwright (Sesión 9)

- Un E2E por **journey crítico** (entrar, aprobar, cancelar), no por regla ni por mensaje de error: eso lo cubren los tests unitarios y de componente. Antes de proponer un E2E, di qué test de nivel inferior no puede detectar ese fallo.
- Importa siempre de `./fixtures` (`test`, `expect`, `rowOf`). Cada test empieza con los datos de partida (`resetData` automática) y entra con `signIn`.
- Localizadores por rol y nombre accesible, acotados a su contexto: `rowOf(page, 'P-1005').getByRole('button', { name: 'Cancelar' })`, `page.getByRole('dialog', { name: 'Cancelar pedido' })`. Nunca CSS por posición (`nth-child`), clases ni XPath. `.first()` / `.nth()` no arreglan un localizador ambiguo: lo esconden.
- Aserciones web-first (`await expect(locator).toHaveText(…)`). Nunca `waitForTimeout`, ni `expect(await locator.textContent())`.
- Para preparar estado que la pantalla no puede crear, usa la fixture `backstage` (API con otra sesión), no `page.evaluate` ni cookies escritas a mano.
- Un test que falla a veces no se arregla con más `retries`: se abre la traza (`npm run e2e:report`) y se busca la condición que falta.
