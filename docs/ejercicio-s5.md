# Ejercicio Sesión 5 · La lista de pedidos, migrada a la capa de presentación

**Duración:** 45 minutos (18:45 – 19:30) · **Corrección:** 15 minutos (19:30 – 19:45)
**Avance del proyecto final:** view model, estado de URL, hook de datos, rutas con permisos y retirada de la pantalla heredada.

```bash
git checkout -b s5/<tu-nombre>
npm install
npm test        # 222 tests en verde y 55 omitidos (skipped): 6 bloques que activarás tú
npm run state   # OrdersPage.tsx: 9 useState y 4 useEffect. Ese es el punto de partida.
```

## Contexto
`src/pages/OrdersPage.tsx` (200 líneas) guarda nueve estados y los sincroniza con efectos (eran cinco; el del aviso ya está en `src/shell/ToastHost.tsx`): filtros en `localStorage` y en el store global, lista filtrada y contadores recalculados con `useEffect`, permisos decididos en el JSX y un `handleApprove` de 37 líneas con `fetch`.

Objetivo: una pantalla nueva en `src/orders/ui` donde cada tipo de estado vive en su sitio y el JSX solo pinta.

```
URL ─────────────▶ useOrdersCriteria (B) ─┐
caso de uso ─────▶ useOrdersList (C) ─────┼─▶ buildOrdersListViewModel (A) ─▶ OrdersFilters · OrdersTable · CancelDialog
actor (props) ────────────────────────────┘                                   (presentacionales, ya escritos)
src/shell/AppRoutes.tsx (C): URL ─▶ permiso (dominio) ─▶ pantalla
```

| Tipo de estado | Dónde vivía (heredado) | Dónde vive ahora | Parte |
|---|---|---|---|
| Derivado (lista filtrada, contadores, permisos de fila) | `useState` + `useEffect` | Se **calcula** en cada render: `buildOrdersListViewModel` | A |
| De URL (búsqueda, estado, «solo míos», orden) | `localStorage` + store global | La URL: `useOrdersCriteria` | B |
| De servidor (pedidos) | store global + `fetch` | `useOrdersList` (reducer + caso de uso) | C |
| Local de UI (diálogo abierto, modo compacto) | `useState` | `useState` en `OrdersListPage` (ya escrito) | — |
| Global (sesión, aviso) | store global | store global (lo único que se queda) | C |

**Ya está escrito** (léelo antes de empezar): `OrdersListPage.tsx` (contenedor), `components/` (presentacionales), `orders-list-state.ts` (reducer), `useApproveOrder.ts`, `domain/approval.ts`, `domain/permissions.ts` y `src/shell/` (guard, 403, 404, aviso).

**La especificación son los tests**, y en cada parte hay al menos un caso pensado para que la primera solución que se te ocurra falle. Los pasos de abajo te llevan test a test; los avisos **⚠** señalan esas trampas.

### Cómo trabajar test a test
Ejecuta solo el archivo en el que estás, y si quieres solo un grupo (`-t` filtra por nombre del `describe`/`it`):
```bash
npx vitest src/orders/ui/orders-list-view-model.test.ts              # modo watch: se relanza al guardar
npx vitest src/orders/ui/orders-list-view-model.test.ts -t "filtrar"  # solo el grupo «filtrar»
```

### Tipos que vas a manejar
```ts
// domain/order.ts
type Order = { id; customerName; customerTier; status: 'pending' | 'approved' | 'shipped' | 'cancelled'; ownerId; createdAt /* ISO */; lines };
// domain/cancellation.ts
type Actor = { id: string; role: 'admin' | 'manager' | 'agent' };
// ui/orders-criteria.ts
type OrdersCriteria = { text: string; status: OrderStatus | 'all'; onlyMine: boolean; sort: 'date' | 'total' | 'customer' };
const DEFAULT_CRITERIA = { text: '', status: 'all', onlyMine: false, sort: 'date' };
```

---

