# Solución del ejercicio de la Sesión 5 (versión del profesor)

Repositorio de referencia: este mismo. Diferencias con el de prácticas:

| Archivo | Prácticas | Solución |
|---|---|---|
| `src/orders/ui/orders-list-view-model.ts` | Tipos y etiquetas; «Por implementar» | View model completo (unas 45 líneas nuevas) |
| `src/orders/ui/orders-criteria.ts` | Tipos y valores por defecto; «Por implementar» | `parseCriteria` y `writeCriteria` |
| `src/orders/ui/useOrdersCriteria.ts` | «Por implementar» | Hook sobre `useSearchParams` |
| `src/orders/ui/useOrdersList.ts` | «Por implementar» | Hook de datos con reducer |
| `src/shell/AppRoutes.tsx` | Rutas heredadas, sin permisos ni 404 | Lista nueva, dos guards y 404 |
| `src/pages/OrdersPage.tsx`, `OrdersPage.test.tsx`, su snapshot, `cancel-order-flow.test.tsx` | Presentes | Borrados |
| `src/hooks/useOrders.ts`, `src/components/OrderRow.tsx`, `src/shared/mappers.ts` | Presentes | Borrados |
| `src/pages/cancel-order.test.tsx` | Bloque «Parte A» (Sesión 3) sobre la lista heredada | Bloque retirado |
| `src/store/appStore.tsx`, `src/shared/types.ts` | `orders`, `filters`, `selectedOrderId`… | Solo `user` y `toast` |
| `package.json` | `lodash`, `@types/lodash` | Desinstalados |
| Tests (`.skip`) | 6 bloques omitidos (55 tests) | Todo activo |

## Parte A · paso a paso
```ts
const COMPARATORS: Record<SortKey, (a: Order, b: Order) => number> = {
  date: (a, b) => a.createdAt.localeCompare(b.createdAt),
  total: (a, b) => calculateTotal(a) - calculateTotal(b),
  customer: (a, b) => a.customerName.localeCompare(b.customerName, 'es'),
};

function matches(criteria: OrdersCriteria, actor: Actor | null) {
  const text = criteria.text.trim().toLowerCase();
  return (order: Order): boolean =>
    (text === '' || order.customerName.toLowerCase().includes(text) || order.id.toLowerCase().includes(text)) &&
    (criteria.status === 'all' || order.status === criteria.status) &&
    (!criteria.onlyMine || order.ownerId === actor?.id);
}

function summarize(visible: Order[], actor: Actor | null, showAmounts: boolean): string {
  const pending = visible.filter((order) => order.status === 'pending');
  const urgent = pending.filter(isUrgent).length;
  return [
    showAmounts ? `${pending.length} pendientes por ${formatCurrency(pendingExposure(visible))}` : `${pending.length} pendientes`,
    urgent > 0 ? `${urgent} urgentes` : null,
    actor?.role === 'admin' && needsCreditReview(visible) ? 'Revisar riesgo de crédito' : null,
  ].filter(Boolean).join(' · ');
}

export function buildOrdersListViewModel(orders: readonly Order[], criteria: OrdersCriteria, actor: Actor | null): OrdersListViewModel {
  const visible = orders.filter(matches(criteria, actor)).sort(COMPARATORS[criteria.sort]);
  const showAmounts = canSeeAmounts(actor);
  const filtered = criteria.text.trim() !== '' || criteria.status !== 'all' || criteria.onlyMine;
  return {
    summary: summarize(visible, actor, showAmounts),
    showAmounts,
    rows: visible.map((order) => ({
      id: order.id,
      customer: order.customerName,
      date: formatDate(order.createdAt),
      owner: showAmounts ? (order.ownerId === actor?.id ? 'Yo' : order.ownerId) : null,
      statusLabel: STATUS_LABELS[order.status],
      tone: isUrgent(order) ? 'urgent' : order.status === 'cancelled' ? 'muted' : 'normal',
      total: showAmounts ? formatCurrency(calculateTotal(order)) : null,
      canApprove: canApprove(order, actor),
      canCancel: canCancel(order, actor),
    })),
    emptyMessage: visible.length > 0 ? null : filtered ? 'Sin resultados para estos filtros' : 'Todavía no hay pedidos',
  };
}
```
Puntos a comentar:
- **Se calcula, no se guarda.** Los Efectos 3 y 4 de `OrdersPage` guardaban la lista filtrada y los contadores en `useState` y los sincronizaban con `useEffect`: cuatro estados y dos efectos que ahora son una función.
- **El view model no decide reglas.** `canApprove`, `canCancel`, `isUrgent`, `needsCreditReview` y `canSeeAmounts` vienen del dominio. Si aparece `actor.role === 'manager' && total > 10000`, la regla se ha duplicado.
- **Lo único que decide es presentación**: que el aviso de riesgo lo vea solo un admin, que el responsable propio se llame «Yo», el texto del estado.
- **`filter` ya devuelve una copia**: por eso `.sort()` detrás no muta la entrada. `orders.sort(…)` ni compila (`readonly Order[]`) ni pasa el test (`Object.freeze`).
- **Un dato que no se puede ver no viaja.** Para un agente, `total` es `null`. Ocultar la columna y dejar el importe en las props lo deja a un clic de React DevTools. (La autorización real es del backend: Sesión 6.)

