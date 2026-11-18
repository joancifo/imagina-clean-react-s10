# Ejercicio Sesión 6 · El servidor decide: sesión firmada, autorización real y datos que no se filtran

**Duración:** 45 minutos (18:45 – 19:30) · **Corrección:** 15 minutos (19:30 – 19:45)
**Avance del proyecto final:** BFF con Node, formulario con esquema, errores por origen y seguridad del cliente.

```bash
git checkout -b s6/<tu-nombre>
npm install
npm test                # 312 tests en verde y 61 omitidos (skipped): 8 bloques que activarás tú
npm run audit:secrets   # 10 hallazgos en 6 archivos. Ese es el punto de partida.
```

## Contexto
La Sesión 5 dejó la lista nueva funcionando y un comentario en `src/orders/domain/permissions.ts`:
«esto es autorización **visual**; la real la hace el backend». Hoy se hace de verdad.

Hoy el backend heredado (`server/app.mjs`) **cree lo que le diga el navegador**: la identidad viaja en la cabecera
`x-user-id`, que escribe el cliente leyéndola de `localStorage`. Con la consola abierta, un agente se convierte en
administrador en dos líneas. Además, el bundle lleva una clave de analítica y el detalle pinta como HTML una nota
escrita por otra persona.

```
navegador                     BFF (Node)                         API heredada
  cookie HttpOnly  ──────▶  quién eres (sesión firmada)  ─────▶  estados y datos
  formulario       ──────▶  qué mandas (esquema)
  pantalla         ◀──────  qué puedes ver (recorte por rol)
```

**Ya está escrito** (léelo antes de empezar): `server/session.mjs` (firma y lectura del token), `server/store.mjs`
(datos y transiciones), `shared/policy.json` (umbrales compartidos), `src/orders/ui/components/ApproveDialog.tsx`,
`src/session/SessionProvider.tsx`, `src/session/in-memory-session-gateway.ts` y `src/session/SignInBar.tsx`.

Como en la Sesión 5: **la especificación son los tests**, y en cada parte hay casos pensados para que la primera
solución que se te ocurra falle.

## Antes de empezar (5 minutos de lectura que ahorran 20)

**Cómo trabajar con los tests.** No lances toda la batería cada vez: ejecuta solo el archivo en el que estás.
```bash
npx vitest run server/bff.test.mjs                 # un archivo
npx vitest server/bff.test.mjs                     # modo watch: se relanza al guardar
npx vitest run -t "da 409, no 403"                 # un solo test por su nombre
```
Cuando un test falle, **lee su nombre y su `expect`** antes de tocar el código: el nombre dice la regla de negocio.

**Mapa de lo que ya existe y para qué te sirve.**

| Archivo | Qué te da | Lo usas en |
|---|---|---|
| `shared/policy.json` | `approval.adminFrom` (10 000), `cancellation.managerLimit` (5 000), `session.cookieName` | Parte A |
| `server/session.mjs` | `readCookie(cabecera, nombre)` → el token o `null`; `readSessionToken(token, { now, secret })` → `{ sub, role }` o `null` si la firma no cuadra o ha caducado | Parte A |
| `server/bff.mjs` | Las rutas ya montadas, `totalOf(order)` (total con descuento e IVA), `fail(res, status, code)` y la constante `COOKIE` | Parte A |
| `src/orders/domain/approval.ts` | `needsJustification(order)`, `APPROVAL_CHANNELS`, el evento `OrderApproved` (ya lleva `hasNote`, no la nota) | Parte B |
| `src/orders/ui/approval-form.ts` | Tipos, `MIN_NOTE` (10), `MAX_NOTE` (140), `EMPTY_APPROVAL_FORM`, los códigos de error de campo | Parte B |
| `src/orders/ui/components/ApproveDialog.tsx` | El diálogo ya pintado: recibe `values`, `errors`, `onChange(parche)`, `onConfirm`, `onClose` | Parte B |
| `src/session/port.ts` + `SessionProvider.tsx` | El puerto `SessionGateway` (`signIn`, `me`) y el Provider con `useSession()` y el estado `loading` / `ready` | Parte C |
| `src/session/index.ts` | La API pública del slice Sesión: importa siempre desde `'../session'`, no desde archivos internos | Parte C |

