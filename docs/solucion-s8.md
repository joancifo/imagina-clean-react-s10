# Solución del ejercicio de la Sesión 8 (versión del profesor)

Repositorio de referencia: este mismo. Diferencias con el de prácticas:

| Archivo | Prácticas | Solución |
|---|---|---|
| `src/orders/infrastructure/order-dto.ts` | `parseOrderDto`: «Por implementar» | Lista blanca, tipos y valores comprobados en la frontera |
| `src/orders/infrastructure/order-mapper.ts` | `ownerId: dto.owner_id as string`; `parseOrder`/`parseOrders` sin escribir | `ownerId: dto.owner_id ?? null` y las dos funciones completas |
| `src/orders/domain/order.ts` | `ownerId: string` | `ownerId: string \| null` |
| `src/orders/infrastructure/http-order-gateway.ts`, `http-order-reader.ts` | `await response.json()` sin comprobar | `parseOrder` / `parseOrders` y fallo `invalid` |
| `src/orders/ui/orders-list-view-model.ts` | `canFilterByOwner: true` siempre | `canFilterByOwner: showAmounts`; el criterio que no se puede aplicar se ignora |
| `src/orders/ui/components/OrdersFilters.tsx` | Siempre pinta «Solo míos» | Solo si `canFilterByOwner` |
| `src/orders/ui/components/CancelDialog.tsx` | `.trim()` en cada pulsación, sin foco y sin error atado | Recorte al enviar, foco al abrir, `aria-invalid` + `aria-describedby` |
| `src/orders/ui/components/ApproveDialog.tsx` | Mensajes de error sueltos | Cada error atado a su campo y `aria-busy` en confirmar |
| `src/orders/ui/OrdersListPage.test.tsx` | `fireEvent` y montaje propio | `renderOrders` + `userEvent`, y el motivo comprobado tal cual se escribe |
| `src/orders/infrastructure/order-gateway.contract.test.ts` | Contrato contra `server/app.mjs` | Contra `server/bff.mjs` con sesión, más el bloque sin sesión |
| `src/orders/infrastructure/in-memory-order-gateway.ts` | Acepta cualquier motivo | Valida la longitud, como el backend |
| `shared/policy.json`, `cancellation-reason.ts`, `server/bff.mjs` | 280 en el dominio y 140 escrito a mano en el BFF | `cancellation.reasonMaxLength`, leído por los tres |
| `src/orders/testing/builders.ts` | `anOrderWithoutOwner` con un `as unknown as string` | Sin el `as` |
| Tests (`.skip`) | 8 bloques omitidos (69 tests) | Todo activo: 623 en verde |

## Antes de empezar la corrección
Tres comandos en dos minutos, en el repositorio de prácticas, con la aplicación arrancada:
```bash
npm run dev          # entrar como u3 (agente), marcar «Solo míos» → lista vacía
npm run test:contract    # 20 en verde… contra server/app.mjs
grep -n "as string" src/orders/infrastructure/order-mapper.ts
```

## Parte A · paso a paso

**1 · `parseOrderDto`.** El orden de las comprobaciones es el orden de los tests: raíz → campos obligatorios → opcionales → líneas → valores de vocabulario.
```ts
export function parseOrderDto(raw: unknown): Result<OrderDto, DtoProblem> {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return err({ field: '(raíz)', reason: raw === undefined ? 'missing' : 'type' });
  const source = raw as Record<string, unknown>;

  for (const field of REQUIRED_TEXT) if (!isText(source[field])) return err(problemFor(field, source[field]));
  for (const field of OPTIONAL_TEXT) if (source[field] !== undefined && !isText(source[field])) return err({ field, reason: 'type' });
  if (!Array.isArray(source.ln_items)) return err(problemFor('ln_items', source.ln_items));

  const lines: OrderDtoLine[] = [];
  for (const [index, raw_line] of source.ln_items.entries()) {
    const line = parseLine(raw_line, index);
    if (!line.ok) return line;
    lines.push(line.value);
  }

  if (!(ORDER_STATUSES as readonly string[]).includes(source.ord_st as string)) return err({ field: 'ord_st', reason: 'value' });
  if (!(CUSTOMER_TIERS as readonly string[]).includes(source.cust_tier as string)) return err({ field: 'cust_tier', reason: 'value' });

  return {
    ok: true,
    value: {
      ord_id: source.ord_id as string, cust_nm: source.cust_nm as string, cust_tier: source.cust_tier as string,
      ord_st: source.ord_st as string, crt_ts: source.crt_ts as string, ln_items: lines,
      ...(isText(source.owner_id) ? { owner_id: source.owner_id } : {}),
      ...(isText(source.cust_note) ? { cust_note: source.cust_note } : {}),
    },
  };
}
```
Los `as string` del final **sí** son legítimos: vienen después de comprobarlo. Los de antes no lo eran.

