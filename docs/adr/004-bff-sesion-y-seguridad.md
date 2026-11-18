# ADR-004 · BFF, sesión y límites de confianza en OrderDesk

- **Estado:** aceptado (versión de referencia del profesor)
- **Fecha:** 19/11/2026
- **Autoría:** Joan Cifo

## Contexto
- Hasta la Sesión 5, la autorización era **visual**: `src/orders/domain/permissions.ts` decidía qué botones se veían, y `server/app.mjs` aceptaba cualquier petición. La identidad viajaba en `x-user-id`, una cabecera que escribía el cliente leyendo `localStorage`.
- El bundle incluía una clave de analítica (`VITE_ANALYTICS_KEY`) y el detalle pintaba como HTML una nota escrita por otra persona.
- La analítica recibía el nombre del cliente y el motivo de cancelación: texto libre con datos personales.
- El backend heredado no se puede cambiar en este curso: es el sistema de otro equipo.

## Opciones consideradas
| Opción | A favor | En contra |
|---|---|---|
| 1. Arreglar el backend heredado | Un único sitio donde decidir | No es nuestro; su calendario no es el nuestro |
| 2. Reforzar solo el cliente (ocultar botones, no guardar el token) | Barato, inmediato | No protege: el cliente es territorio de quien lo abre |
| 3. **BFF en Node delante del heredado** | Autoriza, valida y recorta; se despliega con el frontend; a medida de una sola interfaz | Un proceso más que operar; riesgo de que acabe con lógica de presentación |
| 4. Gateway/API Management del proveedor | Sin código propio | No conoce nuestras reglas de negocio ni nuestros roles |

## Decisión
Opción 3: **un BFF propio** (`server/bff.mjs`) con tres responsabilidades y ninguna más.
1. **Quién eres**: sesión firmada (HMAC-SHA256) en cookie `HttpOnly; SameSite=Strict`. El token no pasa por JavaScript, no se guarda en `localStorage` y el secreto vive solo en Node (`SESSION_SECRET`).
2. **Si puedes**: autorización real, con los mismos umbrales que el dominio (`shared/policy.json`).
3. **Qué sale**: un agente no recibe importes ni responsables; los errores son `{ error: { code } }` y nada más.

Las reglas **no se comparten como código** (el dominio es TypeScript de navegador y el BFF es Node): se comparten los **números** en `shared/policy.json` y se protege el acuerdo con un test de contrato (`src/orders/policy.contract.test.ts`) que compara las dos implementaciones en 21 combinaciones de pedido y rol.

La sesión deja de ser un dato del store global y pasa a ser un **slice propio** (`src/session`) con su puerto, su adapter HTTP, su fake y su Provider.

## Consecuencias
- Positivas: la consola del navegador ya no concede permisos; un dato que no se puede ver no viaja; `npm run audit:secrets` y `src/security.test.ts` impiden que vuelvan los cuatro problemas; el cliente ya no decide su identidad.
- Aceptadas: un proceso más en desarrollo y en despliegue; dos implementaciones de las mismas reglas que hay que mantener de acuerdo (el test de contrato avisa); la cookie `SameSite=Strict` obliga a servir frontend y BFF en el mismo sitio.
- Controles: `npm run test:bff` (15), `npm run test:policy` (3), `npm run test:security` (17), `npm run audit:secrets` (0 hallazgos).
- Revisaremos la decisión si: el BFF empieza a devolver textos de pantalla, si aparece una segunda interfaz con necesidades distintas (entonces, dos BFF o ninguno) o si el backend heredado incorpora autorización propia.

## Lo que decidimos NO hacer
- **JWT en `localStorage`**: cualquier script de la página lo lee; una dependencia con una versión comprometida se lo lleva. La cookie `HttpOnly` no se puede leer desde JavaScript.
- **Compartir el dominio como paquete entre navegador y Node**: obligaría a un paso de compilación y a publicar un paquete interno para tres constantes. Se comparte el dato y se prueba el acuerdo.
- **Quitar los permisos del cliente**: siguen ahí, pero para no enseñar botones que van a fallar. Ayudan; no protegen.
