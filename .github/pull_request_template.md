## Qué cambia y por qué

## Checklist de arquitectura (Sesión 2)
- [ ] **SRP:** cada archivo modificado tiene una sola razón para cambiar (un actor).
- [ ] **OCP:** añadir un caso nuevo (estado, rol, nivel) no obliga a editar ramas `if/else` dispersas.
- [ ] **LSP:** las implementaciones nuevas de un puerto superan su test de contrato.
- [ ] **ISP:** componentes y funciones reciben solo los datos que usan.
- [ ] **DIP:** dominio y aplicación dependen de puertos, no de fetch, axios, React ni `localStorage`.
- [ ] `npm run lint:arch` y `npm run test:arch` en verde.
- [ ] No hay interfaces nuevas con una sola implementación que no crucen un límite.

## Dominio y boundaries (Sesión 3)
- [ ] Las reglas de negocio nuevas o movidas viven en `src/orders/domain` una sola vez (`npm run rules`).
- [ ] Los errores previsibles se devuelven como `Result` y tienen mensaje en `ui/`.
- [ ] El código heredado importa Pedidos solo desde `../orders` (`npm run lint:boundaries`).

## Casos de uso y composición (Sesión 4)
- [ ] Cada caso de uso nuevo tiene `Command` de entrada, `Result` de salida y puertos como dependencias.
- [ ] Sus tests usan dobles escritos a mano (fake, stub o spy), sin `vi.mock` ni red.
- [ ] Cada adapter nuevo tiene un fake que pasa el mismo test de contrato (`npm run test:contract`).
- [ ] Las implementaciones concretas se eligen solo en `composition.ts` / `main.tsx`.
- [ ] No hay instancias globales nuevas, parámetros por defecto con adapters reales ni registros tipo service locator.

## Cómo lo he comprobado
