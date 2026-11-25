# Solución Sesión 9 · Guía del profesor

Rama `solucion-s9`. Verificado: `npm test` 636 en verde (625 + los 11 del pipeline), `npm run test:e2e` 4 en verde, `npm run demo:tema20` 6 en verde (uno es un fallo esperado, marcado con `test.fail`), `typecheck`, `lint:arch`, `lint:boundaries`, `audit:secrets`, `build` y `perf:budget` (65,3 kB, DENTRO).

## Parte A · `e2e/cancel-order.spec.ts`
```ts
test('un manager cancela un pedido pendiente y la cancelación sobrevive a recargar la página', async ({ page, signIn }) => {
  await signIn('Pau (manager)');
  const row = rowOf(page, 'P-1005');

  await row.getByRole('button', { name: 'Cancelar' }).click();                         // 1
  const dialog = page.getByRole('dialog', { name: 'Cancelar pedido' });                 // 2
  await dialog.getByRole('textbox', { name: 'Motivo' }).fill('Cliente duplicado en el ERP');
  await dialog.getByRole('button', { name: 'Confirmar' }).click();

  await expect(page.getByRole('status')).toHaveText('Pedido cancelado');                // 3
  await expect(dialog).toBeHidden();
  await expect(row).toContainText('Cancelado');
  await expect(row.getByRole('button', { name: 'Cancelar' })).toHaveCount(0);

  await page.reload();                                                                  // 4
  await expect(rowOf(page, 'P-1005')).toContainText('Cancelado');
});

test('si otra persona lo cancela mientras lo miras, el diálogo lo explica y no finge el éxito', async ({ page, signIn, backstage }) => {
  await signIn('Pau (manager)');
  const row = rowOf(page, 'P-1005');
  await expect(row).toContainText('Pendiente');

  await backstage.cancel('P-1005');                                                     // 5
  await row.getByRole('button', { name: 'Cancelar' }).click();
  const dialog = page.getByRole('dialog', { name: 'Cancelar pedido' });
  await dialog.getByRole('textbox', { name: 'Motivo' }).fill('Cliente duplicado en el ERP');
  await dialog.getByRole('button', { name: 'Confirmar' }).click();

  await expect(dialog.getByRole('alert')).toHaveText('Este pedido ya está cerrado y no se puede cancelar'); // 6
  await expect(page.getByRole('status')).toHaveCount(0);
});
```

**Por qué el mensaje es «ya está cerrado» y no «otra persona ha cambiado este pedido» (409):** el caso de uso `cancelOrder` lee primero el pedido (`findById`) y aplica la regla del dominio; como ya está `cancelled`, devuelve `already-closed` sin llegar a pedir la cancelación. Si alguien pregunta, es una buena conversación: el 409 del BFF es la red de seguridad para cuando el cambio llega **entre** la lectura y la escritura.

**Rompe la app (paso 4 del enunciado).** Con `reload();` comentado en `handleCancel`, el primer test falla así (salida real):
```
Error: expect(locator).toContainText(expected) failed
Expected substring: "Cancelado"
Received string:    "P-1005Hotel Brisa08/10/2026YoPendiente373,59 €AprobarCancelar"
```
El aviso sí sale («Pedido cancelado»): la pantalla cree que todo ha ido bien y la lista miente. Ningún test de componente lo detectaba, porque cada pieza hace bien su parte.

## Parte B · `.github/workflows/ci.yml`
La versión completa está en la rama. Los cinco huecos:
| Hueco | Valor | Test que lo pide |
|---|---|---|
| 1 | `permissions: { contents: read }` | el token del workflow solo puede leer el repositorio |
| 2 | `env: PR_TITLE: ${{ github.event.pull_request.title }}` + `run: echo "Revisando $PR_TITLE"` | el título del PR se sigue mostrando, pero entra como variable de entorno |
| 3 | Siete `- run:` en orden | ejecuta los controles en este orden… |
| 4 | `needs: quality` + `npx playwright install --with-deps chromium` | esperan a que calidad esté en verde e instalan solo Chromium… |
| 5 | `if: ${{ !cancelled() }}` | guardan el informe aunque fallen… |