**2 · El dominio y el mapper.** `ownerId: string | null` en `domain/order.ts` y `ownerId: dto.owner_id ?? null` en `toOrder`. Tres sitios más dejan de compilar y los tres son el ejercicio: el builder (`anOrderWithoutOwner`), el view model (la fila) y el filtro.

**3 · Los adapters.**
```ts
const order = parseOrder(await readBody(response));
if (!order.ok) throw new OrderGatewayError('invalid', describeProblem(order.error));
return order.value;
```

**4 · El view model.** La clave es `effective`: si el criterio no se puede aplicar, no se aplica **en ningún sitio**, incluido el cálculo de `emptyMessage`.
```ts
const showAmounts = canSeeAmounts(actor);
const effective = showAmounts ? criteria : { ...criteria, onlyMine: false };
const visible = orders.filter(matches(effective, actor)).sort(COMPARATORS[effective.sort]);
const filtered = effective.text.trim() !== '' || effective.status !== 'all' || effective.onlyMine;
```
Y en la fila: `owner: showAmounts ? (order.ownerId === null ? '—' : order.ownerId === actor?.id ? 'Yo' : order.ownerId) : null`.

**Errores frecuentes en esta parte**
- Devolver `{ ...source, ln_items: lines }`: el test «un campo nuevo del backend no rompe al cliente, pero tampoco entra» lo caza.
- Comprobar `ord_st` antes que las líneas: cambia el campo del error y dos tests se ponen rojos. El orden es parte del contrato.
- `dto.owner_id ?? ''`: la cadena vacía no es «no lo sé», y el filtro vuelve a vaciar la lista en silencio.
- Dejar `criteria` en `emptyMessage`: un agente sin resultados ve «sin resultados para estos filtros» sin tener ningún filtro puesto.

## Parte B · paso a paso

**Los cuatro tests rojos de `CancelDialog` y por qué.** Todos salen de la misma línea:
```tsx
// partida                                   // solución
onChange={(e) => setReason(e.target.value.trim())}   onChange={(e) => setReason(e.target.value)}
onConfirm(reason)                                    onConfirm(reason.trim())
```
`fireEvent.change` escribe el valor entero de una vez, así que `trim()` solo tocaba los extremos y no se notaba. `user.type` escribe tecla a tecla: después de «Cliente » el valor se recorta a «Cliente», y la siguiente letra se pega. El motivo que llega al backend es «ClienteduplicadoenelERP», pasa la validación de longitud y nadie se entera.

Los otros dos son el foco y el error atado:
```tsx
const field = useRef<HTMLTextAreaElement>(null);
useEffect(() => { field.current?.focus(); }, []);
…
<textarea ref={field} aria-label="Motivo" aria-invalid={error !== null} aria-describedby={error ? ERROR_ID : undefined} … />
{error && <p id={ERROR_ID} role="alert">{error}</p>}
```
`role="alert"` lo anuncia **cuando aparece**. `aria-describedby` lo deja disponible **cuando el foco vuelve al campo**. Son dos momentos distintos: hacen falta los dos.

**`ApproveDialog`.** Lo mismo, tres veces, con un identificador por campo (`ERROR_IDS`), más `aria-busy={busy}` en el botón.

**Qué enseñar aquí si hay poco tiempo:** `npm run demo:tema18` y abrir `examples/tema18/fire-vs-user.test.tsx`. Son quince líneas y el mismo fallo en miniatura.

## Parte C · paso a paso

