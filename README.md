# OrderDesk · repositorio de prácticas

Curso **Clean Architecture para Frontend con React y Node — SOLID, Code Smells, Patrones y Testing** · Imagina Formación · Joan Cifo

> Proyecto de formación con **code smells y errores sembrados a propósito**. Datos e historial de commits ficticios (el historial está simulado para practicar el análisis de hotspots). No lo despliegues ni reutilices su código.

OrderDesk es un backoffice de pedidos B2B: listado, detalle, aprobación, cancelación y panel. **Funciona, y ese es el problema:** su estructura hace que cada cambio sea caro y arriesgado.

## Requisitos
- Node.js LTS y npm · Git · Visual Studio Code con la extensión de GitHub Copilot

## Arranque
```bash
npm install
npm run dev     # web: http://localhost:5173 · API: http://localhost:3001
```
Usuario activo: clave `userId` de `localStorage` (`u1` admin, `u2` manager, `u3` agente).

## Comandos
| Comando | Qué responde |
|---|---|
| `npm test` | ¿Pasan los tests actuales? |
| `npm run coverage` | ¿Qué código ejecutan los tests? |
| `npm run demo:tema1` | Regla pura y caso de uso probados sin React, navegador ni red |
| `npm run map` | Inventario: líneas, imports salientes y entrantes por módulo |
| `npm run cycles` | Dependencias circulares (madge) |
| `npm run smells` | Complejidad, tamaño y reglas de hooks (ESLint) |
| `npm run deps` | Dependencias sin usar (knip) |
| `npm run hotspots` | Archivos con más commits |
| `npm run demo:tema3` | Ejemplos SOLID (SRP, OCP, LSP, ISP, DIP) |
| `npm run demo:tema4` | Núcleo por capas probado sin React, navegador ni red |
| `npm run lint:arch` | Regla de dependencia entre capas de `src/orders` |
| `npm run test:arch` | Test que demuestra que las reglas detectan violaciones |
| `npm run demo:tema5` | Vertical slice «Aprobar pedido»: regla, comando, adapter y UI en una carpeta |
| `npm run demo:tema6` | Value object, entidad y aggregate, domain service y specification |
| `npm run boundaries` | Imports entre carpetas y accesos que se saltan la API pública de Pedidos |
| `npm run rules` | Candidatos a reglas de negocio escondidas fuera del dominio |
| `npm run lint:boundaries` | El código heredado solo importa Pedidos desde `src/orders/index.ts` |
| `npm run demo:tema7` | Casos de uso: reasignar pedido (asíncrono, 4 puertos) y presupuesto (síncrono) |
| `npm run demo:tema8` | Adapters de almacenamiento con contrato, formas de inyección y composición en Node |
| `npm run test:contract` | El mismo contrato de `OrderGateway` contra el fake en memoria y contra la API real |

## Material de la Sesión 1
- `examples/tema1/` — ejemplos ejecutables del Tema 1
- `prompts/sesion-1.md` — prompts de GitHub Copilot en modo de solo análisis
- `docs/ejercicio-s1.md` — ejercicio de diagnóstico y matriz de deuda
- `docs/proyecto-final.md` — proyecto final evolutivo
- `.github/copilot-instructions.md` — instrucciones del repositorio para Copilot

## Material de la Sesión 2
- `examples/tema3/` — un ejemplo ejecutable por principio SOLID
- `examples/tema4/` y `src/orders/` — arquitectura por capas: dominio, aplicación, infraestructura, presentación y composición
- `eslint.architecture.js` — reglas de importación por capa
- `docs/checklist-pr.md` y `.github/pull_request_template.md` — checklist SOLID para Pull Requests
- `docs/arquitectura-objetivo.md` — arquitectura objetivo de la feature Pedidos
- `.github/instructions/` — instrucciones de Copilot por ruta
- `prompts/sesion-2.md` — prompts de GitHub Copilot
- `docs/ejercicio-s2.md` — ejercicio de la sesión

## Material de la Sesión 3
- `examples/tema5/approve-order/` — un vertical slice completo con su API pública
- `examples/tema6/` — Money, entidad y aggregate, domain service y specification
- `src/orders/domain/result.ts` — errores previsibles como valores
- `src/orders/index.ts` y `eslint.boundaries.js` — API pública de la feature Pedidos
- `scripts/boundaries.mjs` y `scripts/find-rules.mjs` — análisis de estructura y de reglas
- `docs/adr/001-estructura-pedidos.md` — decisión de estructura (proyecto final)
- `prompts/sesion-3.md` — prompts de GitHub Copilot
- `docs/ejercicio-s3.md` — ejercicio de la sesión

## Material de la Sesión 4
- `examples/tema7/` — casos de uso con dobles de prueba (asíncrono y síncrono) y el antipatrón del reenvío
- `examples/tema8/` — puerto de almacenamiento con dos adapters, formas de inyección, Service Locator y ciclos de vida en Node
- `src/orders/application/ports.ts` — puertos `OrderGateway`, `Clock` y `EventPublisher`
- `src/orders/infrastructure/` — adapters HTTP y en memoria, reloj, analítica y test de contrato
- `src/orders/composition.ts`, `src/orders/ui/OrdersProvider.tsx` y `src/main.tsx` — Composition Root
- `server/app.mjs` — API ficticia reutilizable (`createApp`) que ya rechaza transiciones imposibles con 409
- `docs/adr/002-inyeccion-de-dependencias.md` — decisión de composición (proyecto final)
- `prompts/sesion-4.md` — prompts de GitHub Copilot
- `docs/ejercicio-s4.md` — ejercicio de la sesión

Trabaja en una rama propia por sesión: `git checkout -b s4/<tu-nombre>`.
