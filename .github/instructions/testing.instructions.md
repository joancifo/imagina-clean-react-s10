---
applyTo: "src/**/*.test.ts,src/**/*.test.tsx,src/orders/testing/**,examples/**/*.test.ts,examples/**/*.test.tsx"
---
# Pruebas (Sesión 8)

- Los datos de prueba salen de `src/orders/testing`: `anOrder()`, `aDto()`, `anAdmin()`, `anUrgentOrder()`… No escribas objetos de pedido a mano en un test ni copies fixtures: si el modelo gana un campo, se cambia en un sitio.
- Las fixtures del backend (`SEED_DTOS`) se importan de `server/store.mjs`. Una copia a mano envejece en silencio.
- Dobles escritos a mano (`src/orders/testing/doubles.ts`), no `vi.mock`. `vi.mock` solo se acepta en tests de código heredado que no recibe sus dependencias por parámetro.
- Valores exactos: `toBe` / `toEqual`. Nada de `toBeDefined`, `toBeTruthy`, `toBeGreaterThan(0)` ni `not.toThrow()` donde cabe una comprobación de verdad (`npm run test:weak`).
- Nombra los tests por el comportamiento esperado («un manager no puede cancelar un pedido aprobado»), no por la función («checkCancellation devuelve false»).
- Componentes: React Testing Library con `userEvent` (no `fireEvent`), consultando por rol y nombre accesible. Nunca por clase CSS, por estructura del HTML ni con snapshots completos. Usa `renderOrders()` para montar una pantalla de Pedidos.
- Un mensaje de error de formulario se comprueba con `toHaveAccessibleDescription` y `toBeInvalid`, no buscando el texto suelto.
- Red simulada con MSW (`src/orders/testing/msw.ts`) para probar el adapter entero: ruta, método, credenciales y cada código de estado.
- El contrato de un puerto (`order-gateway.contract.ts`) solo contiene lo que TODA implementación debe cumplir, y se ejecuta contra el fake y contra `server/bff.mjs` (`startBff`), que es el backend con el que habla el navegador. Lo que solo puede cumplir el adapter HTTP va en su propio `describe`.
- Datos de fuera: se parsean en `infrastructure/order-dto.ts` antes de entrar al dominio. Nunca `as` sobre una respuesta.
- Un campo que el backend puede no enviar se representa con `null`, nunca con `undefined` ni con una cadena vacía.