**Los datos del BFF vienen con nombres del backend heredado** (no del dominio): `ord_st` (estado), `ln_items` (líneas, cada una con `qty` y `unit_prc`), `owner_id` (responsable), `cancel_rsn` (motivo de cancelación). Usuarios de prueba: `u1` admin, `u2` manager, `u3` agente (Iris).

**Orden recomendado.** A → B → C, en el orden de cada lista. Si te atascas más de 5 minutos en una función, pasa a la siguiente y vuelve después: las tres partes son independientes salvo en `http-order-gateway.ts` (ver Parte C).

## Parte A · El BFF decide quién eres y si puedes (15 min · 18:45 – 19:00)
Archivo: `server/bff.mjs` (las rutas ya están montadas; faltan cuatro funciones). Tests: `server/bff.test.mjs` (15).

1. Quita `.skip` del `describe` exterior de `server/bff.test.mjs` y de `src/orders/policy.contract.test.ts`.
2. Implementa, en este orden:
   - `actorOf(req)`: el actor sale **solo** de la cookie firmada (`readCookie` + `readSessionToken`). Nunca de una cabecera.
   - `readCancelBody(body)`: lista blanca de campos y motivo entre 3 y 140 caracteres, ya recortado.
   - `denyReason(action, order, actor)`: autorización real con los umbrales de `shared/policy.json`. Devuelve `null`, `'forbidden'`, `'conflict'` o `'invalid-lines'`.
   - `visibleFor(order, actor)`: un agente no recibe importes ni responsable.
3. `npm run test:bff && npm run test:policy` → verde.

> El 403 y el 409 no son lo mismo: «no puedes» y «ya no se puede». Quien recibe un 409 vuelve a intentarlo tras recargar; quien recibe un 403, no.

### Pautas de la Parte A

> En `server/bff.test.mjs` hay **tres** `describe.skip` (identidad, autorización real, entrada y salida). Quítalos todos.
> Lee primero la ruta `app.post('/api/orders/:id/:action(...)')`: ahí ves en qué orden se llaman tus funciones
> (primero el cuerpo → 422, luego si existe → 404, luego el permiso → 403/409) y qué hace la ruta con lo que devuelves.

**`actorOf(req)`** · una sola línea útil.
- La cabecera de cookies se lee con `req.header('cookie')`. Pásala a `readCookie(…, COOKIE)` para sacar el token.
- Pasa el token a `readSessionToken(token, { now: now(), secret })`. Ojo: `now` es **una función** (el test la cambia para simular el paso del tiempo), así que hay que llamarla.
- Si devuelve `null` (sin cookie, firma manipulada o caducada) → `null`. Si no → `{ id: claims.sub, role: claims.role }`.
- No mires `x-user-id` en ningún caso, ni «como plan B»: hay un test que lo envía y espera 401.

**`readCancelBody(body)`** · devuelve `{ value: { reason } }` o `{ error: 'invalid-body' }`.
- `body` puede llegar `undefined` o `null`: compruébalo antes de nada.
- Lista blanca: si `Object.keys(body)` contiene **cualquier** clave distinta de `reason` → error. No basta con ignorar las demás.
- `reason` tiene que ser `string`. La longitud mínima (3) se mide **después** de `trim()` (tres espacios no son un motivo); la máxima es 140.
- Devuelve el motivo **ya recortado**.

**`denyReason(action, order, actor)`** · escribe las reglas en este orden; la primera que aplique decide.

| Acción | Regla | Resultado |
|---|---|---|
| cualquiera | el actor es `agent` | `'forbidden'` |
| `approve` | `ord_st` no es `'pending'` | `'conflict'` |
| `approve` | sin líneas o alguna línea con `qty <= 0` | `'invalid-lines'` |
| `approve` | `totalOf(order) > policy.approval.adminFrom` y el actor no es `admin` | `'forbidden'` |
| `approve` | en otro caso | `null` |
| `cancel` | `ord_st` es `'shipped'` o `'cancelled'` | `'conflict'` |
| `cancel` | el actor es `admin` | `null` |
| `cancel` | `ord_st` no es `'pending'` (manager) | `'forbidden'` |
| `cancel` | `totalOf(order) < policy.cancellation.managerLimit` | `null`; si no, `'forbidden'` |
| `ship` | `admin` o `manager` | `null`; si no, `'forbidden'` |

