# Plan de refactor incremental · Devoluciones

Laboratorio de la Sesión 10 · **Fase 3** (10 min). Punto de partida: `docs/devoluciones/mapa.md` y la red de `src/pages/returns.characterization.test.tsx`.
Pídele a Copilot una propuesta (`/planificar-refactor`) y después **decide tú**: ordena, parte o tacha pasos. Ningún paso empieza con la red en rojo.

## Decisión de estructura
¿Dónde vive Devoluciones? Marca una y justifícala en una frase con la guía de decisión (`docs/guia-de-decision.md`).
- [ ] Dentro de `src/orders`, como una capacidad más de Pedidos
- [ ] Feature propia `src/returns`, con su API pública y capas solo donde paguen
- [ ] Un vertical slice por caso de uso (`request-return/`)
- [ ] Dejarla como está y solo arreglar la seguridad

Justificación:

## Pasos
| # | Paso (un PR) | Qué cambia | Qué NO cambia | Red de seguridad (comando) | Cómo se revierte | Riesgo |
|---|---|---|---|---|---|---|
| 1 | Completar la caracterización | Solo tests | Producción | `npm run lab:red` | Borrar el archivo | Ninguno |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |
| 6 | | | | | | |

## Preguntas abiertas para Producto
Una por cada `RAREZA ·` de los tests. El plan no las responde: dice en qué paso se aplicaría la respuesta.

| # | Pregunta | Comportamiento actual (test) | Se aplicaría en el paso |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |

## Lo que la IA propuso y he descartado
- 
