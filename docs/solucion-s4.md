# Solución del ejercicio de la Sesión 4 (versión del profesor)

Repositorio de referencia: este mismo. Diferencias con el de prácticas:

| Archivo | Prácticas | Solución |
|---|---|---|
| `src/orders/application/cancel-order.ts` | Tipos y firma; «Por implementar» | Caso de uso completo |
| `src/orders/infrastructure/http-order-gateway.ts` | Firma; «Por implementar» | Adapter con normalización de errores |
| `src/orders/composition.ts` | `cancelOrder` «Por implementar» | `createCancelOrder({ orders: gateway, clock, events })` |
| `src/orders/ui/cancellation-messages.ts` | `satisfies Record<ReasonError \| CancellationDenied, …>` | `satisfies Record<CancelOrderError, …>` + 3 mensajes |
| `src/orders/ui/useCancelOrder.ts` | Firma; «Por implementar» | Hook adaptador |
| `src/pages/OrdersPage.tsx` | `handleCancel` con `doAction` y `trackEvent` | `useCancelOrder()` |
| `src/pages/cancel-order.test.tsx` | Aserción síncrona del aviso | `await waitFor(…)` |
| Tests (`.skip` / `{ skip: true }`) | 7 bloques omitidos | Todo activo |

## Parte A · paso a paso
```ts
export function createCancelOrder({ orders, clock, events }: CancelOrderDeps): CancelOrder {
  return async ({ orderId, reason: rawReason, actor }) => {
    const reason = createCancellationReason(rawReason);
    if (!reason.ok) return reason;                                   // 1 · sin E/S

    try {
      const order = await orders.findById(orderId);                  // 2 · estado actual
      if (order === null) return err('not-found');

      const decision = decideCancellation(order, actor, reason.value, clock.now()); // 3 · dominio
      if (!decision.ok) return decision;

      const { event } = decision.value;
      await orders.cancel({ orderId, reason: reason.value, cancelledBy: event.cancelledBy }); // 4
      await events.publish(event).catch(() => undefined);           // 5 · best effort
      return ok(decision.value.order);
    } catch (error) {
      if (error instanceof OrderGatewayError) return err(error.failure);
      throw error;                                                   // un bug no se disfraza
    }
  };
}
```
Puntos a comentar:
- **Validar antes de cualquier E/S.** El test lo comprueba con el registro de llamadas: `calls` vacío. Es barato y evita peticiones inútiles.
- **Decidir sobre el estado actual.** La pantalla puede mostrar un pedido pendiente que otra persona ya envió. El test «la regla se aplica al estado ACTUAL del backend» lo fija.
- **¿Por qué no comprobar el rol antes de `findById`?** `already-closed` depende del pedido, y adelantar solo una parte de la regla obliga a duplicarla. Coste aceptado: una lectura más cuando un agente lo intenta.
- **Errores por origen.** `ReasonError` (entrada), `CancellationDenied` (regla) y `GatewayFailure` (infraestructura normalizada). La pantalla los trata igual, pero los logs y las métricas no (Sesión 7).
- **`catch` selectivo.** Solo `OrderGatewayError` se convierte en `Result`. Un `TypeError` es un bug: convertirlo en «No hay conexión» lo esconde.
- **Publicar es best effort.** El backend ya canceló; devolver error mentiría a la persona usuaria. Contrapartida: el fallo se pierde (ampliación: puerto `Logger`).
- **Factory.** Las dependencias entran una vez (Composition Root) y el comando muchas veces.

Errores frecuentes:
- `new Date()` en el caso de uso → `npm run lint:arch` falla (regla nueva de la Sesión 4).
- Un `try/catch` que devuelve `err('unavailable')` para todo → falla el test del `TypeError`.
- Publicar antes de cancelar → falla el test del orden de efectos.
- Decidir con `checkCancellation` y construir el pedido y el evento a mano → se duplica la transición del dominio.

