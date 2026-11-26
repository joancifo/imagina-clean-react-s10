# Ejercicio Sesión 10 · Laboratorio: código heredado con GitHub Copilot

**Duración:** 60 minutos (18:30 – 19:30) · **Corrección:** 15 minutos (19:30 – 19:45)
**Avance del proyecto final:** el flujo completo sobre un módulo heredado (mapa, red, plan y primer paso), que es lo que pide el Tema 25 condensado en una hora.

> El laboratorio que elegisteis: **un flujo completo sobre código heredado con Copilot**. Cuatro fases cortas, cada una con su plantilla, su skill de Copilot y su comprobación. Lo que cuenta no es terminar el refactor: es que **cada paso esté protegido y cada decisión sea vuestra**. Si te atascas más de 3 minutos en un paso, mira su pista.

```bash
git checkout -b s10/<tu-nombre>
npm install
npm test             # todo en verde: los tuyos están como «todo» y «skipped»
npm run dev          # http://localhost:5173/orders/P-1004/returns con Pau (manager)
```

## Contexto
OrderDesk tiene una pantalla que nadie ha tocado en el curso: **Devoluciones** (`src/pages/ReturnsPage.tsx`, 153 líneas). Funciona. Calcula reembolsos con dinero, descuentos e IVA; aplica un plazo; decide quién puede; habla con dos APIs que no son el BFF de verdad (`server/returns-legacy.mjs`). Y no tiene ni un test.

```
Fase 1 (10 min)          Fase 2 (15 min)            Fase 3 (10 min)             Fase 4 (15 min)
El mapa             ──▶  La red                ──▶  El plan                ──▶  El primer paso
mapa.md                  caracterización             plan.md                      src/returns/domain
/mapear-modulo           /caracterizar               /planificar-refactor         Copilot en modo Agent
```

**Ya está escrito** (léelo en la introducción, 3 minutos):
| Archivo | Qué te da |
|---|---|
| `src/pages/ReturnsPage.tsx` | El código heredado. **No lo toques hasta la Fase 4** |
| `src/pages/returns-harness.tsx` | El arnés: un backend «de mentira» (`legacyBackend`), el reloj (`atDate`), el montaje (`openReturns`) y los datos (`STANDARD`, `GOLD`, `SILVER`, `IN_TRANSIT`, `ADMIN`, `AGENT`) |
| `src/pages/returns.characterization.test.tsx` | 4 tests modelo en verde y tus `it.todo` |
| `src/returns/domain/return-rules.ts` y `.test.ts` | El esqueleto del primer paso y su especificación (omitida) |
| `docs/devoluciones/mapa.md` y `plan.md` | Las plantillas de las fases 1 y 3 |
| `AGENTS.md`, `.github/instructions/returns.instructions.md`, `.github/skills/` | Copilot preparado para este trabajo (Tema 24) |
| `prompts/sesion-10.md` | Los prompts de cada fase |

## Fase 1 · El mapa (10 min · 18:40 – 18:50)
Entrega: `docs/devoluciones/mapa.md`, secciones 1 a 5.

1. En el chat (modo **Ask**): prompt **P1** de `prompts/sesion-10.md` (`/mapear-modulo`).
2. En la terminal, las herramientas: `npm run rules`, `npm run state`, `npm run map`.
3. **Contrasta.** Abre cada `ruta:línea` que proponga Copilot. Lo que no esté en esa línea, no entra. Lo que encuentre una herramienta y Copilot no, sí entra.
4. Sección 5: al menos una afirmación de Copilot que **no era cierta** (o cómo has comprobado que todas lo eran).