**1 · El contrato, contra el servidor de verdad.**
```ts
describeOrderGatewayContract('adapter HTTP + server/bff.mjs', async () => {
  const { baseUrl, withSession, dispose } = await startBff(USER_IDS.admin);
  return { gateway: createHttpOrderGateway(withSession, baseUrl), dispose };
});
```
`startBff` abre sesión y devuelve un `fetch` con la cookie: en el navegador eso lo hace el navegador, en Node no hay nadie que guarde cookies.

**2 · Los dos casos que fallan, y por qué son el hallazgo del día.** Con el bloque «lo que valida el backend» activo salen dos rojos, uno por implementación:

```
× fake en memoria    › un motivo más largo de 280 caracteres es invalid  → expected 'no-error' to be 'invalid'
× adapter HTTP + bff › un motivo de la longitud máxima exacta sí se acepta → HTTP 422 · invalid
```

El primero: el fake acepta lo que el backend rechaza, así que todos los tests de caso de uso que lo usan demuestran un comportamiento que en producción no existe. El segundo: el dominio y el backend llevan dos sesiones sin estar de acuerdo —`REASON_MAX_LENGTH` valía 280 y el BFF cortaba en 140—, de modo que un motivo de 200 caracteres pasaba la validación del dominio y volvía de la red con un error genérico. Los dos se arreglan con el mismo cambio.
```jsonc
"cancellation": { "managerLimit": 5000, "reasonMaxLength": 140 }
```
```ts
// src/orders/domain/cancellation-reason.ts
export const REASON_MAX_LENGTH = policy.cancellation.reasonMaxLength;
// src/orders/infrastructure/in-memory-order-gateway.ts, primera línea de cancel()
const text = String(reason);
if (text.trim().length < MIN_REASON_LENGTH || text.length > REASON_MAX_LENGTH) throw new OrderGatewayError('invalid');
// server/bff.mjs, readCancelBody
reason.length > policy.cancellation.reasonMaxLength
```
Se comparte el **número**; cada lado aplica la regla con su código. Es la misma decisión de la Sesión 6 (ADR-004) aplicada a un campo de texto.

**3 · El orden importa dentro del fake.** La validación del motivo va **antes** de buscar el pedido: un motivo imposible sobre un pedido que no existe es `invalid`, no `not-found`. El backend responde 422 antes de mirar nada, y el fake tiene que decir lo mismo.

**Errores frecuentes en esta parte**
- Dejar las dos fábricas (app.mjs y BFF): el caso del 422 falla contra `app.mjs`, que no valida. La API heredada no es el contrato del navegador.
- Usar `fetch` en lugar de `withSession`: todo responde 401 y parece que el BFF está roto.
- «Arreglar» el contrato quitándole el caso. El contrato no se negocia con el fake: el fake se ajusta al contrato.

## Cómo corregir en 15 minutos (19:30 – 19:45)
| Minuto | Qué enseñar | Dónde |
|---|---|---|
| 19:30 | El síntoma y la causa: agente → «Solo míos» → lista vacía → `as string` en el mapper | `npm run dev` y `order-mapper.ts` |
| 19:35 | `parseOrderDto` y los tres tests que más cuestan: campo nuevo, tipo equivocado, estado desconocido | `order-mapper.test.ts` |
| 19:38 | El diálogo: ejecutar `CancelDialog.test.tsx` con el `.trim()` puesto y quitado | En directo |
| 19:41 | El contrato contra el BFF: el caso que falla solo para el fake, y el 280 frente al 140 | `order-gateway.contract.ts` |
| 19:44 | Los números: 623 en verde, contrato × 2 implementaciones, mutación 94 % | Terminal |

## Comprobación de la solución
```bash
npm test                 # 623 en verde, 0 omitidos
npm run test:contract    # 26 casos en dos implementaciones + 3 sin sesión
npm run test:policy && npm run lint:arch && npm run lint:boundaries && npm run typecheck
npm run build && npm run perf:budget                                   # 65,3 kB · DENTRO
npm run mutate -- src/orders/infrastructure/order-dto.ts --tests "src/orders/infrastructure/order-mapper.test.ts"   # 94 %
```