Trampas previstas:
- Ordenar por importe sobre el texto formateado → `'14.520,00 €' < '248,29 €'`. Falla «por importe: como número».
- `a.customerName > b.customerName ? 1 : -1` → «Árboles» queda el último (U+00C1 va después de la Z). Falla «orden alfabético en español».
- Contar pendientes sobre `orders` en vez de sobre lo filtrado → falla «cuenta los pendientes de lo que se ve».
- `criteria.text !== ''` para decidir el mensaje de vacío → falla el caso de solo espacios.
- Pintar el importe en el resumen del agente → falla `not.toMatch(/€/)`.

## Parte B · paso a paso
```ts
const STATUSES: OrdersCriteria['status'][] = ['all', 'pending', 'approved', 'shipped', 'cancelled'];
const SORTS: SortKey[] = ['date', 'total', 'customer'];
const oneOf = <T extends string>(value: string | null, allowed: T[], fallback: T): T =>
  (allowed as string[]).includes(value ?? '') ? (value as T) : fallback;

export function parseCriteria(params: URLSearchParams): OrdersCriteria {
  return {
    text: params.get('q') ?? '',
    status: oneOf(params.get('status'), STATUSES, DEFAULT_CRITERIA.status),
    onlyMine: params.get('mine') === '1',
    sort: oneOf(params.get('sort'), SORTS, DEFAULT_CRITERIA.sort),
  };
}

export function writeCriteria(criteria: OrdersCriteria, base: URLSearchParams = new URLSearchParams()): URLSearchParams {
  const params = new URLSearchParams(base);
  const set = (key: string, value: string, isDefault: boolean) => (isDefault ? params.delete(key) : params.set(key, value));
  set('q', criteria.text, criteria.text === DEFAULT_CRITERIA.text);
  set('status', criteria.status, criteria.status === DEFAULT_CRITERIA.status);
  set('mine', '1', !criteria.onlyMine);
  set('sort', criteria.sort, criteria.sort === DEFAULT_CRITERIA.sort);
  return params;
}
```
```ts
export function useOrdersCriteria(): [OrdersCriteria, (patch: Partial<OrdersCriteria>) => void] {
  const [params, setParams] = useSearchParams();
  const criteria = useMemo(() => parseCriteria(params), [params]);
  const update = useCallback(
    (patch: Partial<OrdersCriteria>) => {
      setParams((current) => writeCriteria({ ...parseCriteria(current), ...patch }, current), { replace: true });
    },
    [setParams],
  );
  return [criteria, update];
}
```
Puntos a comentar:
- **La URL es una entrada externa**, como un DTO: se valida al leerla. `?status=borrado` vuelve a `all`; no llega un valor imposible al view model.
- **Puro por un lado, hook por otro.** Trece tests: nueve sin React (`parse`/`write`) y cuatro con `MemoryRouter`. El hook no tiene `useState`: el estado es la URL.
- **`new URLSearchParams(base)` copia**: se conservan los parámetros ajenos (`debug=1`) y no se muta lo recibido.
- **Valores por defecto fuera de la URL**: `/` y `/?status=all&sort=date` serían dos URLs para la misma pantalla.
- **`replace: true`**: buscar «hotel» no debe dejar cinco entradas en el historial. Contrapartida: Atrás no deshace un cambio de filtro. Si producto lo quiere, `replace` solo para `text`.

Trampas previstas:
- `params.get('q')?.trim()` → el campo se pinta desde la URL: al escribir «hotel » el espacio desaparece y no se puede teclear «hotel brisa». Falla «conserva el texto».
- `params.get('status') as Status` sin validar → falla «un valor desconocido».
- `setParams({ q: … })` (objeto nuevo) → se pierden `debug` y el resto de criterios. Falla «conserva el resto».
- `Boolean(params.get('mine'))` → `mine=si` y `mine=0` darían `true`.

## Parte C · paso a paso
`useOrdersList.ts`:
```ts
export function useOrdersList(): { state: OrdersListState; reload: () => void } {
  const { listOrders } = useOrdersModule();
  const [state, dispatch] = useReducer(ordersListReducer, INITIAL_ORDERS_LIST);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    listOrders().then(
      (orders) => active && dispatch({ type: 'loaded', orders }),
      () => active && dispatch({ type: 'failed' }),
    );
    return () => { active = false; };
  }, [listOrders, attempt]);

  const reload = useCallback(() => {
    dispatch({ type: 'reload' });
    setAttempt((current) => current + 1);
  }, []);

  return { state, reload };
}
```
`AppRoutes.tsx`:
```tsx
<Routes>
  <Route path="/" element={<RequireAccess session={session} can={canViewOrders}>{(actor) => <OrdersListPage actor={actor} onNotify={onNotify} />}</RequireAccess>} />
  <Route path="/orders/:id" element={<OrderDetailPage />} />
  <Route path="/dashboard" element={<RequireAccess session={session} can={canViewDashboard}>{() => <DashboardPage />}</RequireAccess>} />
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```
Retirada:
```bash
git rm src/pages/OrdersPage.tsx src/pages/OrdersPage.test.tsx src/pages/__snapshots__/OrdersPage.test.tsx.snap \
       src/pages/cancel-order-flow.test.tsx
npm run unused            # → src/components/OrderRow.tsx · src/hooks/useOrders.ts · src/shared/mappers.ts
git rm src/components/OrderRow.tsx src/hooks/useOrders.ts src/shared/mappers.ts
npm uninstall lodash @types/lodash
```
- `src/pages/cancel-order.test.tsx`: se borra el bloque «Parte A» y la ruta `/` del `renderAt`.
- `src/store/appStore.tsx`: quedan `user`/`setUser` y `toast`/`setToast`.
- `src/shared/types.ts`: salen `Filters` y los campos de vista (`total`, `isUrgent`, `selected`, `rowColor`) que añadía `mapOrderForTable`.