## Parte C · El PR #142
Respuestas de las ocho preguntas guía y hallazgos completos: sección «Tema 22 · El PR #142» al final de esta guía (las preguntas 1 a 6 corresponden a los hallazgos 1 a 6, la 7 al hallazgo 9 y la 8 al `praise`; los hallazgos 7 y 8 no tienen pregunta guía: son para quien vaya rápido). Veredicto esperado: **pedir cambios**, con los bloqueantes agrupados por causa (capas, datos de fuera, datos personales) y conservando `export-csv.ts`.

## Corrección (15 min · 19:30 – 19:45)
| Minuto | Qué | Cómo |
|---|---|---|
| 19:30 | Parte A | `npx playwright test e2e/cancel-order.spec.ts --ui` y recorrer los pasos en el *timeline*. Comentar `reload();` en directo → rojo → leer «Received string … Pendiente». Deshacer |
| 19:35 | Parte B | `git diff examples/tema21/ci-heredado.yml .github/workflows/ci.yml` y los cinco huecos con la tabla de arriba. Enseñar los **checks obligatorios** en Settings → Rules (o Branches) del repositorio de formación: sin eso, el pipeline no protege `main` |
| 19:40 | Parte C | Las tres capas: 3 hallazgos de las herramientas, los de Copilot que el grupo haya validado y los que solo vio una persona. 1 punto por hallazgo válido (máx. 10). Cerrar con el `praise` |

## Tema 21 · Lo que el verde esconde (`examples/tema21/ci-heredado.yml`)
| # | Línea | Hallazgo | Riesgo | Cambio |
|---|---|---|---|---|
| 1 | `on: [push, pull_request]` | Cada push a una rama con PR ejecuta el pipeline dos veces; corre en cualquier rama | Coste, colas | PR y push solo a `main`; `concurrency` |
| 2 | sin `permissions` | El token tiene los permisos por defecto del repositorio | Un paso comprometido puede escribir | `permissions: contents: read` |
| 3 | `node-version: 18` | Distinto del Node del equipo; Node 18 ya no tiene soporte | «En mi máquina funciona» | `node-version-file: .nvmrc` |
| 4 | `echo "Revisando ${{ github.event.pull_request.title }}"` | El título del PR se pega en el script antes de ejecutarlo | Inyección de comandos | `env:` + `$PR_TITLE` |
| 5 | `npm install` | Puede instalar versiones distintas del lockfile | Builds no reproducibles | `npm ci` + `cache: npm` |
| 6 | `continue-on-error: true` en `lint:arch` | La regla de capas nunca bloquea | Falso verde | Quitarlo |
| 7 | `npm test \|\| true` | Los tests nunca bloquean | Falso verde | Quitarlo |
| 8 | Faltan `lint:boundaries`, `audit:secrets`, `perf:budget` y E2E; sin `timeout-minutes` | Controles del repositorio que nadie ejecuta; un job colgado gasta hasta el máximo de GitHub | Regresiones invisibles | Pasos y `timeout-minutes` |

