# Solución Sesión 10 · Guía del profesor

Rama `solucion-s10`, un commit por paso del plan (`git log --oneline main..solucion-s10`).
Verificado: `npm test` 750 en verde, `npm run test:e2e` 4 en verde, `lint:arch` (ahora `src/orders` y `src/returns`), `lint:boundaries`, `typecheck`, `audit:secrets`, `build` y `perf:budget` (68,2 kB, DENTRO).

| Commit | Paso del plan |
|---|---|
| `test(devoluciones): red de caracterización completa, mapa y plan` | 1 · y las entregas de las fases 1 a 3 |
| `refactor(returns): reglas puras en src/returns/domain…` | 2 · la Fase 4 del laboratorio, terminada |
| `feat(bff): contexto de devolución y alta con importe y autorización del servidor` | 3 |
| `feat(returns): puerto, adapter HTTP con parser, fake y casos de uso` | 4 |
| `feat(returns): pantalla nueva detrás del flag newReturns` | 5 |

## Repaso · ¿Dónde va? (`examples/repaso/adapter-o-bff.md`)
Respuestas: **1A · 2B · 3D (y B) · 4A y P · 5B · 6B · 7P (pregunta a D) · 8A**.
| # | Respuesta | Por qué |
|---|---|---|
| 1 | A | Traducir nombres del backend es trabajo del adapter (`order-mapper.ts`). El dominio no sabe que existe `ord_st` |
| 2 | B | Lo que no puede ver, no viaja (`visibleFor`). Ocultarlo en la pantalla es autorización visual, no real |
| 3 | D, y B | Regla con dinero: función pura del dominio. El BFF la vuelve a calcular con los mismos números (`shared/policy.json`) y un test de contrato comprueba que coinciden |
| 4 | A y P | El adapter traduce 503 a `unavailable` (código estable). El texto lo elige la pantalla (`*-messages.ts`): es UX |
| 5 | B | Agregación: la pantalla espera una vez. Es el `return-context` del paso 3 |
| 6 | B | `process.env` en Node. Nada `VITE_` con un secreto: viaja en el bundle |
| 7 | P | El texto es de la pantalla; la condición, del dominio (`chargesRestocking`) |
| 8 | A | La frontera parsea: `null` significa «no lo sé / no entregado» y se modela así (Sesión 8) |

## Tema 23 · Juicio rápido (`examples/tema23/escenarios.md`)
| # | Aproximación | No aplicaría | Señal |
|---|---|---|---|
| 1 · Salas de RR. HH. | A, sencilla. Funciones puras si hay alguna regla de solapes | Puertos, BFF, capas | Vida corta, una API estable, una persona |
| 2 · Checkout | C + D (pasarelas detrás de un puerto) + E (secretos y autorización en servidor) | Contenedor IoC; Aggregates si las reglas caben en funciones | Proveedor que se va a cambiar; dinero; cuatro equipos |
| 3 · Catálogo CRUD | B, por features, con API pública y reglas de importación | Dominio rico, casos de uso que solo reenvían | Muchas pantallas parecidas, sin lógica, mucho cambio de UI |
| 4 · Panel de operaciones | E (BFF agregador, claves en el servidor) + view models | Dominio rico | 14 peticiones y dos claves |
| 5 · Devoluciones | C + D + E: lo que hace `solucion-s10` | TanStack Query, IoC, CQRS, Aggregates | Dinero y fechas en la pantalla; dos backends con otro idioma; el cliente decide el importe |

## Fase 1 · El mapa
Versión de referencia: `docs/devoluciones/mapa.md`. Lo que más se escapa: la reposición (aparece **dos veces**: `:52` y `:145`), el `.catch(() => {})` de `:36`, y que `npm run rules` no detecta el `0.15` ni el `30`.

