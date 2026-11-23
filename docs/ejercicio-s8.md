# Ejercicio Sesión 8 · Tests que comprueban: datos, pantalla y frontera

**Duración:** 45 minutos (18:45 – 19:30) · **Corrección:** 15 minutos (19:30 – 19:45)
**Avance del proyecto final:** kit de pruebas de la feature, validación en la frontera, tests de componente accesibles y contrato contra el backend de verdad.

```bash
git checkout -b s8/<tu-nombre>
npm install
npm test                 # 554 tests en verde y 69 omitidos (skipped): 8 bloques que activarás tú
npm run test:contract    # 20 casos en verde… contra server/app.mjs. ¿Con quién habla el navegador?
npm run test:weak        # 14 aserciones débiles y 6 vi.mock. Una lista para mirarla con criterio
npm run dev              # entra como u3 (agente) y marca «Solo míos»: la lista se queda vacía
```

## Contexto
La Sesión 7 terminó con 623 tests, un presupuesto de rendimiento DENTRO y una puntuación de mutación del 100 % en el módulo crítico del panel. Hoy toca la pregunta incómoda: **con todo eso en verde, ¿qué sigue sin estar probado?**

Tres hechos de partida, todos comprobables en dos minutos:

1. **Hay un fallo en producción que ningún test ve.** Entra como agente (`u3`) y marca «Solo míos»: la lista se queda vacía siempre. La causa está en la frontera: desde la Sesión 6, el BFF **no le envía `owner_id` a un agente**, y `order-mapper.ts` lo mete en el dominio igual, con un `as string` que le dice al compilador que se calle.
2. **Por el archivo por el que entran TODOS los datos de fuera no pasa ni un test.** `order-mapper.ts` lleva siete sesiones traduciendo respuestas del backend sin un solo caso de prueba, y los adapters escriben `const dto: OrderDto = await response.json()`. Eso no es una comprobación: es una promesa que nadie ha verificado. TypeScript no comprueba la red.
3. **El test de contrato se ejecuta contra el servidor equivocado.** `order-gateway.contract.test.ts` levanta `server/app.mjs` —la API heredada, la que no autoriza ni valida—. El navegador habla con `server/bff.mjs`. Un contrato ejecutado contra el backend que nadie usa no es más seguro que no tenerlo: es menos, porque además tranquiliza.

```
Parte A                       Parte B                        Parte C
La frontera de los datos ──▶  La pantalla, como se usa  ──▶  La frontera con el backend
parseOrderDto                 userEvent y foco               MSW y la tabla de errores
ownerId: string | null        errores atados a su campo      el contrato, contra el BFF
el filtro que no se puede     el kit de montaje              el fake que mentía
```

**Ya está escrito** (léelo antes de empezar): todo `src/orders/testing/` (builders, dobles, fixtures, MSW, el arranque de pantallas y el del BFF), `parseLine` en `order-dto.ts`, y los 69 tests omitidos. Como en las Sesiones 5, 6 y 7: **la especificación son los tests**, y en cada parte hay casos pensados para que la primera solución que se te ocurra falle.

## Antes de empezar (5 minutos de lectura que ahorran 20)

**Cómo trabajar con los tests.** Ejecuta solo el archivo en el que estás.
```bash
npx vitest run src/orders/infrastructure/order-mapper.test.ts   # un archivo
npx vitest src/orders/ui/components/CancelDialog.test.tsx       # modo watch
npx vitest run -t "lo que se escribe es lo que se envía"        # un test por su nombre
npm run test:frontera                                           # adapters y kit de pruebas
npm run demo:tema17 && npm run demo:tema18 && npm run demo:tema19
```

**El kit de pruebas de la feature: `src/orders/testing/`.** Todo lo de esta tabla ya existe. Impórtalo con `import { … } from '../testing'`.

