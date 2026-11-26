# ADR-008 · Devoluciones: feature propia, importe y autorización en el BFF y migración detrás de un flag

- **Estado:** propuesto · **Fecha:** 30/11/2026 · **Autoría:** Joan Cifo

## Contexto
- `src/pages/ReturnsPage.tsx` (153 líneas, sin tests) mezcla cuatro peticiones encadenadas, cinco reglas de negocio, permisos, envío, aviso y un `console.log` con el nombre del cliente (`docs/devoluciones/mapa.md`).
- El navegador envía el importe (`rfd_amt`) y su rol (`req_role`), y la API heredada los guarda sin comprobar (`server/returns-legacy.mjs`). El límite de 500 € y el «un agente no» solo existen en la pantalla.
- Descuento e IVA están duplicados a mano frente a `shared/policy.json`. El plazo, la reposición y el límite no están en ningún sitio compartido.
- La red de caracterización (18 tests, `src/pages/returns.characterization.test.tsx`) fija cuatro rarezas que nadie sabe si son reglas o errores.

## Decisión
Devoluciones es una **feature propia** (`src/returns`) con las capas de Pedidos donde pagan; el **BFF** calcula el importe y autoriza; la pantalla nueva convive con la heredada **detrás del flag `newReturns`**, apagado hasta que Producto responda.

| Decisión | Opción elegida | Alternativa descartada |
|---|---|---|
| Lugar | Feature `src/returns` con API pública (`index.ts`) y las mismas reglas de capa (`lint:arch`, `lint:boundaries`) | Dentro de `src/orders`: haría crecer una feature grande con otra capacidad y otro backend. Un slice por caso de uso: con dos casos de uso, más carpetas que código |
| Reglas | Funciones puras en `domain/return-rules.ts`, extraídas tal cual; números en `shared/policy.json` (`returns`) | Arreglar las rarezas al extraerlas: cambio de comportamiento sin decisión |
| Importe y permisos | El BFF calcula y autoriza (`server/returns.mjs`); el cliente envía `sku`, `qty` y `reason` | Validar en el cliente: lo decide quien puede falsificarlo |
| Reglas en dos lenguajes | Se comparten los números; `src/returns/policy.contract.test.ts` comprueba que dominio y BFF deciden igual (como Pedidos, Sesión 6) | Compartir el código entre navegador y Node: acopla el bundle al servidor |
| Datos para la pantalla | `GET /api/orders/:id/return-context`: una respuesta con pedido, líneas con lo ya devuelto y entrega | Cuatro peticiones encadenadas y el formato del transportista en el navegador |
| Frontera | Puerto `ReturnsGateway` + adapter HTTP con parser de lista blanca (`return-context-dto.ts`), probado contra el BFF real | `as` sobre la respuesta |
| Migración | Rama por abstracción: `ReturnsRoute` elige por el flag `newReturns` (Sesión 7) | Sustituir la pantalla de golpe: sin vuelta atrás ni comparación |

## Consecuencias
- Positivas: el importe y los permisos ya no los decide el navegador (en las rutas nuevas); 114 tests nuevos (caracterización, reglas, contrato, BFF, adapter, casos de uso, view model, pantalla y ruta), todos sin red real salvo los que levantan el BFF; la pantalla nueva no tiene estado derivado ni `useEffect` de sincronización.
- Aceptadas: las rutas heredadas (`/api/returns`, `/api/carrier`) siguen abiertas al navegador hasta el paso 6; la pantalla nueva entra en el bundle inicial (+2,8 kB gzip, 68,2 de 70 kB): se cargará con `lazy()` en el paso 6 si el presupuesto lo pide.
- **Cambios de comportamiento declarados** (pantalla nueva, flag encendido):
  | Caso | Heredada | Nueva |
  |---|---|---|
  | El servidor no responde al cargar | «Cargando…» para siempre | Mensaje de error y «Reintentar» |
  | El servidor falla al registrar | «Error 500» | «No se ha podido registrar la devolución. Inténtalo de nuevo en unos segundos» |
  | Un agente entra en la URL | Texto propio de la pantalla | El 403 del shell (`RequireAccess`) |
  | Cantidad no válida | Mensaje suelto | El mismo mensaje, atado al campo (`aria-invalid`, `aria-describedby`) |
- Controles: `npm run lab:check`, `npm run lint:arch` (ahora también `src/returns`), `src/returns/policy.contract.test.ts`, `server/returns.test.mjs`.

## Lo que decidimos NO hacer
- **TanStack Query para Devoluciones**: una pantalla, sin caché compartida (ADR-003).
- **Servicio, repositorio y fachada** propuestos por Copilot: un puerto y dos casos de uso cubren el problema.
- **Resolver las rarezas** en este plan: son cuatro preguntas para Producto (`docs/devoluciones/plan.md`). Cada respuesta será un PR con su test `{ heredada, nueva }` y el cambio en el dominio y en el BFF a la vez.
- **Encender el flag y borrar la heredada** (pasos 6 y 7): después de las respuestas de Producto y de una semana en producción.
