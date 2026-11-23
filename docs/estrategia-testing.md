# Estrategia de testing de la feature Pedidos (versión de referencia · Sesión 8)

**Objetivo:** que cada riesgo importante tenga un test que lo detecte, en el nivel más barato que lo pueda detectar.
La distribución no se copia de un dibujo (pirámide, trofeo, panal): sale de la arquitectura y de los riesgos.

## 1 · Qué hay hoy (`npm run test:map`)
| Capa | Tests | Tiempo | Con `vi.mock` | Lectura |
|---|---|---|---|---|
| Dominio | 32 | ~10 ms | 0 | Reglas puras: rápidas y deterministas |
| Casos de uso | 24 | ~15 ms | 0 | Dobles escritos a mano; ni red ni React |
| Adapters y frontera | 84 | ~220 ms | 0 | Parser, red simulada (MSW) y contrato contra el BFF |
| View models | 56 | ~20 ms | 0 | Presentación sin renderizar |
| Hooks, pantallas y componentes | 56 | ~2,0 s | 0 | React Testing Library con `userEvent`, módulo en memoria |
| Caracterización | 34 | ~0,6 s | 3 | `vi.mock` solo donde el heredado lee `services/api` |
| BFF | 19 | ~0,2 s | 0 | HTTP de verdad contra el servidor |
| Ejemplos del curso | 230 | ~1,2 s | 0 | Material de clase, ejecutable |

(Los números exactos cambian con cada ejecución: lo que importa es la forma.)

**Sesión 8:** los tres bloques que han crecido son los que faltaban. La frontera (84 tests) pasa de ser el archivo menos probado del repositorio a ser el más probado, porque es por donde entra todo lo que no controlamos.

## 2 · Riesgo → nivel
| Riesgo | Nivel | Por qué ahí | Archivo |
|---|---|---|---|
| Una regla de negocio mal escrita (umbral, rol, estado) | Unitario de dominio | Es donde vive; un test cuesta milisegundos | `src/orders/domain/*.test.ts` |
| El dominio y el BFF deciden distinto | Contrato | Son dos implementaciones de la misma regla | `src/orders/policy.contract.test.ts` |
| El adapter malinterpreta al backend | Integración / contrato | El fallo está en la frontera | `order-gateway.contract.test.ts`, `analytics-event-publisher.test.ts` |
| El backend envía algo que no esperábamos | Unitario de frontera | La traducción se prueba sin red, con datos hostiles | `infrastructure/order-mapper.test.ts` |
| Reaccionamos mal a un código de estado | Integración con red simulada | Hace falta una respuesta HTTP, no un backend | `http-order-gateway.integration.test.ts` |
| El fake acepta lo que el backend rechaza | Contrato del puerto, contra el BFF | Solo se ve ejecutando lo mismo contra las dos implementaciones | `order-gateway.contract.test.ts` |
| Un formulario no se puede usar sin ver la pantalla | Componente (RTL + jest-dom) | Es comportamiento, no estilo | `components/ApproveDialog.test.tsx` |
| La pantalla enseña algo falso | Componente (RTL) + view model | Lo ve la persona usuaria | `*.characterization.test.tsx`, `orders-*-view-model.test.ts` |
| Una respuesta tardía pisa a otra | Hook | Es un problema de orden en React | `useOrderDetail.test.tsx` |
| Un fallo en producción pasa inadvertido | Observabilidad | No se prueba la ausencia de bugs: se prueba que dejan rastro | `src/orders/observability.test.ts` |
| Login, aprobar y cancelar de punta a punta | E2E (Sesión 9) | Pocos y críticos | `e2e/` (Sesión 9) |

## 3 · Calidad, no solo cantidad
- **Mutación** en los módulos críticos: `orders-dashboard.ts` al 100 % y `infrastructure/order-dto.ts` al 94 % (6 supervivientes, todos justificados en el PR). Siguiente: `domain/cancellation.ts` y `domain/approval.ts`.
- **Aserciones débiles**: `npm run test:weak` lista las que ejecutan sin comprobar. No es un linter: es una lista para mirarla con criterio.
- **Fidelidad de los dobles**: el contrato del puerto se ejecuta contra el fake y contra `server/bff.mjs`. Un fake que acepta lo que el backend rechaza convierte en falsos todos los tests que lo usan.
- **Cobertura** como alarma, no como objetivo: una línea sin cubrir es una pregunta; una línea cubierta no es una respuesta.
- **Fragilidad**: `npx vitest run --sequence.shuffle` antes de cada PR grande. Ningún test depende de la hora, del orden ni de esperas reales.

## 4 · Decisiones
- Distribución elegida: **trofeo** en el frontend (muchos tests de dominio y de view model, bastantes de componente, pocos E2E) y **panal** en las fronteras (contratos entre cliente, BFF y backend).
- `vi.mock` solo en tests de código heredado. El código nuevo recibe sus dependencias por parámetro y se prueba con fakes.
- Los datos de prueba salen de `src/orders/testing` y las fixtures del backend, de `server/store.mjs`. Ninguna copia a mano.
- Componentes con `userEvent` y consultas por rol o etiqueta. `fireEvent` solo donde haga falta disparar un evento que una persona no puede producir.
- MSW para el adapter entero; `fetch` falso solo en tests que miran la petición que sale.
- Lo que NO probamos: estilos y textos que no son comportamiento (no hay snapshots de HTML completos).