- Los números salen **siempre** de `policy` (ya importado arriba), nunca escritos a mano: `test:policy` compara 21 combinaciones con el dominio.
- Fíjate en `>` frente a `<`: copia los mismos que usa el dominio (`src/orders/domain/approval.ts` y `cancellation.ts`).
- «Ya está aprobado» es `'conflict'` (409), no `'forbidden'` (403): hay un test exactamente para eso.

**`visibleFor(order, actor)`** · nunca modifiques `order`: es el objeto del almacén.
- Para **todos** los roles: quita `cancel_rsn`. Truco: `const { cancel_rsn: _omit, ...rest } = order;`
- Si el actor no es `agent` → devuelve `rest`.
- Si es `agent` → devuelve una copia con `owner_id: undefined` y `ln_items: []` (sin líneas no hay importes que calcular).
- `Object.assign(order, …)` o `order.ln_items = []` rompen el siguiente test, porque recortan el almacén compartido.

**Trampas que hacen fallar un test:** leer `x-user-id`; devolver 403 para un pedido ya aprobado; validar `reason.length` sin `trim()`; ignorar campos de más en vez de rechazarlos; mutar el pedido en `visibleFor`.

## Parte B · El formulario y los errores del servidor (15 min · 19:00 – 19:15)
Archivos: `src/orders/ui/approval-form.ts`, `src/orders/infrastructure/gateway-failure.ts`,
`src/orders/ui/useApproveOrder.ts` y `src/orders/ui/OrdersListPage.tsx`.
Tests: `approval-form.test.ts` (10), `gateway-failure.test.ts` (5), `approve-dialog-flow.test.tsx` (7) y un test de `OrdersListPage.test.tsx`.

1. Quita `.skip` en esos cuatro archivos (en `OrdersListPage.test.tsx` es un único `it.skip`).
2. `parseApprovalForm`: devuelve **todos** los errores de campo a la vez y un borrador ya limpio.
3. `failureFor(status, body)`: tabla, no escalera de `if`. Manda el código del cuerpo; el estado HTTP es el plan B.
4. `useApproveOrder`: el resultado dice además si el fallo **se puede reintentar**.
5. `OrdersListPage`: un pedido urgente abre `ApproveDialog`; el resto se aprueba de un clic. Quién es urgente lo decide el dominio (`needsJustification`).
6. `npm test && npm run lint:arch` → verde.

> Recuerda: la justificación es texto escrito por una persona. Mira qué lleva el evento que se publica.

### Pautas de la Parte B

> `approval-form.test.ts` tiene **dos** `describe.skip` y `approve-dialog-flow.test.tsx` tiene **tres**. Quítalos todos.
> Haz los pasos en el orden de la lista: 2 y 3 son funciones puras (rápidas); 4 y 5 las usan.

**Paso 2 · `parseApprovalForm(input, context)`** · devuelve `ok(borrador)` o `err(errores)`.
- Patrón: crea `const errors: ApprovalFormErrors = {}`, comprueba **cada campo** rellenando `errors.note`, `errors.confirmTotal`, `errors.channel`, y solo al final: si `Object.keys(errors).length > 0` → `err(errors)`. Nunca un `return` dentro de cada comprobación (saldría solo el primer error).
- Nota (puede ayudarte una función auxiliar `noteError(note, context)`):
  - Más de `MAX_NOTE` caracteres → `'note-too-long'`, **haga falta justificación o no**.
  - Si `context.requiresJustification`: vacía (tras `trim()`) → `'note-required'`; menos de `MIN_NOTE` caracteres útiles (tras `trim()`) → `'note-too-short'`.
- `confirmTotal`: solo obligatorio con `requiresJustification` → `'confirm-required'`.
- `channel`: tiene que estar en `APPROVAL_CHANNELS` → si no, `'channel-unknown'`. (TypeScript pedirá un cast: `(APPROVAL_CHANNELS as string[]).includes(…)`).
- Borrador limpio: `{ note: notaRecortada || null, channel }`. Una nota vacía o solo espacios es `null`, no `''`.
- El formulario **no decide** quién necesita justificación: lo recibe en `context`. No importes `needsJustification` aquí.

