# Ejercicio Sesión 6 · El servidor decide: sesión firmada, autorización real y datos que no se filtran

**Duración:** 45 minutos (18:45 – 19:30) · **Corrección:** 15 minutos (19:30 – 19:45)
**Avance del proyecto final:** BFF con Node, formulario con esquema, errores por origen y seguridad del cliente.

```bash
git checkout -b s6/<tu-nombre>
npm install
npm test            # 310 tests en verde y 56 omitidos (skipped): 8 bloques que activarás tú
npm run audit:secrets   # 4 hallazgos en src/. Ese es el punto de partida.
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

## Parte C · Nada que no deba salir del navegador (15 min · 19:15 – 19:30)
Archivos: `src/session/http-session-gateway.ts` y el código heredado que `npm run audit:secrets` señala.
Tests: `http-session-gateway.test.ts` (6), `session.test.tsx` (5) y `security.test.ts` (6).

1. Quita `.skip` en los tres archivos de test.
2. Implementa `createHttpSessionGateway`: `signIn` y `me` contra el BFF, con la cookie (`credentials: 'include'`), sin guardar nada y devolviendo `null` cuando no hay sesión (fail closed).
3. Arregla los cuatro hallazgos de `npm run audit:secrets`. Para cada uno, decide **dónde** va la solución:
   la clave de analítica, la identidad en `x-user-id`, el identificador en `localStorage` y la nota pintada como HTML.
4. Cambia `src/main.tsx` para componer también la sesión, y retira lo que ya no use nadie (`npm run unused`).
5. Comprobación final:
   ```bash
   npm test && npm run typecheck && npm run lint:arch && npm run lint:boundaries
   npm run audit:secrets    # Sin hallazgos en src/.
   npm run unused           # ningún archivo de src/ sin usar
   npm run dev              # entra como Iris (agente) y mira la pestaña Red: ¿llegan importes?
   ```

## Entrega
```bash
git add -A
git commit -m "feat(security): sesión firmada en el BFF, autorización real y formulario de aprobación"
git push -u origin s6/<tu-nombre>
```
Abre el Pull Request y completa la checklist de la plantilla (incluye el bloque «Node, errores y seguridad»).

## Ampliación (si terminas antes)
- Con la aplicación arrancada, entra como Iris y ejecuta en la consola: `await fetch('/api/orders/P-1001/approve', { method: 'POST', credentials: 'include', headers: { 'x-user-id': 'u1' } })`. ¿Qué responde? ¿Y antes de hoy?
- El BFF acepta cualquier cuerpo en `/api/orders/:id/approve`. Añade la nota de justificación al contrato: valida, guárdala y **no** la devuelvas en el listado.
- Una sesión caduca en 60 minutos (`shared/policy.json`). ¿Qué ve la persona usuaria cuando caduca mientras trabaja? Escribe el test y decide el comportamiento.
- Con el prompt P3 de `prompts/sesion-6.md`, pide a Copilot una revisión de seguridad del diff y comprueba cuántos de los cuatro hallazgos habría encontrado solo.
- Hito del proyecto final: completa `docs/adr/004-bff-sesion-y-seguridad.md` y la tabla «Mi mapa de confianza» de `docs/arquitectura-objetivo.md`.