## Parte A · View model de la lista (15 min · 18:45 – 19:00)
Archivo: `src/orders/ui/orders-list-view-model.ts` (tipos y etiquetas ya escritos). Test: `orders-list-view-model.test.ts` (19 tests).

**Idea clave:** es una función pura `(pedidos, criterios, actor) → datos listos para pintar`. Sustituye a los cuatro estados y dos efectos de la pantalla heredada. No guarda nada, no importa React y **no decide reglas de negocio**: las pregunta al dominio.

### A.0 · Prepara el archivo
1. En `orders-list-view-model.test.ts` quita `.skip` del `describe` exterior (línea 32). Ahora fallan los 19 tests: es lo esperado.
2. Añade los imports que ya te indica el comentario del archivo:
   ```ts
   import { canApprove } from '../domain/approval';
   import { canCancel } from '../domain/cancellation';
   import { needsCreditReview, pendingExposure } from '../domain/credit-risk';
   import { calculateTotal, isUrgent } from '../domain/order';
   import { canSeeAmounts } from '../domain/permissions';
   import { formatCurrency, formatDate } from './formatters';
   import type { SortKey } from './orders-criteria';
   ```
3. Sustituye el cuerpo de `buildOrdersListViewModel` por este esqueleto, que iremos rellenando:
   ```ts
   export function buildOrdersListViewModel(orders: readonly Order[], criteria: OrdersCriteria, actor: Actor | null): OrdersListViewModel {
     const visible = orders.filter(matches(criteria, actor)).sort(COMPARATORS[criteria.sort]); // A.1 y A.2
     const showAmounts = canSeeAmounts(actor);
     return {
       summary: summarize(visible, actor, showAmounts), // A.4
       showAmounts,
       rows: visible.map((order) => toRow(order, actor, showAmounts)), // A.3
       emptyMessage: null, // A.5
     };
   }
   ```

### A.1 · Filtrar → grupo «filtrar» (4 tests)
Escribe una función que recibe los criterios y devuelve el predicado para `filter`:
```ts
function matches(criteria: OrdersCriteria, actor: Actor | null) {
  const text = criteria.text.trim().toLowerCase();
  return (order: Order): boolean =>
    (text === '' || /* el nombre del cliente O el id contienen `text` (en minúsculas) */) &&
    (criteria.status === 'all' || /* ¿mismo estado? */) &&
    (!criteria.onlyMine || /* ¿el responsable es el actor? */);
}
```
- El texto se compara **sin mayúsculas** y **sin espacios en los extremos** (por eso `trim().toLowerCase()` una sola vez, fuera del predicado).
- «Solo míos» compara `order.ownerId` con `actor?.id` (el actor puede ser `null`).

### A.2 · Ordenar → grupo «ordenar» (4 tests)
Un comparador por cada `SortKey`. Con `Record<SortKey, …>` TypeScript te obliga a cubrir los tres:
```ts
const COMPARATORS: Record<SortKey, (a: Order, b: Order) => number> = {
  date: (a, b) => a.createdAt.localeCompare(b.createdAt), // ISO 8601 se ordena bien como texto
  total: (a, b) => /* ... */,
  customer: (a, b) => /* ... */,
};
```
- ⚠ **Importe:** ordena por el **número** (`calculateTotal`), nunca por el texto formateado: `'14.520,00 €' < '248,29 €'` como texto.
- ⚠ **Cliente:** `a > b ? 1 : -1` deja «Árboles» al final (la `Á` va después de la `Z` en Unicode). Usa `localeCompare(…, 'es')`.
- ⚠ **No mutar:** `orders.sort()` ni compila (`readonly`) ni pasa el test (`Object.freeze`). `filter` ya devuelve una copia, así que `.filter(…).sort(…)` es seguro.