| Archivo | Qué te da | Lo usas en |
|---|---|---|
| `builders.ts` | `anOrder()`, `aLine()`, `anActor()`, `aDto()` y las madres con nombre: `anUrgentOrder()`, `aHugeOrder()`, `anOrderWithoutOwner()`, `aTrimmedDto()`, `anAdmin()`, `aManager()`, `anAgent()` | A, B, C |
| `doubles.ts` | Los cinco dobles escritos a mano: `aFixedClock()`, `anIdSequence()`, `aFailingGateway()`, `aRecordingPublisher()`, `aRecordingSink()`… | A, C |
| `fixtures.ts` | `SEED_DTOS` y `SEED_ORDERS_IN_DOMAIN`, importados de `server/store.mjs` (no copiados), y `USER_IDS` | A, C |
| `msw.ts` | `ordersServer()`, `failsWith()`, `respondsWithText()`, `respondsWithJson()`, `networkIsDown()`, `recordRequests()` | C |
| `render-orders.tsx` | `renderOrders(…)`: router + Composition Root en memoria + Provider + `user` de userEvent. Devuelve `{ user, adapters, module, notifications, url }` | B |
| `bff.ts` | `startBff(userId)`: levanta el BFF en un puerto libre y devuelve un `fetch` CON la cookie de sesión | C |
| `index.ts` | La API del kit. `bff.ts` **no** se exporta desde aquí a propósito: un test de pantalla no debe arrastrar Express | — |

**Y lo que ya había y hoy hace falta:**

| Archivo | Qué te da |
|---|---|
| `src/orders/infrastructure/order-dto.ts` | `OrderDto`, `DtoProblem`, `ORDER_STATUSES`, `CUSTOMER_TIERS`, `isText`, `isNumber`, `problemFor`, **`parseLine` ya escrito** y `describeProblem` |
| `src/orders/infrastructure/gateway-failure.ts` | `failureFor(status, body)` y `readBody(response)`: la tabla de errores del BFF (Sesión 6) |
| `src/orders/domain/result.ts` | `Result<T, E>`, `ok()`, `err()` |
| `src/orders/ui/approval-form.ts` | `parseApprovalForm`: devuelve TODOS los errores de campo a la vez |
| `shared/policy.json` | Los números compartidos entre el dominio y el BFF (Sesión 6) |

**Orden recomendado.** A → B → C. Si te atascas más de 5 minutos en un paso, pasa al siguiente y vuelve después. Las tres partes son independientes.

## Parte A · La frontera de los datos (15 min · 18:45 – 19:00)
Archivos: `src/orders/infrastructure/order-dto.ts`, `order-mapper.ts`, `http-order-gateway.ts`, `http-order-reader.ts`, `src/orders/domain/order.ts`, `src/orders/ui/orders-list-view-model.ts`, `components/OrdersFilters.tsx`, `OrdersListPage.tsx`.
Tests: `src/orders/testing/builders.test.ts` (5), `order-mapper.test.ts` (22), y un test omitido en `orders-list-view-model.test.ts` y otro en `OrdersListPage.test.tsx`.

1. Quita los `.skip` de esos cuatro archivos. Empieza por `builders.test.ts`: pasa sin tocar nada y te enseña el kit.
2. `parseOrderDto(raw)`: comprueba la forma de lo que llega y devuelve **solo** los campos conocidos.
3. `Order.ownerId` pasa a ser `string | null`, y `toOrder` deja de mentir: `dto.owner_id ?? null`.
4. `parseOrder(raw)` y `parseOrders(raw)`: validar y traducir, en un solo sitio.
5. Los adapters HTTP usan `parseOrder` / `parseOrders` y traducen un fallo de forma a `invalid` (gateway) o a `OrderReadError` (reader).
6. El view model: `canFilterByOwner` y un criterio que no se puede aplicar no se aplica. `OrdersFilters` no ofrece el filtro.
7. `npm test && npm run typecheck && npm run lint:arch` → verde.

> Después de este paso, entra otra vez como agente: el filtro «Solo míos» ya no está, y ya no hay forma de dejarse la lista vacía sin saber por qué.