## Tema 21 · Diagnostica el log (`examples/tema21/logs`)
| Log | Tipo | Evidencia | Reproducir | Cambio mínimo | Valida |
|---|---|---|---|---|---|
| 01 | Código | `TS2339: Property 'status' does not exist on type 'OrderRowViewModel'` | `npm run typecheck` | `row.statusLabel` en `OrdersTable.tsx:39` (un renombrado a medias) | Quien abre el PR |
| 02 | Dependencias | `Missing: date-fns@4.4.0 from lock file` | `npm ci` | `npm install` en local y subir `package-lock.json` | Quien revisa: ¿hacía falta la dependencia? (¿ADR?) |
| 03 | Test | `strict mode violation … resolved to 2 elements` en los dos intentos | `npx playwright test e2e/cancel-order.spec.ts` | `rowOf(page, 'P-1005').getByRole(…)`. **No** `.first()` ni más `retries`: falla siempre, no es intermitente | Quien abre el PR |
| 04 | Configuración / seguridad | `"github.event.pull_request.title" is potentially untrusted` | `actionlint .github/workflows/ci.yml` | `env:` + `$PR_TITLE` | Quien revisa y quien administra el repositorio |
| 05 | Rendimiento | `JavaScript inicial (gzip): 85.9 kB · presupuesto 70 kB · FUERA` | `npm run build && npm run perf:budget` | Quitar `moment` de la primera pantalla (`Intl.DateTimeFormat` o carga diferida). **No** subir el presupuesto | Quien revisa, con la medición antes/después |

## Tema 22 · El PR #142 (`examples/tema22`)
Lo que encuentran las **herramientas** (3):
| Herramienta | Hallazgo |
|---|---|
| `npm run lint:arch` | `ExportButton.tsx:2` importa `../infrastructure/order-dto` desde `ui` |
| `npm run audit:secrets` | `ExportButton.tsx:5` `import.meta.env.VITE_EXPORT_API_KEY`: viaja en el bundle (y el valor está en `.env`, versionado) |
| `npm run test:weak` | `ExportButton.test.tsx`: `toBeTruthy()` y `vi.mock` |

Lo que tiene que encontrar **una persona** (o Copilot, si las instrucciones están bien):
| # | `ruta:línea` | Etiqueta | Hallazgo |
|---|---|---|---|
| 1 | `pr-142.md` | `issue (bloqueante)` | La descripción no dice por qué, ni cómo se ha comprobado, ni qué datos salen en el CSV. «Testeado» no es evidencia |
| 2 | `ExportButton.tsx:9` | `issue (bloqueante)` | `role !== 'admin' && role !== 'manager'`: permiso decidido en la pantalla, no en `domain/permissions.ts`. Y el BFF ya recorta datos por rol: ¿quién decide de verdad? |
| 3 | `ExportButton.tsx:13` | `issue (bloqueante)` | `fetch` directo en un componente: se salta caso de uso, puerto y adapter (ADR-002) |
| 4 | `ExportButton.tsx:14` | `issue (bloqueante)` | `as OrderDto[]` sobre la respuesta: sin `parseOrders` (ADR-006). Los nombres del backend (`cust_nm`, `ord_st`) llegan a la UI |
| 5 | `ExportButton.tsx:15` | `issue (bloqueante)` | `console.log` con nombres de clientes: datos personales en la consola, fuera del `Logger` y de `LOG_FIELDS` (Sesión 7) |
| 6 | `ExportButton.tsx:13-21` | `issue` | Sin manejo de errores: si la petición falla, `busy` se queda en `true` y el botón muerto para siempre |
| 7 | `ExportButton.tsx:13` | `question` | ¿Una clave en la query string para un endpoint que ya autentica con cookie? Si hace falta, la pone el BFF, no el navegador |
| 8 | `ExportButton.test.tsx:7` | `issue` | `it('funciona')`: nombre que no dice el comportamiento; no prueba la exportación ni el fallo |
| 9 | `e2e/export.spec.ts:5-9` | `issue` | `waitForTimeout(2000)`, `locator('.page > button').first()` y `nth-child(2)`. Y la pregunta previa: ¿exportar es un journey crítico que merece E2E? |
| — | `export-csv.ts` y su test | `praise` | Función pura, escapa `;` y comillas, y el test dice el comportamiento con el valor exacto. Es la parte que habría que conservar |

Mensaje de cierre: las herramientas encuentran 3 de 12; el resto exige criterio. Copilot acierta varios si las instrucciones del repositorio los nombran; lo que no está escrito en ninguna parte (la descripción vacía, la pregunta de si merece E2E) es trabajo de personas.
