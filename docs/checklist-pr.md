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

Fuentes: R. C. Martin, *Clean Architecture* (2017), caps. 7–11; E. Evans, *Domain-Driven Design* (2003); V. Vernon, *Implementing Domain-Driven Design* (2013); documentación de ESLint (`no-restricted-imports`, `no-restricted-globals`); TypeScript 4.9 (`satisfies`); A. Cockburn, *Hexagonal Architecture* (2005); M. Seemann y S. van Deursen, *Dependency Injection Principles, Practices, and Patterns* (2019); G. Meszaros, *xUnit Test Patterns* (2007); react.dev («You Might Not Need an Effect», «Choosing the State Structure», «Reusing Logic with Custom Hooks»); documentación de React Router (`useSearchParams`) y de TanStack Query.