### Pautas de la Parte A

**Paso 2 · `parseOrderDto(raw: unknown): Result<OrderDto, DtoProblem>`.** En este orden; el primer problema que encuentres, lo devuelves:

| Comprobación | Qué devolver si falla |
|---|---|
| `raw` es un objeto (ni `null`, ni un array, ni una cadena) | `{ field: '(raíz)', reason: raw === undefined ? 'missing' : 'type' }` |
| cada campo de `REQUIRED_TEXT` está y es texto | `problemFor(campo, source[campo])` (ya distingue `missing` de `type`) |
| cada campo de `OPTIONAL_TEXT`, **si está**, es texto | `{ field, reason: 'type' }` · «opcional» no quiere decir «lo que sea» |
| `ln_items` es un array | `problemFor('ln_items', source.ln_items)` |
| cada línea, con `parseLine(item, índice)` | lo que devuelva `parseLine` |
| `ord_st` y `cust_tier` son valores conocidos | `{ field, reason: 'value' }` |

- Devuelve un objeto **nuevo**, campo a campo. Nada de `{ ...source }`: un campo que el backend añada mañana no puede colarse en el dominio sin que nadie lo haya decidido (lista blanca, igual que en el BFF de la Sesión 6).
- `owner_id` y `cust_note` solo se incluyen si han llegado como texto: `...(isText(source.owner_id) ? { owner_id: source.owner_id } : {})`.

**Paso 3 · `ownerId: string | null`.** Cambia el tipo en `domain/order.ts`, pon `ownerId: dto.owner_id ?? null` en `toOrder` y quita el `as unknown as string` de `anOrderWithoutOwner` en `src/orders/testing/builders.ts`. `null` significa «el backend no me lo ha dicho»; `undefined` significa «se me ha olvidado», y son cosas distintas.

**Paso 4 · `parseOrder` y `parseOrders`.**
```ts
export function parseOrder(raw: unknown): Result<Order, DtoProblem> {
  const dto = parseOrderDto(raw);
  return dto.ok ? ok(toOrder(dto.value)) : err(dto.error);
}
```
`parseOrders` recorre el array con `entries()` y, si una fila falla, devuelve ese mismo problema con la posición delante: `` `[${index}].${problema.field}` ``. Una lista a medias con datos inventados es peor que un error.

**Paso 5 · Los adapters.**
```ts
// http-order-gateway.findById, después del 404 y del !response.ok
const order = parseOrder(await readBody(response));
if (!order.ok) throw new OrderGatewayError('invalid', describeProblem(order.error));
return order.value;
```
En `http-order-reader.findAll`, lo mismo con `parseOrders` y `OrderReadError`. Usa `readBody(response)` o `response.json().catch(() => null)`: un cuerpo que no es JSON es una respuesta previsible, no una excepción.

**Paso 6 · El filtro que no se puede aplicar.** En `buildOrdersListViewModel`: `canFilterByOwner: showAmounts`; si no se puede, el criterio se ignora (`const effective = showAmounts ? criteria : { ...criteria, onlyMine: false }`) y **todo** lo demás —filtrado, orden y `emptyMessage`— se calcula con `effective`. En las filas, un responsable desconocido se pinta `'—'`, no `'undefined'`. `OrdersFilters` recibe `canFilterByOwner` y no pinta la casilla.

**Trampas que hacen fallar un test:** devolver `{ ...source }` y dejar pasar campos nuevos; tratar un campo opcional con el tipo equivocado como si no hubiera llegado; usar `criteria` en vez de `effective` para `emptyMessage` (el mensaje dice «sin resultados para estos filtros» cuando no hay filtro); `dto.owner_id ?? ''` (una cadena vacía no es «no lo sé»); comprobar `ord_st` **antes** que las líneas (el orden de los errores está en los tests); olvidar quitar el `as unknown as string` del builder.

