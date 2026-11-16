---
applyTo: "src/orders/ui/**,src/shell/**"
---
# Presentación de pedidos (Sesión 5)

- `ui/orders-*.ts` son módulos puros: sin `react`, sin `react-router-dom`, sin estado. Reciben dominio y devuelven datos listos para pintar (textos formateados, booleanos de acciones).
- `ui/components/**` son presentacionales: datos y callbacks por props. No importan el router, `OrdersProvider`, hooks `use…` ni `application/`. Pueden tener estado local de UI.
- Un view model no reescribe reglas: usa `canCancel`, `canApprove`, `isUrgent`, `needsCreditReview`, `canSeeAmounts` del dominio.
- Si un actor no puede ver un dato, el view model no lo incluye (`null`). No basta con no pintar la columna.
- Hooks: uno por responsabilidad. Datos (`useOrdersList`), URL (`useOrdersCriteria`), caso de uso (`useCancelOrder`, `useApproveOrder`). Un hook no navega ni muestra avisos.
- `useEffect` solo para sincronizar con algo externo a React (red, temporizador, suscripción), siempre con limpieza.
- Estados de carga como unión discriminada (`status: 'loading' | 'error' | 'ready'`), nunca varios booleanos.
- Tests: view models y reducers con Vitest en entorno `node`; componentes y pantallas con Testing Library buscando por rol y texto.