## Fase 2 · La red
Los 18 tests: `src/pages/returns.characterization.test.tsx`. Los cuatro obligatorios:
```ts
it('defectuoso: sin gastos de reposición, 169,40 €', async () => {                              // T1
  const { user } = openReturns('P-1004', legacyBackend());
  await heading();
  await user.selectOptions(screen.getByRole('combobox', { name: /Motivo/ }), 'DEFECTIVE');
  expect(refund()).toBe('Reembolso: 169,40 €');
  expect(screen.queryByText('Incluye gastos de reposición del 15 %')).not.toBeInTheDocument();
});

it('una cantidad mayor que la que queda: «Cantidad no válida» y no envía nada', async () => {     // T2
  const backend = legacyBackend();
  const { user } = openReturns('P-1004', backend);
  await heading();
  expect(screen.getByText('Ya devueltas: 1 · Puedes devolver hasta 2')).toBeInTheDocument();
  await user.clear(screen.getByRole('spinbutton'));
  await user.type(screen.getByRole('spinbutton'), '3');
  await user.click(submit());
  expect(screen.getByText('Cantidad no válida')).toBeInTheDocument();
  expect(backend.posted).toEqual([]);
});

// RAREZA · «30 días» son 30 × 24 horas desde la HORA de entrega (10:00 UTC), no 30 días naturales.
it('ventana de 30 días contada en horas: el 12/12 a las 09:59 UTC todavía se puede', async () => { // T3
  atDate('2026-12-12T09:59:00Z');
  openReturns('P-1004', legacyBackend());
  await heading();
  expect(submit()).toBeInTheDocument();
});
it('ventana de 30 días contada en horas: el 12/12 a las 10:01 UTC ya no', async () => {
  atDate('2026-12-12T10:01:00Z');
  openReturns('P-1004', legacyBackend());
  await heading();
  expect(screen.getByText('Han pasado más de 30 días desde la entrega (12/11/2026).')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Registrar devolución' })).not.toBeInTheDocument();
});

// RAREZA · Si el transportista no responde, la pantalla se queda cargando PARA SIEMPRE.
it('si el transportista no responde, se queda en «Cargando…» aunque el resto haya llegado', async () => { // T4
  const backend = legacyBackend({ carrierDown: true });
  openReturns('P-1004', backend);
  await waitFor(() => expect(backend.calls).toContain('GET /api/returns?ord_id=P-1004'));
  expect(screen.getByText('Cargando…')).toBeInTheDocument();
  expect(screen.queryByRole('heading')).not.toBeInTheDocument();
});
```
Valores de «más casos»: artículo equivocado **148,40 €** (rareza 1) · agente «No tienes permiso para gestionar devoluciones.» · manager con 5 × D-40 gold **517,28 €**, aviso y botón desactivado · admin, botón activo · silver 2 × A-10 **64,97 €** (rareza 2: 74,72 − 9,75) · gold 1 × D-40 **103,46 €** · en tránsito «Este pedido todavía no se ha entregado.» · 500 → «Error 500» y botón activo.

**Para enseñar la red funcionando (corrección, 1 min):** en `ReturnsPage.tsx:76` cambia `days > 30` por `days >= 30` o, en la línea 52, `base * 0.15` por `amount * 0.15`. `npm run lab:red` → rojo en el test exacto. Deshacer.

## Fase 3 · El plan
Versión de referencia: `docs/devoluciones/plan.md` (7 pasos, 4 preguntas). Lo que hay que defender en la corrección:
- El paso del **servidor va antes que la pantalla nueva**: una pantalla bonita que sigue enviando `rfd_amt` no arregla el riesgo principal.
- Las rarezas **no** se resuelven en el plan: se preguntan.
- Lo descartado de Copilot es parte de la entrega.

## Fase 4 · El primer paso
`src/returns/domain/return-rules.ts` en la rama. El diff de `ReturnsPage.tsx` del paso 2 (`git show ":/reglas puras" -- src/pages/ReturnsPage.tsx`) es exactamente la tabla del enunciado. `npm run lab:check` en verde sin tocar un test de la red.
Errores típicos que la red detecta: `>=` en el plazo; reposición sobre `amount`; olvidar `Math.round`; `new Date()` dentro del dominio (no rompe la red, pero `lint:arch` lo marca en la solución, porque `src/returns` ya tiene las reglas de capa).

## Corrección (15 min · 19:30 – 19:45)
| Minuto | Qué | Cómo |
|---|---|---|
| 19:30 | Fases 1 y 2 | Mapa de un voluntario frente al de referencia: ¿quién encontró la reposición duplicada y el `.catch`? Romper la red en directo (arriba) |
| 19:35 | Fases 3 y 4 | Dos planes en pantalla: ¿dónde puso cada uno el servidor? `git show` del paso 2: el diff que cabe en una revisión de 15 minutos |
| 19:40 | El plan ejecutado | `git log --oneline main..solucion-s10`, `server/returns.mjs` (el importe ya no viaja), `src/returns/policy.contract.test.ts` y `?flags=newReturns` en el navegador |

## Test de conceptos final (todo el curso)
Respuestas: **1B · 2A · 3C · 4B · 5C · 6A · 7B · 8C · 9A · 10B · 11C · 12A**.

## Repaso relámpago de la Sesión 9 (apertura)
Respuestas: **1B · 2C · 3A · 4C · 5B**.
