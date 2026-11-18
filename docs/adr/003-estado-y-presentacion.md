# ADR-003 · Estado y capa de presentación en Pedidos

- **Estado:** aceptado (versión de referencia del profesor)
- **Fecha:** 18/11/2026
- **Autoría:** Joan Cifo

## Contexto
- Al acabar la Sesión 4, `src/pages/OrdersPage.tsx` (206 líneas) tenía 9 `useState` y 5 `useEffect` (`npm run state`): filtros duplicados en `localStorage` y en el store global, lista filtrada y contadores guardados como estado y sincronizados con efectos, y permisos decididos en el JSX.
- El store global (`src/store/appStore.tsx`) mezclaba datos de servidor (`orders`), estado de una pantalla (`filters`), sesión (`user`) y avisos (`toast`).
- La URL no reflejaba nada: una lista filtrada no se podía compartir ni recuperar al recargar.
- Tamaño: tres pantallas, una lista de decenas de pedidos, sin paginación en el backend. Equipo pequeño.

## Opciones consideradas
| Decisión | Opción elegida | Alternativa descartada |
|---|---|---|
| Filtros y orden | **URL** (`useSearchParams` + módulo puro `orders-criteria.ts`) | Store global + `localStorage`: no se comparte y obliga a sincronizar |
| Lista de pedidos | **Estado de servidor local a la pantalla**: `useOrdersList` (reducer + caso de uso) | Store global: nadie más lo necesita. TanStack Query: ver «Lo que decidimos NO hacer» |
| Lista filtrada, contadores, permisos de fila | **Derivado**: view model puro calculado en cada render | `useState` + `useEffect`: renders dobles y fotogramas incoherentes |
| Tras cancelar o aprobar | **Recargar** la lista (`reload`) | Parchear la fila a mano: duplica la transición del dominio en la UI |
| Acceso a pantallas | **Guard** (`RequireAccess`) + regla del dominio (`permissions.ts`) | `if (role === …)` dentro de cada pantalla |
| Avisos (toast) | **Global**, pintado una vez en el shell | Que lo pinte la lista: un aviso lanzado desde el detalle no se veía |

## Decisión
Cada estado vive en el sitio más pequeño que lo puede contener, y lo que se puede calcular no se guarda:
- **URL** para lo que debe sobrevivir a recargar y compartirse. **Servidor** para lo que es de otro sistema. **Local** para lo que solo importa a un componente. **Global** solo para sesión y avisos. **Derivado**: nunca se guarda.
- La pantalla se divide en contenedor (`OrdersListPage`), view model puro (`orders-list-view-model.ts`) y componentes presentacionales (`ui/components/`).
- El módulo expone `listOrders`, una consulta que solo reenvía al puerto. Se acepta a propósito: evita que la UI reciba un puerto y deja un único punto donde añadir permisos de lectura o paginación.

## Consecuencias
- Positivas: `OrdersListPage` tiene 3 `useState` y 0 `useEffect`; la lista filtrada es un enlace; 19 tests del view model sin render; `lodash` sale de las dependencias.
- Aceptadas: los últimos filtros ya no se recuerdan entre visitas (antes, `localStorage`); cada cancelación o aprobación cuesta una lectura más; el panel y el detalle siguen en el código heredado.
- Cambios de comportamiento deliberados: orden por cliente alfabético en español; «Aprobar» solo se ofrece si la regla lo permite; un agente no recibe importes en el resumen; los errores de cancelación se ven dentro del diálogo y no con `alert`.
- Controles: `npm run lint:arch` (view models sin React, presentacionales sin router ni hooks de datos), `npm run state`, `AppRoutes.test.tsx`.

## Lo que decidimos NO hacer
- **TanStack Query en producción**: con una sola lista sin paginación ni varias pantallas que compartan caché, `useOrdersList` (30 líneas) basta. Se adoptará cuando aparezca la segunda pantalla que lea los mismos datos (`examples/tema10/server-state.tsx` muestra cómo, sin tocar el dominio).
- **Librería de máquinas de estado (XState)**: un reducer con unión discriminada cubre tres estados.
- **Recordar filtros en `localStorage`**: queda como ampliación detrás de un puerto; la URL siempre gana.
- **Migrar a un data router (`createBrowserRouter`, loaders)**: cambiaría el arranque y todos los tests de pantalla; no resuelve ningún problema que tengamos hoy.
