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

## Presentación y estado (Sesión 5)
- [ ] El JSX no calcula, no formatea y no compara roles: recibe un view model (función pura con tests sin render).
- [ ] No hay estado derivado en `useState` ni `useEffect` que lo sincronice (`npm run state`).
- [ ] La pantalla trata loading, error, empty y success.
- [ ] Lo que se debe poder compartir o recargar (filtros, orden, página) está en la URL.
- [ ] El acceso a la pantalla lo decide un guard con una regla del dominio, no la propia pantalla.
- [ ] Tests heredados borrados: indico qué test nuevo protege ese comportamiento.

## Node, errores y seguridad (Sesión 6)
- [ ] La identidad la decide el servidor: ninguna cabecera, parámetro ni valor de `localStorage` elegido por el cliente.
- [ ] Cada acción con permisos se comprueba también en el BFF, no solo en la pantalla.
- [ ] Lo que la persona usuaria no puede ver no sale del servidor (lo he mirado en la pestaña Red).
- [ ] Los datos que llegan de fuera (URL, formulario, respuesta, almacenamiento) se parsean antes de usarse.
- [ ] Los errores devuelven un código estable; ni rutas, ni stack, ni el texto del servidor en pantalla.
- [ ] Solo se ofrece reintentar lo que puede salir distinto (red o conflicto).
- [ ] A la analítica solo viajan campos de la lista blanca: ningún nombre, motivo ni nota.
- [ ] `npm run audit:secrets` no encuentra nada y `npm run test:policy` está en verde.

## Rendimiento, observabilidad y refactor (Sesión 7)
- [ ] Antes de tocar código heredado había tests de caracterización en verde (y siguen en verde contra la versión nueva).
- [ ] Cada cambio de comportamiento está declarado en el test (`{ heredada, nueva }`) y aquí: …
- [ ] Tests borrados y qué test los sustituye: …
- [ ] Las operaciones nuevas dejan rastro (`traced`, `FeatureBoundary`) y solo con campos de `LOG_FIELDS`.
- [ ] Ninguna optimización sin medición; `npm run perf:budget` antes: … kB · después: … kB.
- [ ] Mutación del módulo crítico que toco: antes … % · después … %.

## Pruebas: datos, pantalla y frontera (Sesión 8)
- [ ] Ningún `as` sobre datos que llegan de fuera: se parsean en la frontera y el fallo se nota ahí.
- [ ] Los campos que el backend puede no enviar están modelados como `null`, y la interfaz hace algo sensato cuando faltan.
- [ ] Los datos de prueba salen de `src/orders/testing`; no he copiado fixtures ni he escrito pedidos a mano.
- [ ] Los tests nuevos usan dobles escritos a mano; ningún `vi.mock` en código nuevo.
- [ ] Los tests de componente consultan por rol o etiqueta y usan `userEvent`; los errores de formulario están atados a su campo.
- [ ] El contrato del puerto se ejecuta contra `server/bff.mjs` y pasa en todas las implementaciones (`npm run test:contract`).
- [ ] Aserciones con valores exactos. Mutación del módulo que toco: antes … % · después … %.
- [ ] Cambios de comportamiento declarados aquí: …

## Cómo lo he comprobado
