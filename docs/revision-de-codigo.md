# Revisión de código en OrderDesk

Una revisión no comprueba que el código «esté bien escrito»: comprueba que el cambio **no introduce acoplamiento, riesgo ni deuda que nadie ha decidido**. El estilo lo revisan las herramientas.

## Quién revisa qué
| Capa | Qué mira | Cómo |
|---|---|---|
| 1 · Herramientas | Formato, tipos, reglas de capas, secretos, tests, presupuesto, journeys | El pipeline (`.github/workflows/ci.yml`). Si está en rojo, no se revisa a mano |
| 2 · Copilot code review | Primera pasada con los criterios del repositorio | `.github/copilot-instructions.md` y `.github/instructions/*.instructions.md`. Deja comentarios; no aprueba |
| 3 · Una persona | Lo que ni una herramienta ni la IA pueden valorar: si la decisión es la correcta, si encaja con el producto, si el ADR dice la verdad | `docs/checklist-pr.md` |

La capa 2 **no sustituye** a la 3. Copilot lee el diff y las instrucciones; no sabe qué se habló en la reunión de producto ni qué se rompió el mes pasado.

## Cómo se escribe un comentario (Conventional Comments)
```
<etiqueta> (<bloqueante|no bloqueante>): <asunto>
<por qué importa>
<propuesta o pregunta>
```
| Etiqueta | Úsala para |
|---|---|
| `issue` | Un problema concreto. Si es bloqueante, dilo |
| `suggestion` | Una mejora con propuesta |
| `question` | No lo entiendes. Es legítimo y a menudo destapa un problema |
| `nitpick` | Detalle menor, nunca bloqueante |
| `praise` | Algo que está bien hecho y merece repetirse |
| `todo` | Algo pequeño y necesario antes de fusionar |
| `thought` | Una idea para más adelante, sin acción ahora |

Formato descrito en conventionalcomments.org.

**Ejemplo:**
```
issue (bloqueante): la pantalla importa el adapter HTTP
src/orders/ui/OrdersListPage.tsx:9
`ui` no puede importar `infrastructure` (ADR-002): la pantalla queda atada a HTTP y sus tests a la red.
¿Puede llegar por `useOrdersModule()` como el resto de casos de uso? `npm run lint:arch` lo marca.
```

## Reglas del equipo
1. **PR pequeños.** Si la descripción necesita la palabra «además», son dos PR.
2. La descripción dice **qué cambia, por qué y cómo se ha comprobado**. Sin eso, el primer comentario es pedirlo.
3. Un comentario sin `ruta:línea` es una opinión.
4. Como mucho un ciclo de «cambios solicitados» por cosa: si después sigue sin acuerdo, se habla en persona o se escribe un ADR.
5. Se revisa también la documentación: un ADR que no coincide con el código es un defecto.
6. Un cambio asistido por IA se revisa igual que cualquier otro. «Lo ha escrito Copilot» no es una justificación ni un atenuante.