### A.3 · Cada fila → grupo «filas listas para pintar» (5 tests)
```ts
function toRow(order: Order, actor: Actor | null, showAmounts: boolean): OrderRowViewModel {
  return {
    id: order.id,
    customer: order.customerName,
    date: formatDate(order.createdAt),
    owner: showAmounts ? /* 'Yo' si es el actor; si no, order.ownerId */ : null,
    statusLabel: STATUS_LABELS[order.status],
    tone: /* 'urgent' si isUrgent(order) · 'muted' si está cancelado · 'normal' en otro caso */,
    total: showAmounts ? formatCurrency(calculateTotal(order)) : null,
    canApprove: canApprove(order, actor),
    canCancel: canCancel(order, actor),
  };
}
```
- `canApprove` / `canCancel` / `isUrgent` / `canSeeAmounts` **ya son reglas del dominio**. Si te ves escribiendo `actor.role === 'manager' && total > …`, estás duplicando una regla.
- ⚠ **Un agente no recibe importes:** no basta con ocultar la columna; `total` y `owner` deben ser `null` para que el dato no llegue al componente (ni a React DevTools).

### A.4 · Resumen → grupo «resumen» (3 tests)
Formato esperado (las partes se unen con `' · '` y las que no aplican no aparecen):
```
4 pendientes por <importe> € · 2 urgentes · Revisar riesgo de crédito    ← admin
4 pendientes por <importe> € · 2 urgentes                                ← manager
4 pendientes · 2 urgentes                                                ← agente (sin €)
0 pendientes por 0,00 €                                                  ← sin urgentes: no aparece «0 urgentes»
```
```ts
function summarize(visible: Order[], actor: Actor | null, showAmounts: boolean): string {
  const pending = visible.filter((order) => order.status === 'pending');
  const urgent = /* cuántos de `pending` son isUrgent */;
  return [
    showAmounts ? `${pending.length} pendientes por ${formatCurrency(pendingExposure(visible))}` : `${pending.length} pendientes`,
    urgent > 0 ? `${urgent} urgentes` : null,
    /* 'Revisar riesgo de crédito' solo si el actor es admin Y needsCreditReview(visible) */ null,
  ].filter(Boolean).join(' · ');
}
```
- ⚠ Cuenta sobre `visible` (lo filtrado), **no** sobre `orders`.
- ⚠ El agente no ve `€` en ningún sitio, tampoco en el resumen.
- «Solo admin ve el aviso» es una decisión de **presentación** (quién ve qué); «hay riesgo» es del dominio (`needsCreditReview`).

### A.5 · Lista vacía → grupo «lista vacía» (3 tests)
Sustituye `emptyMessage: null` del esqueleto:
- Hay filas → `null`.
- No hay filas y **hay filtros** → `'Sin resultados para estos filtros'`.
- No hay filas y **no hay filtros** → `'Todavía no hay pedidos'`.

«Hay filtros» = `criteria.text.trim() !== '' || criteria.status !== 'all' || criteria.onlyMine`.
⚠ Sin el `trim()`, un texto de solo espacios contaría como filtro.

### A.6 · Comprobación
```bash
npm test && npm run lint:arch   # lint:arch falla si el view model importa React
```

> Tres decisiones de producto que los tests fijan y que **cambian** el comportamiento heredado: el orden por cliente es alfabético en español; el botón «Aprobar» solo aparece si la regla lo permite; un agente no recibe importes, tampoco en el resumen.

---

## Parte B · Los criterios viven en la URL (15 min · 19:00 – 19:15)
Archivos: `src/orders/ui/orders-criteria.ts` (puro) y `src/orders/ui/useOrdersCriteria.ts` (hook). Tests: `orders-criteria.test.ts` (9) y `useOrdersCriteria.test.tsx` (4).

**Idea clave:** la URL **es** el estado. Se puede compartir, recargar y navegar con Atrás. El hook no tiene `useState`: lee de la URL y escribe en la URL. Toda la lógica va en el módulo puro, que se prueba sin React.

