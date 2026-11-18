# Solución del ejercicio de la Sesión 6 (versión del profesor)

Repositorio de referencia: este mismo. Diferencias con el de prácticas:

| Archivo | Prácticas | Solución |
|---|---|---|
| `server/bff.mjs` | Rutas montadas; cuatro funciones «Por implementar» | `actorOf`, `readCancelBody`, `denyReason` y `visibleFor` completas |
| `src/orders/ui/approval-form.ts` | Tipos y constantes; «Por implementar» | `parseApprovalForm` (unas 20 líneas) |
| `src/orders/infrastructure/gateway-failure.ts` | Tipo del envoltorio y `readBody` | Dos tablas y `failureFor` |
| `src/session/http-session-gateway.ts` | «Por implementar» | `signIn` y `me` con la cookie |
| `src/orders/ui/useApproveOrder.ts`, `OrdersListPage.tsx` | Versión de la Sesión 5 | `retryable` y diálogo de aprobación |
| `src/shared/config.ts`, `.env` (`VITE_ANALYTICS_KEY`) | Presentes | Borrados |
| `src/hooks/useCurrentUser.ts`, `src/shell/session.ts` | Presentes | Borrados (los sustituye `src/session/`) |
| `src/services/api.ts` | `x-user-id` desde `localStorage` + `alert` | `withCredentials`, sin identidad y sin `alert` |
| `src/pages/OrderDetailPage.tsx` | `dangerouslySetInnerHTML` | La nota se pinta como texto |
| `src/store/appStore.tsx` | `user` y `toast` | Solo `toast` |
| Tests (`.skip`) | 8 bloques omitidos (61 tests) | Todo activo |

## Parte A · paso a paso
```js
const actorOf = (req) => {
  const claims = readSessionToken(readCookie(req.header('cookie'), COOKIE), { now: now(), secret });
  return claims ? { id: claims.sub, role: claims.role } : null;
};

function readCancelBody(body) {
  if (body === undefined || body === null) return { error: 'invalid-body' };
  if (Object.keys(body).some((key) => key !== 'reason')) return { error: 'invalid-body' };
  const reason = body.reason;
  if (typeof reason !== 'string' || reason.trim().length < 3 || reason.length > 140) return { error: 'invalid-body' };
  return { value: { reason: reason.trim() } };
}

export function denyReason(action, order, actor) {
  if (actor.role === 'agent') return 'forbidden';
  if (action === 'approve') {
    if (order.ord_st !== 'pending') return 'conflict';
    if (order.ln_items.length === 0 || order.ln_items.some((line) => line.qty <= 0)) return 'invalid-lines';
    if (totalOf(order) > policy.approval.adminFrom && actor.role !== 'admin') return 'forbidden';
    return null;
  }
  if (action === 'cancel') {
    if (order.ord_st === 'shipped' || order.ord_st === 'cancelled') return 'conflict';
    if (actor.role === 'admin') return null;
    if (order.ord_st !== 'pending') return 'forbidden';
    return totalOf(order) < policy.cancellation.managerLimit ? null : 'forbidden';
  }
  return actor.role === 'admin' || actor.role === 'manager' ? null : 'forbidden';
}

function visibleFor(order, actor) {
  const { cancel_rsn: _omit, ...rest } = order;
  if (actor.role !== 'agent') return rest;
  return { ...rest, owner_id: undefined, ln_items: [] };
}
```
Puntos a comentar:
- **La identidad se lee, no se recibe.** `readSessionToken` compara la firma en tiempo constante (`timingSafeEqual`) y comprueba la caducidad. Una cookie con el payload cambiado y la firma antigua no pasa: es el test «una cookie manipulada».
- **403 y 409 no son lo mismo.** «No puedes» frente a «ya no se puede». El cliente trata el 409 recargando y el 403 no: reintentar no cambia un permiso.
- **El orden importa**: primero el cuerpo (422), luego la existencia (404), luego el permiso (403/409). Un 404 antes del 403 cuenta qué pedidos existen a quien no debería saberlo.
- **Lo que no se puede ver, no viaja.** En la Sesión 5 el agente veía `total: null` en la pantalla, pero el importe llegaba al navegador. Hoy sale del servidor recortado: `ln_items: []`. Se comprueba en la pestaña Red, no en el código.
- **El error es un código y nada más.** Sin rutas, sin stack, sin el mensaje del backend. El texto que lee la persona usuaria lo pone el cliente (`approval-messages.ts`).