## Parte B · La pantalla, como se usa (15 min · 19:00 – 19:15)
Archivos: `src/orders/ui/components/CancelDialog.tsx` y `ApproveDialog.tsx`; `src/orders/ui/OrdersListPage.test.tsx`.
Tests: `CancelDialog.test.tsx` (8) y `ApproveDialog.test.tsx` (7).

1. Quita el `.skip` de los dos archivos y ejecútalos: **cuatro fallan en el primero y dos en el segundo**. No son tests mal escritos. Léelos.
2. `CancelDialog`: el texto se guarda tal cual mientras se escribe y se recorta **al enviar**; el foco entra en el campo al abrirse; el error queda atado al campo.
3. `ApproveDialog`: cada mensaje de error, atado a **su** campo (`aria-invalid` + `aria-describedby`), y el botón dice que está ocupado (`aria-busy`).
4. Migra el bloque «cancelar desde la lista» de `OrdersListPage.test.tsx` a `renderOrders` y `userEvent`, y añade una comprobación nueva: que el motivo llega al evento **tal y como se escribió**.
5. `npm run test:components && npm test` → verde.

> Los cuatro tests que fallan en `CancelDialog` fallan por el mismo motivo: `fireEvent.change` pone el valor entero de una vez, que es lo que pasa al **pegar**. `userEvent.type` escribe tecla a tecla, que es lo que pasa al **escribir**. Mira `examples/tema18/fire-vs-user.test.tsx`: son quince líneas.

### Pautas de la Parte B

**Paso 2 · `CancelDialog`.**
- `onChange={(e) => setReason(e.target.value)}` — sin `.trim()`. Recortar en cada pulsación se come los espacios **entre** palabras: «Cliente duplicado en el ERP» acaba siendo «ClienteduplicadoenelERP», pasa la validación de longitud y llega así al backend y a la analítica.
- El recorte va donde ya se sabe dónde terminan las palabras: `onConfirm(reason.trim())`.
- Foco al abrir: `const field = useRef<HTMLTextAreaElement>(null)` + `useEffect(() => { field.current?.focus(); }, [])` + `ref={field}`.
- Error atado: `aria-invalid={error !== null}` y `aria-describedby={error ? ERROR_ID : undefined}` en el `<textarea>`, con `<p id={ERROR_ID} role="alert">` para el mensaje. `role="alert"` lo anuncia cuando aparece; `aria-describedby` lo deja disponible cuando el foco vuelve al campo. Hacen falta los dos.

**Paso 3 · `ApproveDialog`.** Tres campos, tres identificadores:
```tsx
const ERROR_IDS = { note: 'aprobar-nota-error', confirmTotal: 'aprobar-revisado-error', channel: 'aprobar-canal-error' } as const;
<textarea aria-label="Justificación" aria-invalid={errors.note !== undefined} aria-describedby={errors.note ? ERROR_IDS.note : undefined} … />
{errors.note && <p id={ERROR_IDS.note} role="alert">{APPROVAL_FORM_MESSAGES[errors.note]}</p>}
```
Y `aria-busy={busy}` en el botón de confirmar, que ya está `disabled`.

**Paso 4 · Migrar el bloque.** `renderOrders` sustituye a `renderList` y devuelve `user` y `notifications` (un spy escrito a mano, en vez de `vi.fn()`):
```tsx
const { user, adapters, notifications } = renderOrders(
  ({ onNotify }) => <OrdersListPage actor={aManager()} onNotify={onNotify} />,
  { seed: SEED, extraRoutes: destination('/orders/:id', 'Detalle del pedido') },
);
await user.click(within(await rowOf('P-1')).getByRole('button', { name: 'Cancelar' }));
await user.type(screen.getByLabelText('Motivo'), 'Cliente duplicado en el ERP');
await user.click(screen.getByRole('button', { name: 'Confirmar' }));
await waitFor(() => expect(notifications).toEqual(['Pedido cancelado']));
expect(adapters.events.published[0]).toMatchObject({ reason: 'Cliente duplicado en el ERP' });
```
Cuidado: toda interacción de `userEvent` es `async`. Un `await` que falta se nota en forma de test intermitente, no de test rojo.

