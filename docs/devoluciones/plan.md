# Plan de refactor incremental · Devoluciones

Laboratorio de la Sesión 10 · **Fase 3** · Versión de referencia de Joan Cifo. Ejecutado en la rama `solucion-s10`, un commit por paso.

## Decisión de estructura
- [ ] Dentro de `src/orders`, como una capacidad más de Pedidos
- [x] Feature propia `src/returns`, con su API pública y capas solo donde paguen
- [ ] Un vertical slice por caso de uso (`request-return/`)
- [ ] Dejarla como está y solo arreglar la seguridad

Justificación: tiene reglas con dinero, plazo y permisos (señal: «un test necesita navegador y reloj para probar una regla») y dos backends que hablan otro idioma (señal: «el backend habla otro idioma»), pero es **otra** capacidad, con su propia API y su propio ritmo de cambio: dentro de Pedidos haría crecer una feature que ya es grande. Detalle en `docs/adr/008-devoluciones.md`.

## Pasos
| # | Paso (un PR) | Qué cambia | Qué NO cambia | Red de seguridad (comando) | Cómo se revierte | Riesgo |
|---|---|---|---|---|---|---|
| 1 | Completar la caracterización | 18 tests en `returns.characterization.test.tsx` | Producción | `npm run lab:red` | Borrar el archivo | Ninguno |
| 2 | Reglas puras en `src/returns/domain` y números en `shared/policy.json` | La pantalla llama a `refundFor`, `isWithinReturnWindow`, `remainingQuantity`, `chargesRestocking`, `needsAdminApproval` y `canManageReturns` | Comportamiento (rarezas incluidas), peticiones, JSX | `npm run lab:check` | `git revert` (un commit) | Bajo: lo cubre la red |
| 3 | **Servidor**: el BFF calcula el importe y autoriza | `GET /api/orders/:id/return-context` (agrega pedido, entrega y devoluciones) y `POST /api/orders/:id/returns` (lista blanca: `sku`, `qty`, `reason`) | La pantalla heredada y las rutas heredadas, que siguen funcionando | `npx vitest run server/returns.test.mjs src/returns/policy.contract.test.ts` | Revert: los endpoints nuevos no los usa nadie todavía | Medio: reglas en dos lenguajes. Lo controla el test de contrato |
| 4 | Puerto, adapter HTTP con parser, fake y casos de uso | `src/returns/application` e `infrastructure`, `composition.ts` | Ninguna pantalla los usa todavía | `npm run lab:rules` | Revert | Bajo |
| 5 | Pantalla nueva detrás del flag `newReturns` | `src/returns/ui`, ruta en el shell; por defecto, **apagado** | La heredada sigue siendo la que se ve | `npm run lab:rules`, `AppRoutes.test.tsx` | `?flags=-newReturns` o revert | Medio: comportamiento visible distinto (ver preguntas) |
| 6 | Encender el flag y cerrar la API heredada al navegador | `DEFAULT_FLAGS.newReturns = true`; `POST /api/returns` deja de aceptar peticiones del navegador | | E2E de devolución + red | `?flags=-newReturns` | Medio |
| 7 | Borrar la heredada | `ReturnsPage.tsx`, su arnés, su red y el flag | | `npm test` | Revert | Bajo, tras una semana sin incidencias |

Los pasos 1 a 5 están hechos en `solucion-s10`. Los pasos 6 y 7 dependen de las respuestas de Producto y de una semana en producción.

## Preguntas abiertas para Producto
| # | Pregunta | Comportamiento actual (test) | Se aplicaría en el paso |
|---|---|---|---|
| 1 | Si enviamos un artículo equivocado, ¿cobramos reposición al cliente? | Sí, 148,40 € en vez de 169,40 € («artículo equivocado: TAMBIÉN cobra reposición») | 2 o posterior: una línea en `chargesRestocking` y su test, con `{ heredada, nueva }` |
| 2 | ¿La reposición del 15 % es sobre el precio de tarifa o sobre lo que pagó el cliente (con descuento e IVA)? | Sobre tarifa, sin descuento ni IVA («silver, 2 unidades: 64,97 €») | 2 o posterior, en `refundFor` y en el BFF a la vez (test de contrato) |
| 3 | ¿«30 días» son 30 días naturales hasta las 23:59 (hora de Madrid) o 720 horas desde la entrega? | 720 horas («el 12/12 a las 10:01 UTC ya no») | 2 o posterior, en `isWithinReturnWindow` y en el BFF |
| 4 | Si el transportista no responde, ¿qué debe ver la persona? | «Cargando…» para siempre | 5: la pantalla nueva enseña un error con reintento (cambio declarado) |

## Lo que la IA propuso y he descartado
- «Migrar Devoluciones a TanStack Query»: no hay una segunda pantalla que comparta estos datos (ADR-003).
- «Crear `ReturnsService`, `ReturnsRepository` y `ReturnsFacade`»: tres abstracciones para un caso de uso; basta un puerto (`ReturnsGateway`) y dos casos de uso.
- «Corregir la reposición en el paso 2 para que se calcule sobre el importe con descuento»: cambia comportamiento sin decisión de Producto (pregunta 2).
- «Reescribir la pantalla con el formulario nuevo y borrar la vieja en el mismo PR»: sin vuelta atrás y sin red para comparar.