## Parte B · paso a paso
```ts
async function send(fetchFn: typeof fetch, url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetchFn(url, init);
  } catch {
    throw new OrderGatewayError('unavailable', `Sin respuesta del servidor (${url})`);
  }
}

function failureFor(response: Response): OrderGatewayError {
  if (response.status === 404) return new OrderGatewayError('not-found');
  if (response.status === 409) return new OrderGatewayError('conflict');
  return new OrderGatewayError('unavailable', `HTTP ${response.status}`);
}

export function createHttpOrderGateway(fetchFn: typeof fetch = fetch, baseUrl = '/api'): OrderGateway {
  return {
    async findById(id) {
      const response = await send(fetchFn, `${baseUrl}/orders/${encodeURIComponent(id)}`);
      if (response.status === 404) return null;
      if (!response.ok) throw failureFor(response);
      return toOrder(await response.json());
    },
    async cancel({ orderId, reason, cancelledBy }) {
      const response = await send(fetchFn, `${baseUrl}/orders/${encodeURIComponent(orderId)}/cancel`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-user-id': cancelledBy },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw failureFor(response);
    },
  };
}
```
Puntos a comentar:
- **`fetch` solo rechaza cuando no hay respuesta.** Un 404 o un 500 se resuelven con `response.ok === false` (MDN). Por eso hay dos caminos de error: `catch` de red y comprobación de `ok`.
- **404 no significa lo mismo en las dos operaciones.** En `findById`, la ausencia es un resultado (`null`). En `cancel`, es un comando que no se pudo ejecutar (`not-found`).
- **El contrato contra Express real** demuestra que el fake en memoria dice la verdad. Si un día el backend devuelve 422 en vez de 409, falla el contrato y no los 40 tests que usan el fake.
- **Un DTO con un estado desconocido sigue lanzando `Error`** (mapper de la Sesión 2). Un contrato roto con el backend no es «inténtalo luego»: es un bug que hay que ver (Sesión 8).

Errores frecuentes:
- Envolver todo `findById` en `try/catch` → el `OrderGatewayError('conflict')` acaba como `unavailable`. El contrato lo detecta.
- Comprobar solo `status === 500` → el 503 del test se escapa.
- Olvidar `content-type: application/json` → Express no rellena `req.body` y el motivo no llega al backend.

## Parte C · paso a paso
`composition.ts`:
```ts
cancelOrder: createCancelOrder({ orders: gateway, clock, events }),
```
`cancellation-messages.ts`:
```ts
  'not-found': 'Este pedido ya no existe',
  conflict: 'Otra persona ha cambiado este pedido. Recarga la lista y vuelve a intentarlo',
  unavailable: 'No hay conexión con el servidor. Inténtalo de nuevo en unos segundos',
} satisfies Record<CancelOrderError, string>;
```
`useCancelOrder.ts`:
```ts
export function useCancelOrder() {
  const { cancelOrder } = useOrdersModule();
  const [pending, setPending] = useState(false);
  const cancel = useCallback(async (command: CancelOrderCommand): Promise<CancelOutcome> => {
    setPending(true);
    try {
      const result = await cancelOrder(command);
      return result.ok ? { ok: true } : { ok: false, message: CANCELLATION_MESSAGES[result.error] };
    } catch {
      return { ok: false, message: UNEXPECTED_ERROR };
    } finally {
      setPending(false);
    }
  }, [cancelOrder]);
  return { cancel, pending };
}
```
`OrdersPage.tsx`:
```ts
const { cancel, pending: cancelling } = useCancelOrder();

const handleCancel = async () => {
  if (!reasonFor) return;
  const outcome = await cancel({ orderId: reasonFor.ord_id, reason, actor });
  if (!outcome.ok) {
    alert(outcome.message);
    return;
  }
  updateOrder({ ...reasonFor, ord_st: 'cancelled' }, reasonFor.total);
  setToast('Pedido cancelado');
  setReasonFor(null);
  setReason('');
};
// <button onClick={handleCancel} disabled={saving || cancelling}>Confirmar</button>
```
`cancel-order.test.tsx` (Sesión 3, Parte A):
```ts
await waitFor(() => expect(alert).toHaveBeenCalledWith('El motivo debe tener al menos 10 caracteres'));
```
Puntos a comentar:
- **El test de la Sesión 3 no estaba mal: estaba acoplado a la sincronía.** El comportamiento (aviso y ninguna llamada a la API) es el mismo; ahora llega un instante después. Se cambia cómo espera, no qué comprueba.
- **`satisfies` como guía.** Al ampliar la unión de errores, el compilador lista los mensajes que faltan. Ningún código llega a la pantalla sin texto.
- **Los tests son otro Composition Root.** `createOrdersModule(createInMemoryAdapters(…))` en el test; `createHttpAdapters(fetch)` en `main.tsx`. El caso de uso no cambia.
- **El hook no decide nada.** Traduce `Result` a `{ ok, message }` y gestiona `pending`. Si aparece un `if (role === …)` en el hook, la regla se ha escapado del dominio.
- **Puente temporal**: `{ ...reasonFor, ord_st: 'cancelled' }` actualiza la lista heredada sin recargarla. Desaparece al migrar la lista (Sesión 5).

## Verificación
```bash
npm test                 # 36 archivos · 160 tests en verde
npm run typecheck && npm run lint:arch && npm run lint:boundaries
npm run test:contract    # 14 tests: 7 contra el fake y 7 contra Express
```