| Criterio | Parámetro | Valor por defecto (no se escribe) |
|---|---|---|
| `text` | `q` | `''` |
| `status` | `status` | `'all'` |
| `onlyMine` | `mine=1` | `false` |
| `sort` | `sort` | `'date'` |

### B.1 · `parseCriteria` → grupo «parseCriteria» (4 tests)
Quita `.skip` en `orders-criteria.test.ts`. La URL la puede escribir cualquiera: **trátala como un DTO externo y valídala**.
```ts
const STATUSES: OrdersCriteria['status'][] = ['all', 'pending', 'approved', 'shipped', 'cancelled'];
const SORTS: SortKey[] = ['date', 'total', 'customer'];

/** Devuelve `value` si está en la lista de permitidos; si no, `fallback`. */
const oneOf = <T extends string>(value: string | null, allowed: T[], fallback: T): T =>
  (allowed as string[]).includes(value ?? '') ? (value as T) : fallback;

export function parseCriteria(params: URLSearchParams): OrdersCriteria {
  return {
    text: params.get('q') ?? '',
    status: oneOf(params.get('status'), STATUSES, DEFAULT_CRITERIA.status),
    onlyMine: /* ... */,
    sort: /* ... */,
  };
}
```
- ⚠ `?status=borrado` debe volver a `'all'`: nada de `params.get('status') as OrderStatus` sin validar.
- ⚠ `mine` es `true` **solo** si vale exactamente `'1'` (`Boolean(params.get('mine'))` daría `true` con `mine=0`).
- ⚠ **No** hagas `trim()` del texto: el campo de búsqueda se pinta desde la URL, y si recortas no se puede teclear «hotel brisa» (el espacio desaparece al escribirlo).

### B.2 · `writeCriteria` → grupo «writeCriteria» (5 tests)
```ts
export function writeCriteria(criteria: OrdersCriteria, base: URLSearchParams = new URLSearchParams()): URLSearchParams {
  const params = new URLSearchParams(base); // copia: no mutes `base` y conserva los parámetros ajenos (debug=1)
  const set = (key: string, value: string, isDefault: boolean) => (isDefault ? params.delete(key) : params.set(key, value));
  set('q', criteria.text, criteria.text === DEFAULT_CRITERIA.text);
  /* status, mine ('1' o se borra) y sort, igual */
  return params;
}
```
- Los valores por defecto **se borran** de la URL: `/` y `/?status=all&sort=date` serían dos URLs para la misma pantalla.
- El test «ida y vuelta» comprueba `parseCriteria(writeCriteria(c))` → `c` para todas las combinaciones: si falla, compara las dos funciones campo a campo.

### B.3 · El hook `useOrdersCriteria` → `useOrdersCriteria.test.tsx` (4 tests)
Quita `.skip` en `useOrdersCriteria.test.tsx`. El hook solo conecta el módulo puro con `useSearchParams` de react-router:
```ts
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parseCriteria, writeCriteria, type OrdersCriteria } from './orders-criteria';

export function useOrdersCriteria(): [OrdersCriteria, (patch: Partial<OrdersCriteria>) => void] {
  const [params, setParams] = useSearchParams();
  const criteria = useMemo(() => parseCriteria(params), [params]);
  const update = useCallback(
    (patch: Partial<OrdersCriteria>) => {
      setParams((current) => /* writeCriteria({ ...criterios actuales, ...patch }, current) */, { replace: true });
    },
    [setParams],
  );
  return [criteria, update];
}
```
- `update` recibe un cambio **parcial** (`{ status: 'pending' }`): mezcla con los criterios actuales leídos de `current`.
- ⚠ `setParams({ q: … })` con un objeto nuevo pierde `debug=1` y el resto de criterios. Pasa siempre `current` como `base`.
- ⚠ `{ replace: true }`: escribir «hotel» no debe dejar cinco entradas en el historial. Lo fija el test «reemplaza la entrada del historial».

### B.4 · Comprobación
```bash
npm test
```

---

## Parte C · Hook de datos, rutas y retirada (15 min · 19:15 – 19:30)

