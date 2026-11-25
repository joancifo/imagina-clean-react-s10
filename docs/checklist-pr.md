# Checklist SOLID para revisar un Pull Request

Cada pregunta se responde con evidencia (`ruta:línea`, salida de un comando o un test). «Sí» sin evidencia cuenta como «no lo sé».

| Principio | Pregunta de revisión | Señal de alarma en React/TypeScript | Comprobación |
|---|---|---|---|
| SRP | ¿Cuántos actores (negocio, UX, analítica, backend) pueden pedir cambios en este archivo? | Un handler que valida, autoriza, llama a la API, mide y navega | Lista de responsabilidades; test de la regla sin React |
| OCP | Para añadir un estado/rol/nivel, ¿cuántos archivos hay que editar? | Cadenas de ternarios o `switch` repetidos en varias pantallas | `satisfies Record<Union, …>` y `npm run typecheck` |
| LSP | ¿La nueva implementación cumple lo que promete el contrato, no solo la firma? | Un fake que nunca falla; un adapter que lanza donde el contrato devuelve `null` | Test de contrato ejecutado contra cada implementación |
| ISP | ¿Recibe datos que no usa? | Props con el modelo completo del backend; un contexto que lo expone todo | Contar props/campos usados frente a recibidos |
| DIP | ¿El núcleo importa detalles? | `fetch`, axios, `localStorage` o React en reglas y casos de uso | `npm run lint:arch` |
| Abstracción | ¿La interfaz nueva aporta? | `IFoo` + `FooImpl` con una sola implementación y sin límite que cruzar | ¿Hay 2 implementaciones reales (contando los tests) o un límite de capa? |

## Dominio (Sesión 3)
| Pregunta | Señal de alarma | Comprobación |
|---|---|---|
| ¿La regla de negocio vive en `domain/` una sola vez? | El mismo umbral o rol comparado en varias pantallas | `npm run rules` |
| ¿Los valores con reglas propias son value objects? | `string`/`number` validados en el handler | Factory + tests del value object |
| ¿Los errores previsibles están en el tipo de retorno? | `throw` o `alert` para una regla de negocio | `Result<…>` y `satisfies Record<Error, string>` |
| ¿Las transiciones son inmutables? | Mutar el pedido recibido | Test con `Object.freeze` |
| ¿Se respeta la API pública de la feature? | `import … from '../orders/domain/…'` desde fuera | `npm run lint:boundaries` |

## Casos de uso y composición (Sesión 4)
| Pregunta | Señal de alarma | Comprobación |
|---|---|---|
| ¿El caso de uso expresa una intención de producto? | Una función que solo reenvía a un puerto | Nombre en lenguaje de negocio; algo que orquestar |
| ¿Entrada y salida son explícitas? | Parámetros sueltos, `any`, excepciones para errores previsibles | Tipo `Command` y `Result<…, Error>` |
| ¿Los errores se distinguen por origen? | `catch` genérico que lo convierte todo en un mensaje | Test de error inesperado que se propaga |
| ¿Las dependencias se ven en la firma? | Instancias globales, parámetros por defecto, `useService('…')` | `grep` de exports de instancias; test sin `vi.mock` |
| ¿El fake es fiel? | Un fake que nunca falla o acepta lo que el backend rechaza | `npm run test:contract` |
| ¿La composición vive en un solo sitio? | `createHttp…` o `fetch` fuera de `composition.ts` / `main.tsx` | `grep -rn "createHttp" src` |

## Presentación y estado (Sesión 5)
| Pregunta | Señal de alarma | Comprobación |
|---|---|---|
| ¿El JSX solo pinta? | Cálculos, formateos o `role === …` dentro del JSX | View model puro con tests sin render |
| ¿Las props hablan el lenguaje de la pantalla? | `ord_st`, `isAdmin`, `showTotal` y más de 3 booleanos | Props con datos ya preparados; composición |
| ¿Se tratan los cuatro estados? | Una lista en blanco mientras carga o cuando falla | Tests de loading, error, empty y success |
| ¿Hay estado derivado guardado? | `useState` + `useEffect` que llama a un `set…` | `npm run state`; calcular en el render |
| ¿Cada estado vive en su sitio? | Filtros en un store global; datos de servidor copiados | Tabla «Mapa de estado» de `docs/arquitectura-objetivo.md` |
| ¿La URL reproduce lo que se ve? | Recargar pierde filtros o paginación | Abrir el enlace en otra pestaña |
| ¿Los permisos de acceso están en un sitio? | `if (user.role …) return null` dentro de la pantalla | Guard + regla del dominio; test del mapa de rutas |