**Paso 3 · `failureFor(status, body)`** · dos objetos y tres líneas.
- Define dos tablas fuera de la función:
  - `BY_CODE` (código del BFF → fallo): `no-session`→`forbidden`, `forbidden`→`forbidden`, `invalid-lines`→`invalid`, `invalid-body`→`invalid`, `not-found`→`not-found`, `conflict`→`conflict`.
  - `BY_STATUS` (estado HTTP → fallo): `400`→`invalid`, `401`→`forbidden`, `403`→`forbidden`, `404`→`not-found`, `409`→`conflict`, `422`→`invalid`.
- Lee el código **sin fiarte del cuerpo**: `(body as ErrorEnvelope | null)?.error?.code`. Puede ser `null`, una cadena HTML de un proxy o cualquier cosa.
- Si el código es un `string` y está en `BY_CODE` → úsalo. Si no → `BY_STATUS[status] ?? 'unavailable'`. Ese orden, no al revés.

**Paso 4 · `useApproveOrder`** · un campo nuevo, `retryable: boolean`, solo en el caso de fallo.
- Amplía el tipo `ApproveOutcome` con `retryable` en la rama `{ ok: false }`.
- Fallo del caso de uso: `retryable` es `true` solo si `result.error === 'unavailable'` (no hay servidor). `forbidden`, `conflict`… → `false`.
- En el `catch` (error inesperado) → `retryable: true`.

**Paso 5 · `OrdersListPage`** · el cambio más largo. Divide `handleApprove` en tres funciones:
1. **Estado nuevo** (tres `useState`): el pedido que se está justificando (`approveTarget: string | null`), los valores del formulario (`form`, empieza en `EMPTY_APPROVAL_FORM`) y sus errores (`formErrors`, empieza en `{}`). Cambia `error` a `{ message, retryable } | null`.
2. **`startApproval(orderId)`** (lo que recibe `OrdersTable` en `onApprove`): busca el pedido en `state.orders`; si `needsJustification(order)` → reinicia `form` y `formErrors` y fija `approveTarget`. Si no → `runApproval(orderId)` directamente (un clic, sin diálogo).
3. **`runApproval(orderId, draft?)`**: lo que antes hacía `handleApprove`, pero pasando `draft` al comando (`approve({ orderId, actor, draft })` — `ApproveOrderCommand` ya lo acepta). En éxito, cierra el diálogo (`setApproveTarget(null)`).
4. **`confirmApproval()`** (el `onConfirm` del diálogo): `parseApprovalForm(form, { requiresJustification: true })`. Si falla → guarda los errores y **no** llama a nadie; si va bien → `runApproval(approveTarget, parsed.value)`.
5. **JSX**: pinta `<ApproveDialog>` cuando hay `approveTarget` (mira sus `Props`: el `onChange` recibe un parche → `setForm((actual) => ({ ...actual, ...parche }))`; el `total` sale de la fila del view model). En el aviso de error, añade `<button onClick={reload}>Reintentar</button>` solo si `error.retryable`. A `CancelDialog` pásale `error?.message ?? null`.

- **El evento**: no tienes que tocar el dominio. `OrderApproved` ya lleva `channel` y `hasNote`; el test comprueba que el texto de la nota no aparece en el JSON publicado. Basta con no añadir la nota a ningún otro sitio (evento, aviso, analítica).

**Trampas que hacen fallar un test:** devolver el primer error en lugar de todos; medir la nota sin `trim()`; mirar el estado HTTP antes que el código; suponer que `body.error.code` existe; abrir el diálogo para todos los pedidos; ofrecer «Reintentar» tras un 403.

## Parte C · Nada que no deba salir del navegador (15 min · 19:15 – 19:30)
Archivos: `src/session/http-session-gateway.ts` y el código heredado que `npm run audit:secrets` señala.
Tests: `http-session-gateway.test.ts` (6), `session.test.tsx` (5) y `security.test.ts` (6).

1. Quita `.skip` en los tres archivos de test.
2. Implementa `createHttpSessionGateway`: `signIn` y `me` contra el BFF, con la cookie (`credentials: 'include'`), sin guardar nada y devolviendo `null` cuando no hay sesión (fail closed).
3. Arregla los **10 hallazgos** de `npm run audit:secrets` (6 archivos). Para cada uno, decide **dónde** va la solución:
   la clave de analítica del bundle, la identidad en `x-user-id` (cliente heredado y adapter), el identificador en `localStorage` y la nota pintada como HTML.
   Al migrar la sesión: `src/shell/session.ts` y `src/hooks/useCurrentUser.ts` desaparecen; el store global se queda solo con el aviso.