Qué test sustituye a cada test borrado (para el Pull Request):

| Test borrado | Comportamiento | Lo protege ahora |
|---|---|---|
| `OrdersPage.test.tsx` · «pinta la fila urgente» | Fila urgente, columna de total, botones | `orders-list-view-model.test.ts` · «tono» y «las acciones salen de las reglas del dominio» |
| `OrdersPage.test.tsx` · «coincide con la instantánea» | Ninguno concreto: fijaba el HTML | Nada. Se borra sin sustituto (ver punto a comentar) |
| `cancel-order.test.tsx` · «Parte A» (Sesión 3) | Un motivo de espacios no se acepta | `OrdersListPage.test.tsx` · «un motivo de espacios no es un motivo» |
| `cancel-order-flow.test.tsx` · «cancela en el backend…» (Sesión 4) | Cancelar usa el caso de uso y publica el evento | `OrdersListPage.test.tsx` · «cancela con el caso de uso, avisa…» |
| `cancel-order-flow.test.tsx` · «si el pedido ya se cerró…» | Decide el estado actual del backend | `OrdersListPage.test.tsx` · «si el pedido se cerró en el backend…» |

Puntos a comentar:
- **`active` y la condición de carrera.** Cada ejecución del efecto tiene su propio `active`. Al recargar, la limpieza desactiva la petición anterior: si su respuesta llega tarde, se ignora. Es el patrón de react.dev («Fetching data»). Sin él, falla «una respuesta antigua que llega tarde».
- **`reload` no vuelve a «Cargando…»** si ya hay datos: el reducer marca `refreshing`. Si `reload` hiciera `setState('loading')`, la tabla parpadearía tras cada cancelación.
- **Recargar en vez de parchear.** En la Sesión 4 la pantalla hacía `{ ...reasonFor, ord_st: 'cancelled' }`: la UI repetía la transición del dominio. Ahora el servidor es la fuente de verdad. Coste aceptado: una lectura más.
- **El guard distingue «cargando» de «sin permiso».** Con `user === null` para los dos casos, un manager que abre `/dashboard` vería «No autorizado» un instante. El test «mientras la sesión carga» lo fija.
- **El contenido protegido no se monta.** `children` es una función: `DashboardPage` no se crea (ni pide datos) si no hay permiso. Y recibe un `Actor` que no puede ser `null`.
- **El snapshot se borra sin sustituto.** No protegía un comportamiento: se rompía con cualquier cambio de marcado y nadie sabía si el cambio era correcto. Un test se borra cuando lo que protege está protegido en otro nivel, o cuando no protegía nada.
- **Lo que queda en el store es lo global de verdad**: sesión y aviso. `orders` era estado de servidor de una pantalla; `filters`, estado de URL; `selectedOrderId` no lo leía nadie.

Trampas previstas:
- Sin limpieza del efecto → la respuesta antigua pisa a la nueva.
- `reload` recreado en cada render → falla «reload es estable».
- `<RequireAccess …><DashboardPage /></RequireAccess>` (hijo como elemento) → no compila: el guard pide una función.
- Olvidar `path="*"` → una URL desconocida deja la pantalla en blanco.
- Borrar `OrdersPage.tsx` y dejar `useOrders.ts`, `OrderRow.tsx` y `mappers.ts`: compila, pero es código muerto. `npm run unused` lo lista.

## Verificación
```bash
npm test                 # 53 archivos · 272 tests en verde
npm run typecheck && npm run lint:arch && npm run lint:boundaries
npm run state            # OrdersListPage.tsx: 3 useState · 0 useEffect (OrdersPage.tsx: 9 · 4)
npm run rules            # 23 → 5 candidatos a reglas fuera del dominio
npm run unused           # ningún archivo de src/ sin usar
npm run deps             # lodash ya no aparece
```
Comprobación manual con `npm run dev`:
1. `http://localhost:5173/?status=pending&mine=1` → lista filtrada. Recargar la conserva.
2. Consola: `localStorage.setItem('userId', 'u3')` y recargar → sin importes; `/dashboard` → «No tienes acceso».
3. `http://localhost:5173/facturas` → «Página no encontrada».
