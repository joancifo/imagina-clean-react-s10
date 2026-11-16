# ADR-003 · Estado y capa de presentación en Pedidos

- **Estado:** propuesto
- **Fecha:** 18/11/2026
- **Autoría:** <tu-nombre>

## Contexto
- Al acabar la Sesión 4, `src/pages/OrdersPage.tsx` (206 líneas) tenía 9 `useState` y 5 `useEffect` (`npm run state`): filtros duplicados en `localStorage` y en el store global, lista filtrada y contadores guardados como estado y sincronizados con efectos, y permisos decididos en el JSX.
- El store global (`src/store/appStore.tsx`) mezclaba datos de servidor (`orders`), estado de una pantalla (`filters`), sesión (`user`) y avisos (`toast`).
- La URL no reflejaba nada: una lista filtrada no se podía compartir ni recuperar al recargar.
- Tamaño: tres pantallas, una lista de decenas de pedidos, sin paginación en el backend. Equipo pequeño.

## Opciones consideradas
Para cada estado de la lista, dónde puede vivir y qué cuesta cada opción.

| Estado | Opciones | A favor / en contra |
|---|---|---|
| Filtros y orden | URL · store global · `localStorage` · estado local | |
| Lista de pedidos | Hook de datos propio · store global · TanStack Query | |
| Lista filtrada y contadores | Calculado en el render · `useState` + `useEffect` | |
| Tras cancelar o aprobar | Recargar la lista · actualizar la fila a mano | |
| Acceso a pantallas | Guard + regla del dominio · condición en cada pantalla | |

## Decisión
<!-- Qué tipo de estado es cada uno y dónde vive. Qué partes tiene una pantalla (contenedor, view model, presentacionales). -->

## Consecuencias
<!-- Qué ganamos (con números: npm run state), qué aceptamos perder, qué cambios de comportamiento son deliberados y qué controles lo protegen. -->

## Lo que decidimos NO hacer
<!-- p. ej. TanStack Query, XState, recordar filtros en localStorage, data router… y por qué. -->