## Node, errores y seguridad (Sesión 6)
| Pregunta | Señal de alarma | Comprobación |
|---|---|---|
| ¿Quién decide la identidad? | Una cabecera, un parámetro o `localStorage` que escribe el cliente | `npm run audit:secrets`; test del BFF con cookie manipulada |
| ¿La autorización se comprueba en el servidor? | Solo se oculta el botón | Test que llama al endpoint sin pasar por la interfaz |
| ¿Sale del servidor algo que no se puede ver? | Importes en la respuesta y ocultos en la pantalla | Pestaña Red del navegador; test de recorte por rol |
| ¿La entrada se comprueba antes de usarse? | `as` sobre datos externos; campos de más ignorados | Parseo con lista blanca; 422 en el BFF |
| ¿Los errores dicen lo justo? | Rutas, SQL, stack o el texto del servidor en pantalla | Cuerpo `{ error: { code } }`; mensajes por tabla |
| ¿Qué se reintenta? | Un botón «Reintentar» tras un 403 | `retryable` solo para fallos de red o conflicto |
| ¿Qué viaja a la analítica? | Nombres, motivos o notas escritas a mano | Lista blanca de campos; 422 del BFF |
| ¿Hay secretos en el bundle? | `VITE_…KEY`, credenciales escritas a mano | `npm run audit:secrets`; `src/security.test.ts` |
| ¿Las reglas duplicadas están de acuerdo? | Un umbral copiado en Node y en el dominio | `shared/policy.json` + `npm run test:policy` |

## Rendimiento, observabilidad y refactor (Sesión 7)
| Pregunta | Señal de alarma | Comprobación |
|---|---|---|
| ¿La optimización tiene una medición detrás? | `memo`/`useMemo` «por si acaso» | Antes/después con `<Profiler>` o React DevTools |
| ¿Cambia lo que se descarga al abrir la aplicación? | Una dependencia nueva importada desde el shell | `npm run build && npm run perf:budget` |
| ¿Las operaciones nuevas dejan rastro? | Un caso de uso nuevo sin `traced()` | Entrada en `MemoryLogger` en un test |
| ¿Qué viaja a los logs? | `message`, `stack`, el comando entero | `LOG_FIELDS` y `/api/telemetry` (422) |
| ¿El refactor tiene red? | Código heredado tocado sin tests previos | Bloque «heredada» de la caracterización en verde antes del cambio |
| ¿Los cambios de comportamiento están declarados? | Un test heredado «ajustado» sin explicación | `{ heredada, nueva }` en el test y una línea en el PR |
| ¿Los tests comprueban o solo ejecutan? | `toBeDefined`, `toBeGreaterThan(0)` | `npm run mutate -- <archivo>` en lo crítico |

## Pruebas: datos, pantalla y frontera (Sesión 8)
| Pregunta | Señal de alarma | Comprobación |
|---|---|---|
| ¿Los datos de fuera se parsean antes de entrar? | `as` sobre `response.json()`, sobre la URL o sobre `localStorage` | `parseOrderDto` en la frontera; test con datos hostiles |
| ¿Un campo que puede no llegar está modelado como tal? | Un tipo que promete `string` y a veces trae `undefined` | `string \| null` y el test del caso recortado |
| ¿Qué pasa cuando el dato no es utilizable? | Media lista pintada con `NaN` o con «undefined» | Fallo explícito en el adapter (`invalid`) y mensaje al usuario |
| ¿Los datos de prueba salen de un sitio? | Un objeto de pedido escrito a mano en cada archivo | `src/orders/testing`; `builders.test.ts` en verde |
| ¿Los dobles están escritos a mano? | `vi.mock` en código nuevo | `npm run test:map` (columna `vi.mock`) |
| ¿El test comprueba o solo ejecuta? | `toBeDefined`, `toBeTruthy`, `toBeGreaterThan(0)` | `npm run test:weak` · `npm run mutate -- <archivo>` |
| ¿El test de componente busca como una persona? | `querySelector('.badge')`, `getByTestId` por costumbre, snapshots del HTML | Consultas por rol o etiqueta; `userEvent` en vez de `fireEvent` |
| ¿Los errores de formulario llegan a quien no ve la pantalla? | Un `<p>` con el mensaje y nada más | `toBeInvalid` y `toHaveAccessibleDescription` |
| ¿El contrato se ejecuta contra el backend de producción? | Un contrato contra una API que el navegador no usa | `npm run test:contract` contra `server/bff.mjs` |
| ¿El fake acepta lo que el backend rechaza? | Tests en verde con datos que el servidor devolvería con 422 | El caso en el contrato, pasando en las dos implementaciones |
| ¿Los números duplicados siguen de acuerdo? | Un límite escrito a mano en el cliente y otro en Node | `shared/policy.json` + `npm run test:policy` |