### Pautas de la Fase 1
| Busca… | Pista |
|---|---|
| Responsabilidades | Hay al menos siete: identidad, carga encadenada, reembolso, permisos, plazo, unidades restantes, envío, aviso y navegación, log |
| Peticiones | Cuatro `fetch`. Dos de ellas **dentro** del `.then` de otra: ¿qué pasa con la pantalla si falla la del transportista? |
| Reglas | Porcentajes, `30`, `500`, `0.15`, `1.21`, roles y estados. ¿Cuáles están ya en `shared/policy.json` y cuáles no? |
| Riesgos | Mira el `body` del `POST /api/returns` y después `server/returns-legacy.mjs`: ¿quién calcula el importe que se guarda? |

## Fase 2 · La red (15 min · 18:50 – 19:05)
Archivo: `src/pages/returns.characterization.test.tsx`. Comando: `npm run lab:red`.

1. Prompt **P2** (`/caracterizar`): que liste los casos con su rama. No le pidas código todavía.
2. Convierte en tests los **cuatro obligatorios** (T1 a T4). Cambia `it.todo('…')` por `it('…', async () => { … })` y pon un nombre que diga el comportamiento **con su valor**.
3. Para cada uno: escribe un valor que sabes falso, ejecuta, **copia el valor real** del error y léelo. ¿Tiene sentido? Si no, es una rareza: comentario `// RAREZA · …` encima del test y una fila en la tabla de preguntas de `plan.md`.

### Pautas de la Fase 2
| Test | Monta | Comprueba |
|---|---|---|
| T1 defectuoso | `const { user } = openReturns('P-1004', legacyBackend())` · `await heading()` · `await user.selectOptions(screen.getByRole('combobox', { name: /Motivo/ }), 'DEFECTIVE')` | `refund()` y que la nota de reposición **ya no** está (`queryByText(…)` + `not.toBeInTheDocument()`) |
| T2 ya devueltas | Igual que T1. Después `await user.clear(screen.getByRole('spinbutton'))` y `await user.type(…, '3')` y pulsa `submit()` | El texto «Ya devueltas: …», el mensaje de error y `backend.posted` (guarda `const backend = legacyBackend()` antes) |
| T3 ventana | `atDate('2026-12-12T09:59:00Z')` **antes** de `openReturns` (el `beforeEach` pone el día de clase; lo vuelves a cambiar dentro del test) | 09:59: el botón existe. 10:01: el texto «Han pasado más de 30 días…» y el botón no existe |
| T4 transportista caído | `const backend = legacyBackend({ carrierDown: true })` · importa `waitFor` · `await waitFor(() => expect(backend.calls).toContain('GET /api/returns?ord_id=P-1004'))` | Que **sigue** en «Cargando…» y no hay ningún `heading` |

**Trampas que hacen fallar un test:**
- `getByText('Reembolso: 148,40 €')` falla aunque se vea igual: Intl pone un espacio de no separación antes de `€`. Usa el `refund()` del archivo, que normaliza.
- Mirar la pantalla nada más montar: la pantalla pide los datos en cadena. Espera primero a `await heading()`.
- `atDate(…)` **después** de `openReturns`: la pantalla ya ha calculado con la fecha del `beforeEach`.
- En T4, `findByText('Cargando…')` pasa siempre, también al principio de cualquier test. Lo que demuestra el comportamiento es que **todo lo demás ha llegado** (`backend.calls`) y aun así sigue cargando.
- Aceptar el valor que propone Copilot sin ejecutarlo. Un test de caracterización con el valor «correcto» describe un sistema que no existe.

## Fase 3 · El plan (10 min · 19:05 – 19:15)
Entrega: `docs/devoluciones/plan.md`.

1. **Decisión de estructura** con `docs/guia-de-decision.md`: marca una opción y justifícala en una frase con una **señal** de la sección 2.
2. Prompt **P3** (`/planificar-refactor`). Copilot propone; tú ordenas, partes o tachas. Entre 5 y 7 pasos.
3. Cada paso: qué cambia, qué no, qué comando lo protege, cómo se revierte y su riesgo.
4. **Preguntas para Producto**: una por cada `RAREZA ·`. El plan no las responde: dice en qué paso se aplicaría la respuesta.
5. Apunta lo que la IA propuso y has descartado.

