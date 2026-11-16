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

**Ya está escrito** (léelo antes de empezar): `OrdersListPage.tsx` (contenedor), `components/` (presentacionales), `orders-list-state.ts` (reducer), `useApproveOrder.ts`, `domain/approval.ts`, `domain/permissions.ts` y `src/shell/` (guard, 403, 404, aviso).

Diferencia con la Sesión 4: no hay pasos numerados dentro de cada archivo. **La especificación son los tests**, y en cada parte hay al menos un caso pensado para que la primera solución que se te ocurra falle.

## Parte A · View model de la lista (15 min · 18:45 – 19:00)
Archivo: `src/orders/ui/orders-list-view-model.ts` (tipos y etiquetas ya escritos). Test: `orders-list-view-model.test.ts` (19 tests).

1. Quita `.skip` del `describe` exterior.
2. Implementa `buildOrdersListViewModel(orders, criteria, actor)`: filtra, ordena, resume y prepara cada fila.
   - Las acciones, la urgencia, el riesgo de crédito y quién ve importes **ya son reglas del dominio**: úsalas, no las reescribas.
   - Formato con `formatCurrency` y `formatDate` de `ui/formatters.ts`.
3. `npm test && npm run lint:arch` → verde. `lint:arch` falla si el view model importa React.

> Tres decisiones de producto que los tests fijan y que **cambian** el comportamiento heredado: el orden por cliente es alfabético en español; el botón «Aprobar» solo aparece si la regla lo permite; un agente no recibe importes, tampoco en el resumen.

## Parte B · Los criterios viven en la URL (15 min · 19:00 – 19:15)
Archivos: `src/orders/ui/orders-criteria.ts` (puro) y `src/orders/ui/useOrdersCriteria.ts` (hook). Tests: `orders-criteria.test.ts` (9) y `useOrdersCriteria.test.tsx` (4).

1. Quita `.skip` en los dos archivos de test.
2. `parseCriteria(params)` y `writeCriteria(criteria, base)`. Parámetros: `q`, `status`, `mine=1`, `sort`.
3. `useOrdersCriteria()` devuelve `[criteria, update]`. `update` recibe un cambio **parcial** (`{ status: 'pending' }`).
4. `npm test` → verde.

> Recuerda: la URL la puede escribir cualquiera. Y el campo de búsqueda se pinta desde la URL.

## Parte C · Hook de datos, rutas y retirada (15 min · 19:15 – 19:30)
1. `src/orders/ui/useOrdersList.ts`: implementa el hook con `ordersListReducer` y `listOrders` del módulo. Devuelve `{ state, reload }`. Quita `.skip` en `useOrdersList.test.tsx` (5 tests) y en `OrdersListPage.test.tsx` (12 tests).
2. `src/shell/AppRoutes.tsx`: la ruta `/` pinta `OrdersListPage`; `/` y `/dashboard` quedan protegidas con `RequireAccess` y una regla de `domain/permissions.ts`; cualquier otra URL pinta `NotFoundPage`. Quita `.skip` en `AppRoutes.test.tsx` (6 tests).
3. **Retira la pantalla heredada.** Borra `src/pages/OrdersPage.tsx` y todo lo que solo existía para ella (`npm run typecheck` y `npm run unused` te guían). Deja en el store global solo lo que sea global.
4. Varios tests heredados se pondrán rojos o dejarán de compilar. Para cada uno decide: ¿el comportamiento que protegía sigue protegido por otro test? Si es así, bórralo y **anota en el Pull Request qué test lo sustituye**. Si no, pórtalo.
5. Comprobación final:
   ```bash
   npm test && npm run typecheck && npm run lint:arch && npm run lint:boundaries
   npm run state        # OrdersListPage.tsx: 3 useState y 0 useEffect
   npm run unused       # ningún archivo de src/ sin usar
   npm run deps         # lodash ya no se usa: npm uninstall lodash @types/lodash
   npm run dev          # http://localhost:5173/?status=pending&mine=1 · recarga · botón Atrás
   ```

## Entrega
```bash
git add -A
git commit -m "feat(orders): lista de pedidos con view model, estado de URL y rutas protegidas"
git push -u origin s5/<tu-nombre>
```
Abre el Pull Request y completa la checklist de la plantilla (incluye el bloque «Presentación y estado»).

## Ampliación (si terminas antes)
- El resumen dice «1 urgentes». Corrige el plural **en el view model** y añade el test. ¿Cuántos archivos has tocado?
- Recuerda los últimos criterios: si la URL llega sin parámetros, restaura los guardados a través de un puerto (`examples/tema8/filters-store.ts`). ¿Quién gana si hay URL **y** valor guardado?
- Migra `OrderDetailPage` con `examples/tema9/order-detail-view-model.ts` y elimina su segundo `useEffect`.
- Con el prompt P3 de `prompts/sesion-5.md`, pide a Copilot el view model del panel y revisa si reescribe reglas que ya están en el dominio.
- Hito del proyecto final: completa `docs/adr/003-estado-y-presentacion.md` y la tabla «Mi mapa de estado» de `docs/arquitectura-objetivo.md`.