## E2E, pipeline y documentación (Sesión 9)
| Pregunta | Señal de alarma | Comprobación |
|---|---|---|
| ¿El E2E nuevo protege un journey o una regla? | Un E2E por mensaje de error o por permiso | ¿Qué test de nivel inferior no lo detectaría? Si lo detecta uno, el E2E sobra |
| ¿El E2E busca como una persona? | `nth-child`, clases CSS, `.first()` para salir del modo estricto | Localizadores por rol acotados (`rowOf`, el diálogo por su nombre) |
| ¿El E2E espera a una condición? | `waitForTimeout`, `expect(await locator.textContent())` | Aserciones web-first; la traza del fallo (`npm run e2e:report`) |
| ¿El test depende del orden? | Datos que deja otro test; `test.describe.serial` sin motivo | Pasa solo: `npx playwright test -g "<nombre>"` |
| ¿El pipeline puede fallar en silencio? | `continue-on-error`, `\|\| true`, un paso comentado | `npm run test:pipeline` |
| ¿El workflow da más poder del necesario? | Sin `permissions`, `write` sin explicar, `${{ github.event.* }}` en un `run:` | `npm run test:pipeline` · actionlint |
| ¿La decisión está escrita? | Una dependencia, un límite o una excepción nueva sin ADR | `docs/adr/` en el mismo PR |
| ¿La documentación sigue diciendo la verdad? | Un ADR, el README o el onboarding que describen otra cosa | Leer el ADR afectado contra el diff |

Fuentes: R. C. Martin, *Clean Architecture* (2017), caps. 7–11; E. Evans, *Domain-Driven Design* (2003); V. Vernon, *Implementing Domain-Driven Design* (2013); documentación de ESLint (`no-restricted-imports`, `no-restricted-globals`); TypeScript 4.9 (`satisfies`); A. Cockburn, *Hexagonal Architecture* (2005); M. Seemann y S. van Deursen, *Dependency Injection Principles, Practices, and Patterns* (2019); G. Meszaros, *xUnit Test Patterns* (2007); react.dev («You Might Not Need an Effect», «Choosing the State Structure», «Reusing Logic with Custom Hooks»); documentación de React Router (`useSearchParams`) y de TanStack Query; OWASP Top Ten (2021) y OWASP Cheat Sheet Series (Cross-Site Scripting Prevention, Session Management); MDN (`Set-Cookie`, `SameSite`, `credentials`); documentación de Node.js (`node:crypto`) y de Vite (variables de entorno `VITE_`); react.dev (`Profiler`, `memo`, `lazy`, error boundaries); web.dev (Core Web Vitals); M. Feathers, *Working Effectively with Legacy Code* (2004); M. Fowler, *Refactoring* (2.ª ed., 2018), «BranchByAbstraction» y «StranglerFigApplication»; P. Hodgson, «Feature Toggles» (2017); documentación de Stryker Mutator; G. Meszaros, *xUnit Test Patterns* (2007), «Test Double» y «Object Mother»; N. Pryce, «Test Data Builders» (2007); V. Khorikov, *Unit Testing* (2020), caps. 4–5; documentación de Testing Library (queries, `user-event`, `jest-dom`) y de MSW; WAI-ARIA Authoring Practices 1.2 (`aria-invalid`, `aria-describedby`, diálogos); M. Fowler, «ContractTest» e «IntegrationTest»; documentación de Vitest (`vi.fn`, entornos de prueba).; documentación de Playwright (locators, assertions, best practices, webServer, CI); documentación de GitHub Actions («Secure use reference», `permissions`, `concurrency`); documentación de GitHub Copilot (code review, custom instructions) y de Visual Studio Code (agent skills); M. Nygard, «Documenting Architecture Decisions» (2011); conventionalcomments.org.