### C.1 · `useOrdersList` → `useOrdersList.test.tsx` (5 tests)
Quita `.skip` en `useOrdersList.test.tsx`. Primero lee `orders-list-state.ts`: el reducer ya sabe pasar de `loading` → `ready`/`error` y marcar `refreshing` al recargar. Tu hook solo tiene que **disparar acciones**.

1. Estado con el reducer y el caso de uso del módulo:
   ```ts
   const { listOrders } = useOrdersModule();
   const [state, dispatch] = useReducer(ordersListReducer, INITIAL_ORDERS_LIST);
   ```
2. Un contador para poder «volver a pedir»: cambiarlo relanza el efecto.
   ```ts
   const [attempt, setAttempt] = useState(0);
   ```
3. El efecto pide los pedidos y **ignora respuestas de una ejecución anterior** (patrón de react.dev, «Fetching data»):
   ```ts
   useEffect(() => {
     let active = true;
     listOrders().then(
       (orders) => active && dispatch({ type: 'loaded', orders }),
       () => active && dispatch({ type: 'failed' }),
     );
     return () => { active = false; }; // la limpieza «apaga» la petición anterior
   }, [listOrders, attempt]);
   ```
   ⚠ Sin la limpieza falla «una respuesta antigua que llega tarde NO pisa a la nueva».
4. `reload` avisa al reducer y relanza el efecto:
   ```ts
   const reload = useCallback(() => {
     dispatch({ type: 'reload' });
     setAttempt((current) => current + 1);
   }, []);
   return { state, reload };
   ```
   ⚠ Sin `useCallback` falla «reload es estable entre renders».

Ahora quita `.skip` en `OrdersListPage.test.tsx` (12 tests). Con A, B y C.1 hechas, la pantalla ya funciona: **no tienes que tocar `OrdersListPage.tsx`**. Si algo falla aquí, el error está en una de tus tres piezas: el mensaje del test te dice cuál.

### C.2 · Rutas con permisos → `AppRoutes.test.tsx` (6 tests)
Quita `.skip` en `AppRoutes.test.tsx`. Abre `src/shell/RequireAccess.tsx`: recibe la `session`, una regla `can` y **una función como hijo** que recibe un `Actor` que ya no puede ser `null`.

1. Cambia los imports: fuera `OrdersPage`; entran `OrdersListPage`, `canViewOrders`, `canViewDashboard` (todos de `'../orders'`), `RequireAccess` y `NotFoundPage` (de `./`).
2. Quita la línea `void [session, onNotify];`.
3. Rutas:
   ```tsx
   <Routes>
     <Route path="/" element={<RequireAccess session={session} can={canViewOrders}>{(actor) => <OrdersListPage actor={actor} onNotify={onNotify} />}</RequireAccess>} />
     <Route path="/orders/:id" element={<OrderDetailPage />} />
     <Route path="/dashboard" element={/* igual, con canViewDashboard y () => <DashboardPage /> */} />
     <Route path="*" element={<NotFoundPage />} />
   </Routes>
   ```
- ⚠ `<RequireAccess …><DashboardPage /></RequireAccess>` no compila: el hijo es una **función**. Así el panel ni se monta (ni pide datos) si no hay permiso.
- ⚠ Sin `path="*"`, una URL desconocida deja la pantalla en blanco.
- Las reglas de acceso están en `domain/permissions.ts`: la ruta **pregunta**, no decide.

### C.3 · Retira la pantalla heredada
Ve en este orden; después de cada paso, `npm run typecheck` te dice qué se ha roto.

1. **Borra la pantalla y sus tests:**
   ```bash
   git rm src/pages/OrdersPage.tsx src/pages/OrdersPage.test.tsx src/pages/__snapshots__/OrdersPage.test.tsx.snap \
          src/pages/cancel-order-flow.test.tsx
   ```