4. Cambia `src/main.tsx` para componer también la sesión, y retira lo que ya no use nadie (`npm run unused`).
5. Comprobación final:
   ```bash
   npm test && npm run typecheck && npm run lint:arch && npm run lint:boundaries
   npm run audit:secrets    # Sin hallazgos en src/.
   npm run unused           # ningún archivo de src/ sin usar
   npm run dev              # entra como Iris (agente) y mira la pestaña Red: ¿llegan importes?
   ```

### Pautas de la Parte C

**Paso 2 · `createHttpSessionGateway(fetchFn, baseUrl)`** · ya tienes `toSessionUser(dto)` en el mismo archivo: convierte la respuesta del BFF en `SessionUser` y devuelve `null` si el rol no es uno que el dominio conozca.
- `signIn(userId)`: `POST ${baseUrl}/session`, cabecera `content-type: application/json`, cuerpo `JSON.stringify({ userId })`, `credentials: 'include'`.
- `me()`: `GET ${baseUrl}/me` con `credentials: 'include'`.
- Las dos comparten la misma lectura: si `response.ok` → `toSessionUser(await response.json())`; si no (401…) → `null`. Sácala a una función `read(response)`.
- Envuelve cada llamada en `try { … } catch { return null; }`: sin red tampoco hay sesión. **Nunca** lances una excepción: la aplicación se quedaría en blanco en vez de enseñar la barra de entrada.
- No guardes nada (ni `localStorage`, ni `sessionStorage`, ni una variable fuera de las funciones): la sesión vive en la cookie y la pide `SessionProvider` cada vez.

**Paso 3 · Los 10 hallazgos, archivo por archivo.** Ejecuta `npm run audit:secrets`: cada línea dice archivo, línea y tipo de problema.

| Archivo | Hallazgos | Qué hacer |
|---|---|---|
| `src/shared/config.ts` | 2 (clave `VITE_` y literal `ak_live_…`) | Borra el archivo entero y la variable `VITE_ANALYTICS_KEY` de `.env`. Una clave en el navegador no es secreta: la firma el BFF. Quita también su `import` en `utils.ts` |
| `src/shared/utils.ts` | 1 (`localStorage` en `trackEvent`) | `trackEvent` deja de enviar `user` y `key`: solo `sendLog({ level: 'info', name, payload })`. Tipa `payload` con los campos que el BFF acepta: `{ id?, by?, code?, total?, at? }` |
| `src/services/api.ts` | 2 (`x-user-id` y `localStorage`) | `axios.create({ baseURL: '/api', withCredentials: true })` y fuera la cabecera. Quita el `try/catch` con `alert`: que el error llegue a quien llama |
| `src/orders/infrastructure/http-order-gateway.ts` | 2 (`x-user-id` en `cancel` y `approve`) | Cambia la cabecera por `credentials: 'include'` (también en `findById`). Ver nota abajo |
| `src/hooks/useCurrentUser.ts` | 2 (`localStorage`) | Borra el archivo: lo sustituye `useSession()` de `src/session` |
| `src/pages/OrderDetailPage.tsx` | 1 (`dangerouslySetInnerHTML`) | `<p className="note">{order.cust_note}</p>`. React escapa el texto por defecto. No intentes «sanear» con `replace` |

**Nota sobre `http-order-gateway.ts`** (no está en la lista de arriba, pero te la pedirán los tests):
- Su test, `http-order-gateway.test.ts`, también tiene un `describe.skip('adapter HTTP · sesión y errores del BFF (Sesión 6)')`. Quítalo.
- Ese archivo tiene además un test **antiguo** que espera `x-user-id`: contradice al nuevo. Bórralo y anota en el PR que lo sustituye «envía POST /orders/:id/cancel … con la cookie y SIN x-user-id».
- Su `failureFor(response)` local solo distinguía 404/409. Sustitúyelo por el de la Parte B: importa `failureFor` y `readBody` de `./gateway-failure` y crea `new OrderGatewayError(failureFor(response.status, await readBody(response)), …)`. Como `readBody` es asíncrono, los `throw` pasan a ser `throw await …`.
- `cancelledBy` y `approvedBy` dejan de usarse en el adapter: quien eres lo dice la cookie.