**Trampas que hacen fallar un test:** recortar en el `onChange` «solo los espacios del principio» (sigue comiéndose el que hay antes de cada palabra nueva); poner el `role="alert"` y olvidar el `aria-describedby` (el mensaje se anuncia una vez y después no existe para nadie); mover el foco en cada render en vez de al montar (`useEffect` sin `[]`); dejar `fireEvent` en el bloque migrado y preguntarse por qué sigue pasando.

## Parte C · La frontera con el backend (15 min · 19:15 – 19:30)
Archivos: `src/orders/infrastructure/order-gateway.contract.test.ts`, `order-gateway.contract.ts`, `in-memory-order-gateway.ts`, `shared/policy.json`, `src/orders/domain/cancellation-reason.ts`, `server/bff.mjs`.
Tests: `http-order-gateway.integration.test.ts` (16) y los 9 omitidos de `order-gateway.contract.test.ts`.

1. Quita los `.skip` de `http-order-gateway.integration.test.ts`: 16 tests con red simulada (MSW) que pasan **sin tocar nada**. Léelos: son la tabla de respuestas del BFF y lo que hacemos con cada una.
2. En `order-gateway.contract.test.ts`, sustituye la fábrica de `server/app.mjs` por una contra el BFF: `const { baseUrl, withSession, dispose } = await startBff(USER_IDS.admin)`.
3. Quita el `.skip` del bloque «adapter HTTP sin sesión» (3 tests). Pasan: el adapter ya traduce el 401.
4. Quita el `.skip` del bloque «lo que valida el backend» de `order-gateway.contract.ts`. Ahora fallan **dos tests, uno por cada implementación**, y entre los dos cuentan la historia entera.
5. Arréglalo donde toca: el número máximo del motivo es un dato del backend, así que va a `shared/policy.json` y lo leen el BFF, el dominio y el fake.
6. `npm run test:contract` → 26 casos en dos implementaciones + 3 sin sesión, todos en verde.

> El fake no mentía por maldad: le faltaba una regla que nadie le había contado, porque el contrato no preguntaba por ella. Un fake se mantiene fiel con un contrato, no con buena voluntad.

### Pautas de la Parte C

**Paso 2 · La fábrica contra el BFF.**
```ts
describeOrderGatewayContract('adapter HTTP + server/bff.mjs', async () => {
  const { baseUrl, withSession, dispose } = await startBff(USER_IDS.admin);
  return { gateway: createHttpOrderGateway(withSession, baseUrl), dispose };
});
```
La sesión es de **administrador** a propósito: así el contrato habla de lo que puede hacer el PUERTO y no de los permisos de un rol concreto. Los permisos por rol son del dominio y del BFF, y ya tienen sus tests (`npm run test:policy`, `npm run test:bff`). Borra el `import { createApp }` y el de `AddressInfo` cuando sobren: `npm run typecheck` te lo recordará.

**Paso 4 · Lo que falla, leído con calma.**

```
× fake en memoria       › un motivo más largo de 280 caracteres es invalid
                          → expected 'no-error' to be 'invalid'
× adapter HTTP + bff    › un motivo de la longitud máxima exacta sí se acepta
                          → HTTP 422 · invalid
```

- El primero dice que **el fake acepta lo que el backend rechaza**. El BFF responde 422 a un motivo demasiado largo desde la Sesión 6; el fake lo guarda tan contento. Todos los tests de caso de uso que usan el fake están demostrando un comportamiento que en producción no existe.
- El segundo dice algo peor: **el dominio y el backend llevan dos sesiones sin estar de acuerdo.** `REASON_MAX_LENGTH` vale 280 en `cancellation-reason.ts` y el BFF corta en 140. Un motivo de 200 caracteres pasa la validación del dominio, viaja por la red y vuelve con un error genérico que la persona usuaria no entiende.

Los dos se arreglan con el mismo cambio: un solo número, en un solo sitio.