### Pautas de la Fase 3
- Orden recomendado (de dentro afuera): red → reglas puras → números a `shared/policy.json` → servidor (el BFF calcula el importe y autoriza) → puerto y adapter → pantalla nueva detrás de un flag → borrar la heredada.
- El paso del **servidor** no es opcional: mientras el cliente envíe `rfd_amt` y `req_role`, cualquiera puede registrar el reembolso que quiera. ¿En qué posición lo pones? Justifícalo.
- Un paso que no se revisa en 15 minutos son dos pasos.

## Fase 4 · El primer paso (15 min · 19:15 – 19:30)
Archivos: `src/returns/domain/return-rules.ts` (HUECOS 1 a 5) y `return-rules.test.ts`. Comandos: `npm run lab:rules` y `npm run lab:check`.

1. Quita el `.skip` del primer `describe` de `return-rules.test.ts`. Rellena el hueco que pide. `npm run lab:rules`. Repite con el siguiente.
   Con Copilot en modo **Agent**: prompt **P4**, primera parte. **Revisa el diff** antes de aceptar.
2. Con los cuatro primeros huecos en verde, sustituye en `ReturnsPage.tsx` el código por las funciones, importadas desde `'../returns'`:
   ```ts
   import { chargesRestocking, isWithinReturnWindow, refundFor, remainingQuantity } from '../returns';
   ```
   | Dónde | Antes | Después |
   |---|---|---|
   | Segundo `useEffect` | `base`, `pct`, `amount`, el `if` y `Math.round` | `setRefund(refundFor({ unitPrice: line.unit_prc, quantity: qty, tier: order.cust_tier, reason }))` |
   | Plazo | `const days = …; if (days > 30)` | `if (!isWithinReturnWindow(shipment.dlv_ts, new Date()))` |
   | Unidades | `returned` y `max` | `const max = line ? remainingQuantity(line.qty, previous.filter((r) => r.sku === sku).map((r) => r.qty)) : 0;` (y `returned` sigue para el texto) |
   | Nota | `reason !== 'DEFECTIVE' && order.cust_tier !== 'gold'` | `chargesRestocking(order.cust_tier, reason)` |
   `reason` es un `string` en la pantalla: `reason as ReturnReason` es aceptable aquí, porque el valor sale de un `<select>` con tres opciones fijas (no llega de fuera). Escríbelo con ese comentario.
3. `npm run lab:check` → typecheck, la red, las reglas y las fronteras, en verde. Si algo se pone en rojo, la red acaba de hacer su trabajo: lee qué valor esperaba.
4. `git add -A && git commit -m "S10: red, plan y primer paso de Devoluciones"`.

**Trampas que hacen fallar un test:**
- `>=` en vez de `<=` en el plazo, o `Math.floor` de los días: la caracterización del 12/12 te lo dice.
- Calcular la reposición sobre el importe con descuento («porque es lo lógico»): `refundFor` deja de dar 64,97 € en silver. Es la rareza 2: se pregunta, no se arregla.
- Importar desde `'../returns/domain/return-rules'`: `npm run lab:check` falla en `lint:boundaries`.
- Dejar `new Date()` **dentro** del dominio: compila, pero ya no se puede probar sin trucos de reloj.

## Si te sobra tiempo
- Los `it.todo` de «más casos»: el agente, el límite de 500 € con `GOLD`, silver, el pedido en tránsito y el error 500.
- HUECO 5 (`needsAdminApproval`) y su `describe`.
- Quita el segundo `useEffect` de la pantalla: el reembolso es **estado derivado**, se puede calcular en el render (Sesión 5). ¿Sigue la red en verde?
- Abre `docs/guia-de-decision.md`, sección 5, y pasa la checklist a tu paso. ¿Qué casillas quedan sin marcar?
