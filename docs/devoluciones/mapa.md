# Mapa de Devoluciones heredada · `src/pages/ReturnsPage.tsx`

Laboratorio de la Sesión 10 · **Fase 1** · Versión de referencia de Joan Cifo (rama `solucion-s10`). Las líneas son las de `main`, antes del primer paso.

## 1 · Responsabilidades
| # | Responsabilidad | Evidencia (`ruta:línea`) | Capa destino | ¿Hecho o hipótesis? |
|---|---|---|---|---|
| 1 | Saber quién es el usuario (pide `/api/me` por su cuenta, al margen de `src/session`) | `ReturnsPage.tsx:27` | Composición: la sesión ya existe (`useSession`) | Hecho |
| 2 | Cargar pedido, entrega y devoluciones previas, en cadena | `ReturnsPage.tsx:28-40` | Infraestructura (adapter) + BFF (agregación) | Hecho |
| 3 | Calcular el reembolso: descuento por nivel, IVA, reposición, redondeo | `ReturnsPage.tsx:44-54` | Dominio | Hecho |
| 4 | Decidir quién puede: el agente no; el manager hasta 500 € | `ReturnsPage.tsx:58`, `:88`, `:146-148` | Dominio (regla) + BFF (autorización real) | Hecho |
| 5 | Decidir si se puede devolver: entregado y dentro de plazo | `ReturnsPage.tsx:66`, `:75-76` | Dominio | Hecho |
| 6 | Calcular las unidades que quedan por devolver | `ReturnsPage.tsx:85-87` | Dominio | Hecho |
| 7 | Validar la cantidad y registrar la devolución | `ReturnsPage.tsx:90-106` | Aplicación (caso de uso) + adapter | Hecho |
| 8 | Avisar y volver al detalle | `ReturnsPage.tsx:108-109` | Presentación | Hecho |
| 9 | Dejar rastro (`console.log` con el nombre del cliente) | `ReturnsPage.tsx:107` | Observabilidad (`Logger`), sin datos personales | Hecho |
| 10 | Pintar el formulario y los textos | `ReturnsPage.tsx:112-152` | Presentación | Hecho |

## 2 · Dependencias externas
| URL | ¿Después de qué? | Campos que usa | Si falla… | Evidencia |
|---|---|---|---|---|
| `GET /api/me` (BFF) | Nada: en paralelo | `usr_id`, `usr_role` | Se queda en «Cargando…» | `:27`, `:56` |
| `GET /api/orders/:id` (BFF) | Nada | `ord_id`, `cust_nm`, `cust_tier`, `ord_st`, `ln_items[].sku/qty/unit_prc` | Promesa rechazada sin capturar; «Cargando…» | `:28-31` |
| `GET /api/carrier/shipments/:id` (transportista, a través del BFF sin cambios) | El pedido | `trk_no`, `sts_cd`, `dlv_ts` | `.catch(() => {})`: «Cargando…» para siempre (test T4). Si responde 404, `{ msg }` se toma por envío: «todavía no se ha entregado» | `:33-36` |
| `GET /api/returns?ord_id=` (API heredada) | El pedido | `sku`, `qty` | Rechazo sin capturar; la pantalla sigue con `[]` y deja devolver todo | `:37-39` |
| `POST /api/returns` (API heredada) | El clic | Envía `ord_id, sku, qty, rsn_cd, rfd_amt, req_by, req_role` | «Error NNN» | `:96-106` |

## 3 · Reglas de negocio escondidas
| Regla (en palabras de negocio) | Evidencia | ¿En `shared/policy.json` o en el BFF? | ¿`npm run rules`? |
|---|---|---|---|
| Descuento por nivel: gold 10 %, silver 5 % | `:49` | Sí, `pricing.discountByTier` (duplicado a mano) | Sí |
| IVA del 21 % | `:50` | Sí, `pricing.vat` (duplicado a mano) | Sí |
| Reposición del 15 % salvo defectuoso o gold, sobre el precio sin descuento ni IVA | `:52`, `:145` (dos veces) | No | No (no ve `0.15` como porcentaje) |
| Plazo: 30 × 24 horas desde la hora de entrega | `:75-76` | No | No |
| Solo pedidos enviados y entregados por el transportista | `:66` | El BFF conoce `shipped`, no `DLV` | Sí (estado) |
| Un agente no gestiona devoluciones | `:58` | No | Sí (rol) |
| Un manager no registra más de 500 € | `:88` | No | Sí (rol + umbral) |
| No se devuelve más de lo pedido menos lo ya devuelto | `:86-87`, `:91` | No (la API guarda cualquier cantidad) | No |

## 4 · Riesgos
| Riesgo | Tipo | Evidencia |
|---|---|---|
| El cliente envía el importe (`rfd_amt`) y su rol (`req_role`); la API los guarda sin comprobar: cualquiera puede registrar el reembolso que quiera | Seguridad | `ReturnsPage.tsx:100` · `server/returns-legacy.mjs` (`router.post('/returns')`) |
| El límite de 500 € y el «agente no» solo existen en la pantalla | Seguridad | `:58`, `:88` |
| Nombre del cliente e importe en la consola | Datos personales | `:107` |
| Plazo calculado con `Date.now()` y horas: depende de la hora de entrega y de la zona horaria de quien mira | Fechas | `:75` |
| Errores tragados: transportista caído = «Cargando…» para siempre | Errores tragados | `:36` |
| Datos de fuera sin parsear (`AnyProps`), nombres del backend en el JSX | Frontera | `:15-18`, `:118-147` |
| Reglas duplicadas con el resto de la app (descuento, IVA) que pueden separarse | Otro | `:49-50` frente a `src/orders/domain/order.ts` |

## 5 · Lo que Copilot dijo y NO era cierto
Ejemplos reales de las pruebas con Copilot (pueden variar):
- «El cálculo del reembolso aplica el 15 % sobre el importe con descuento»: falso, lo aplica sobre `base` (`:52`). Lo desmiente el test de silver (64,97 €).
- «La pantalla muestra un error si el transportista no responde»: falso, `.catch(() => {})` (`:36`) se lo traga.
- «El BFF comprueba el rol antes de guardar la devolución»: falso, solo comprueba que hay sesión (`server/bff.mjs`, `app.use(['/api/carrier', '/api/returns'], authenticated)`).