**Paso 5 · El arreglo, en tres sitios y un dato.**
```jsonc
// shared/policy.json
"cancellation": { "managerLimit": 5000, "reasonMaxLength": 140 },
```
- `src/orders/domain/cancellation-reason.ts`: `export const REASON_MAX_LENGTH = policy.cancellation.reasonMaxLength;`
- `server/bff.mjs`, en `readCancelBody`: `reason.length > policy.cancellation.reasonMaxLength` en lugar del 140 escrito a mano.
- `src/orders/infrastructure/in-memory-order-gateway.ts`, al principio de `cancel`:
  ```ts
  const text = String(reason);
  if (text.trim().length < 3 || text.length > REASON_MAX_LENGTH) throw new OrderGatewayError('invalid');
  ```
Se comparte el **número**, no la implementación: cada lado aplica la regla con su código. Es lo mismo que se hizo en la Sesión 6 con los umbrales de importe, y lo vigila `npm run test:policy`.

**Trampas que hacen fallar un test:** dejar la fábrica de `app.mjs` además de la del BFF (el contrato pasa a comprobar también un backend que nadie usa, y el caso del 422 falla ahí); usar `fetch` en vez de `withSession` en la fábrica (todo responde 401); validar el motivo en el fake **después** de buscar el pedido (un motivo largo sobre un pedido que no existe debe ser `invalid`, no `not-found`); «arreglar» el contrato bajándole la exigencia en vez de arreglar el fake.

## Comprobación final
```bash
npm test                      # 623 en verde, 0 omitidos
npm run typecheck && npm run lint:arch && npm run lint:boundaries
npm run test:contract         # 2 implementaciones × 13 casos + 3 sin sesión
npm run test:policy           # el dominio y el BFF siguen de acuerdo
npm run build && npm run perf:budget   # DENTRO
npm run unused                # nada en src/
npm run mutate -- src/orders/infrastructure/order-dto.ts --tests "src/orders/infrastructure/order-mapper.test.ts"
                              # 94 %: 6 supervivientes, y los seis se pueden justificar
npm run dev                   # entra como u3 (agente): ya no hay filtro «Solo míos»
```

## Entrega
```bash
git add -A
git commit -m "feat(orders): validación en la frontera, tests de componente accesibles y contrato contra el BFF"
git push -u origin s8/<tu-nombre>
```
Abre el Pull Request y completa la checklist (incluye el bloque «Pruebas: datos, pantalla y frontera»). En el PR anota: el cambio de comportamiento del filtro «Solo míos»; el `as` que has quitado y qué protege ahora ese sitio; contra qué servidor se ejecuta el contrato y por qué; y el número máximo del motivo, antes y después.

## Ampliación (si terminas antes)
- `npm run mutate -- src/orders/infrastructure/order-dto.ts --tests "…"`: quedan 6 supervivientes. Para cada uno, decide si es un hueco de los tests o un **mutante equivalente** (no cambia ningún comportamiento observable) y escríbelo en el PR. Pista: tres están en el texto de `describeProblem` y dos en ramas a las que `parseLine` no puede llegar.
- `npm run test:weak`: 14 aserciones débiles y 6 `vi.mock`. Elige **una** de cada y sustitúyela por algo que compruebe de verdad. Los `vi.mock` que quedan están todos en tests de código heredado: ¿cuál desaparece solo cuando se borre `src/pages/OrderDetailPage.tsx`?
- Añade al contrato un caso tuyo: algo que el BFF haga y el fake no sepa. Si no encuentras ninguno, el fake es fiel, y eso también es un resultado que se escribe en el PR.
- `examples/tema18/queries.test.tsx`: busca en el repositorio un test que consulte por clase CSS o por estructura del HTML y reescríbelo por rol o por etiqueta.
- Hito del proyecto final: completa `docs/adr/006-estrategia-de-pruebas.md` y actualiza `docs/estrategia-testing.md` con la forma que tiene hoy tu suite (`npm run test:map`).