**Migrar la sesión (sigue los errores de `npm run typecheck`).** Al borrar `src/shell/session.ts` y `src/hooks/useCurrentUser.ts`, se rompen sus usuarios. Arréglalos en este orden:
1. `src/shell/AppRoutes.tsx` y `src/shell/RequireAccess.tsx`: `import type { Session } from '../session'`.
2. `src/App.tsx`: `useSession` desde `'./session'`; el nombre de la cabecera sale de la sesión (`session.status === 'ready' ? session.name ?? 'Sin sesión' : '...'`); pinta `<SignInBar />` encima de las rutas.
3. `src/pages/DashboardPage.tsx` y `src/pages/OrderDetailPage.tsx`: `const session = useSession(); const actor = session.status === 'ready' ? session.actor : null;` en lugar de `toActor(user)`.
4. `src/store/appStore.tsx`: quita `user` y `setUser`. Queda solo `toast`.
5. Tests que usaban el store para «sembrar» al usuario (`cancel-order.test.tsx`, `AppRoutes.test.tsx`, `RequireAccess.test.tsx`): envuélvelos en `<SessionProvider gateway={createInMemorySessionGateway({ id, role })}>` y cambia el import de `Session`. El tipo `Session` lleva ahora `name`: añade `name: null` donde construyas una a mano.
6. `eslint.boundaries.js` y `src/orders/boundaries.test.ts` listan la carpeta `src/hooks`, que ya no existe: cámbiala por `src/session` (es código que usa Pedidos desde fuera, así que le aplica la misma regla).

**Paso 4 · `src/main.tsx`.** Crea el gateway con el mismo `fetchFn` que Pedidos y envuelve la aplicación:
```
<BrowserRouter>
  <SessionProvider gateway={createHttpSessionGateway(fetchFn)}>
    <AppStoreProvider> <OrdersProvider …> <App /> … </AppStoreProvider>
  </SessionProvider>
</BrowserRouter>
```
`SessionProvider` va por fuera porque `App` (y las rutas) leen la sesión.

**Trampas que hacen fallar un test:** guardar el usuario de `me()` en `localStorage` «para no pedirlo otra vez»; dejar `credentials` por defecto (la cookie no viaja y todo es 401); lanzar en `me()` cuando no hay sesión; borrar `shell/session.ts` antes de migrar a sus usuarios (no compila: déjate guiar por `typecheck`).

**Comprobación manual con `npm run dev`:**
1. Entra como **Iris (agente)**. Pestaña Red → `/api/orders` → `ln_items: []`: el importe ni siquiera llega.
2. En la consola, `document.cookie` → cadena vacía: la sesión existe, pero el JavaScript de la página no la ve (`HttpOnly`).
3. Abre `/orders/P-1002`: la nota se lee `Entregar <b>antes</b> del viernes`, con las marcas a la vista. Es lo correcto.

## Entrega
```bash
git add -A
git commit -m "feat(security): sesión firmada en el BFF, autorización real y formulario de aprobación"
git push -u origin s6/<tu-nombre>
```
Abre el Pull Request y completa la checklist de la plantilla (incluye el bloque «Node, errores y seguridad»).

> En el PR, anota cada test que hayas borrado y qué test lo sustituye (como en la Sesión 5). Como mínimo: el test de
> `http-order-gateway.test.ts` que esperaba `x-user-id`.

## Ampliación (si terminas antes)
- Con la aplicación arrancada, entra como Iris y ejecuta en la consola: `await fetch('/api/orders/P-1001/approve', { method: 'POST', credentials: 'include', headers: { 'x-user-id': 'u1' } })`. ¿Qué responde? ¿Y antes de hoy?
- El BFF acepta cualquier cuerpo en `/api/orders/:id/approve`. Añade la nota de justificación al contrato: valida, guárdala y **no** la devuelvas en el listado.
- Una sesión caduca en 60 minutos (`shared/policy.json`). ¿Qué ve la persona usuaria cuando caduca mientras trabaja? Escribe el test y decide el comportamiento.
- Con el prompt P3 de `prompts/sesion-6.md`, pide a Copilot una revisión de seguridad del diff y comprueba cuántos de los diez hallazgos habría encontrado solo.
- Hito del proyecto final: completa `docs/adr/004-bff-sesion-y-seguridad.md` y la tabla «Mi mapa de confianza» de `docs/arquitectura-objetivo.md`.