2. **`src/pages/cancel-order.test.tsx`:** borra el bloque `describe('Parte A · …')` y, en su `renderAt`, la ruta `/` (y el import de `OrdersPage`). El bloque «Parte C» (detalle y panel) se queda.
3. **Código que solo existía para la pantalla vieja:**
   ```bash
   npm run unused   # → src/components/OrderRow.tsx · src/hooks/useOrders.ts · src/shared/mappers.ts
   git rm src/components/OrderRow.tsx src/hooks/useOrders.ts src/shared/mappers.ts
   ```
4. **Store global:** en `src/store/appStore.tsx` deja solo `user`/`setUser` y `toast`/`setToast`. Fuera `orders` (estado de servidor de una pantalla), `filters` (estado de URL) y `selectedOrderId` (no lo leía nadie).
5. **Tipos:** en `src/shared/types.ts` borra `Filters` y los campos de vista de `Order` (`total`, `isUrgent`, `selected`, `rowColor`).
6. **Dependencias:** `npm run deps` → `npm uninstall lodash @types/lodash`.

### C.4 · Anota en el Pull Request qué test sustituye a cada test borrado
Para cada test borrado, la pregunta es: ¿el comportamiento que protegía sigue protegido por otro test? Si sí, se borra y se anota el sustituto; si no, se porta. Rellena esta tabla en el PR (la primera fila es un ejemplo):

| Test borrado | Comportamiento que protegía | Lo protege ahora |
|---|---|---|
| `OrdersPage.test.tsx` · «pinta la fila urgente» | Fila urgente, total, botones | `orders-list-view-model.test.ts` · «tono…» y «las acciones salen de las reglas del dominio…» |
| `OrdersPage.test.tsx` · «coincide con la instantánea» | ? | ? (pista: ¿protegía algún comportamiento concreto?) |
| `cancel-order.test.tsx` · «Parte A» | Un motivo de espacios no se acepta | ? (busca en `OrdersListPage.test.tsx`) |
| `cancel-order-flow.test.tsx` · «cancela en el backend…» | Cancelar usa el caso de uso y publica el evento | ? |
| `cancel-order-flow.test.tsx` · «si el pedido ya se cerró…» | Decide el estado actual del backend | ? |

### C.5 · Comprobación final
```bash
npm test && npm run typecheck && npm run lint:arch && npm run lint:boundaries
npm run state        # OrdersListPage.tsx: 3 useState y 0 useEffect
npm run unused       # ningún archivo de src/ sin usar
npm run deps         # lodash ya no aparece
npm run dev          # http://localhost:5173/?status=pending&mine=1 · recarga · botón Atrás
```
En el navegador:
1. `/?status=pending&mine=1` → lista filtrada; al recargar se conserva.
2. Consola: `localStorage.setItem('userId', 'u3')` y recarga → sin importes; `/dashboard` → «No tienes acceso».
3. `/facturas` → «Página no encontrada».

## Entrega
```bash
git add -A
git commit -m "feat(orders): lista de pedidos con view model, estado de URL y rutas protegidas"
git push -u origin s5/<tu-nombre>
```
Abre el Pull Request y completa la checklist de la plantilla (incluye el bloque «Presentación y estado») y la tabla de C.4.

## Ampliación (si terminas antes)
- El resumen dice «1 urgentes». Corrige el plural **en el view model** y añade el test. ¿Cuántos archivos has tocado?
- Recuerda los últimos criterios: si la URL llega sin parámetros, restaura los guardados a través de un puerto (`examples/tema8/filters-store.ts`). ¿Quién gana si hay URL **y** valor guardado?
- Migra `OrderDetailPage` con `examples/tema9/order-detail-view-model.ts` y elimina su segundo `useEffect`.
- Con el prompt P3 de `prompts/sesion-5.md`, pide a Copilot el view model del panel y revisa si reescribe reglas que ya están en el dominio.
- Hito del proyecto final: completa `docs/adr/003-estado-y-presentacion.md` y la tabla «Mi mapa de estado» de `docs/arquitectura-objetivo.md`.