Trampas previstas:
- Leer el actor de `req.header('x-user-id')` «porque los tests antiguos lo usaban» → el test de la cabecera falla.
- Devolver `403` cuando el pedido ya está aprobado → falla «da 409, no 403».
- `Object.assign(order, …)` en `visibleFor` → muta el almacén y el siguiente test ve datos recortados.
- Validar el motivo con `body.reason?.length > 3` sin `trim()` → tres espacios pasan.
- Aceptar campos de más («ya los ignoro») → falla el test del cuerpo con `ord_st`.

## Parte B · paso a paso
```ts
export function parseApprovalForm(input: ApprovalFormInput, context: ApprovalFormContext): Result<ApprovalDraft, ApprovalFormErrors> {
  const errors: ApprovalFormErrors = {};
  const note = noteError(input.note, context);
  if (note) errors.note = note;
  if (context.requiresJustification && !input.confirmTotal) errors.confirmTotal = 'confirm-required';
  if (!(APPROVAL_CHANNELS as string[]).includes(input.channel)) errors.channel = 'channel-unknown';
  if (Object.keys(errors).length > 0) return err(errors);
  const trimmed = input.note.trim();
  return ok({ note: trimmed === '' ? null : trimmed, channel: input.channel as ApprovalChannel });
}
```
```ts
const BY_CODE: Record<string, GatewayFailure> = { 'no-session': 'forbidden', forbidden: 'forbidden', 'invalid-lines': 'invalid', 'invalid-body': 'invalid', 'not-found': 'not-found', conflict: 'conflict' };
const BY_STATUS: Record<number, GatewayFailure> = { 400: 'invalid', 401: 'forbidden', 403: 'forbidden', 404: 'not-found', 409: 'conflict', 422: 'invalid' };

export function failureFor(status: number, body: unknown): GatewayFailure {
  const code = (body as ErrorEnvelope | null)?.error?.code;
  if (typeof code === 'string' && code in BY_CODE) return BY_CODE[code];
  return BY_STATUS[status] ?? 'unavailable';
}
```
Puntos a comentar:
- **Todos los errores a la vez.** Un formulario que corrige de uno en uno se abandona. Son tres `if` y un objeto, no una cadena de `return`.
- **La regla es del dominio, el formulario solo pregunta.** `needsJustification(order)` vive en `domain/approval.ts`; `parseApprovalForm` recibe el resultado. Y `approveOrder` lo vuelve a comprobar: el formulario ayuda, el caso de uso protege (defensa en profundidad).
- **La nota no viaja al evento.** `OrderApproved` lleva `channel` y `hasNote`, no el texto. Lo comprueba un test que busca la frase escrita en el JSON publicado.
- **Una tabla en vez de una escalera.** Añadir un código del BFF es una línea. Y `401 → forbidden`: una sesión caducada no es «no hay servidor».
- **`retryable` no es decoración.** Solo se ofrece reintentar lo que puede salir distinto: red o conflicto. Un botón «Reintentar» tras un 403 enseña a la gente a aporrear el botón.

Trampas previstas:
- `if (errors.note) return err(errors)` dentro de cada comprobación → solo sale el primer error; falla «los DOS errores a la vez».
- Contar la longitud de la nota sin `trim()` → nueve caracteres entre espacios pasan.
- `BY_STATUS[status] ?? BY_CODE[code]` (al revés) → un 409 con código `conflict` acierta por casualidad, pero un 401 `no-session` acaba en `unavailable`.
- Confiar en que `body.error.code` existe → un 502 con HTML de un proxy rompe el adapter.
- Abrir el diálogo para todos los pedidos → falla «un pedido corriente se aprueba de un clic».

## Parte C · paso a paso
```ts
export function createHttpSessionGateway(fetchFn: typeof fetch = fetch, baseUrl = '/api'): SessionGateway {
  const read = async (response: Response) => (response.ok ? toSessionUser(await response.json()) : null);
  return {
    async signIn(userId) {
      try {
        return await read(await fetchFn(`${baseUrl}/session`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) }));
      } catch { return null; }
    },
    async me() {
      try { return await read(await fetchFn(`${baseUrl}/me`, { credentials: 'include' })); } catch { return null; }
    },
  };
}
```
Los diez hallazgos y dónde se arregla cada uno:

| Hallazgo | Archivo | Solución |
|---|---|---|
| Clave de analítica en el bundle (×2: `VITE_` y literal) | `src/shared/config.ts`, `.env` | Se borran: la analítica la firma el BFF, que es quien tiene la clave |
| Identidad en `x-user-id` (×2) | `src/orders/infrastructure/http-order-gateway.ts` | `credentials: 'include'`; la cookie dice quién eres |
| Identidad en `x-user-id` + `localStorage` | `src/services/api.ts` | `withCredentials: true` y fuera la cabecera (y fuera el `alert`) |
| `userId` en `localStorage` (×2) | `src/hooks/useCurrentUser.ts` | El archivo desaparece: lo sustituye `src/session/SessionProvider.tsx` |
| `userId` en la analítica | `src/shared/utils.ts` | `trackEvent` acepta solo campos de la lista blanca |
| Nota pintada como HTML | `src/pages/OrderDetailPage.tsx` | `{order.cust_note}`: React escapa por defecto |

Puntos a comentar:
- **La cookie `HttpOnly` no es magia, es un límite.** El token sigue existiendo; lo que cambia es quién puede leerlo. `document.cookie` no lo ve, así que un script de terceros comprometido tampoco.
- **`SameSite=Strict`** evita que la cookie viaje en peticiones que nacen en otro sitio: es la mitad de la defensa contra CSRF, y la que no cuesta nada.
- **Fail closed en todas partes.** Sin red, sin sesión; rol desconocido, sin sesión; token caducado, sin sesión. El estado «cargando» es distinto de «sin permiso» (Sesión 5) y por eso `SessionProvider` empieza en `loading`.
- **La sesión es un slice, no un campo del store.** Tiene puerto, adapter, fake y Provider, y el store global se queda solo con el aviso. Dos sesiones seguidas de limpieza: S5 sacó `orders` y `filters`; S6 saca `user`.
- **Dos implementaciones de la misma regla se separan solas.** Por eso los umbrales viven en `shared/policy.json` y `npm run test:policy` compara 21 combinaciones de pedido y rol entre el dominio y el BFF.
- **El detector no mira los tests.** Un test puede nombrar `x-user-id` para comprobar que NO se envía. Lo que se audita es lo que se publica.

Trampas previstas:
- Guardar el usuario devuelto por `me()` en `localStorage` «para no pedirlo otra vez» → falla «el navegador no guarda nada».
- Dejar `credentials` por defecto: la cookie no viaja y todo responde 401.
- Lanzar en `me()` cuando no hay sesión → la aplicación se queda en blanco en vez de enseñar la barra de entrada.
- Borrar `src/shell/session.ts` sin migrar `AppRoutes`, `OrderDetailPage` y `DashboardPage` → no compila; es el orden que marca `npm run typecheck`.
- Sanear la nota con un `replace` de `<script>` en vez de pintarla como texto → quedan `onerror`, `javascript:` y veinte formas más.

## Verificación
```bash
npm test                 # 67 archivos · 372 tests en verde
npm run typecheck && npm run lint:arch && npm run lint:boundaries
npm run test:bff         # 15 tests contra el BFF por HTTP
npm run test:policy      # el dominio y el BFF deciden lo mismo
npm run audit:secrets    # Sin hallazgos en src/.
npm run unused           # ningún archivo de src/ sin usar
```
Comprobación manual con `npm run dev`:
1. Entra como **Iris (agente)**: la lista no trae importes. Pestaña Red → `/api/orders` → `ln_items: []`.
2. En la consola: `await (await fetch('/api/orders/P-1001/approve', { method: 'POST', credentials: 'include', headers: { 'x-user-id': 'u1' } })).json()` → `{ error: { code: 'forbidden' } }`.
3. `document.cookie` → cadena vacía: la sesión está ahí, pero no para el JavaScript de la página.
4. Abre `/orders/P-1002`: la nota se lee `Entregar <b>antes</b> del viernes`, con las marcas a la vista. Eso es exactamente lo que queremos.
