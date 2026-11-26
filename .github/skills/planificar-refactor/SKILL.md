---
name: planificar-refactor
description: Convierte el mapa y la red de caracterización de un módulo heredado de OrderDesk en un plan de refactor incremental, en pasos pequeños, reversibles y revisables, con su red de seguridad y su forma de volver atrás. Úsala cuando pidan un plan de migración, un plan de refactor o los siguientes pasos para src/pages/ReturnsPage.tsx.
---
# Plan de refactor incremental

Entrada: `docs/devoluciones/mapa.md` y `src/pages/returns.characterization.test.tsx`. Salida: la tabla de `docs/devoluciones/plan.md`.

## Reglas del plan
1. **Cada paso es un PR** que se puede revisar en 15 minutos y desplegar solo. Si no cabe, pártelo.
2. **La red primero**: el paso 1 es siempre completar la caracterización. Ningún paso empieza con la red en rojo.
3. **De dentro afuera**: primero reglas puras (dominio), después contratos (puertos y adapters), después servidor (BFF), después pantalla. Explica si propones otro orden.
4. **Rama por abstracción**: la pantalla nueva convive con la heredada detrás de un flag (`src/shell/flags.tsx`); la heredada se borra en un paso propio, al final.
5. Por cada paso: qué cambia, qué **no** cambia, qué tests lo protegen (comando), cómo se **revierte** y qué **riesgo** tiene.
6. **Preguntas abiertas**: cada `RAREZA ·` de los tests es una pregunta para Producto. El plan no las resuelve: dice en qué paso se podría aplicar la respuesta.

## Lo que NO es un buen plan
- Un paso «reescribir la pantalla».
- Introducir patrones o librerías sin un problema concreto que resuelvan (contenedor IoC, CQRS, una librería de estado).
- Pasos que cambian comportamiento sin declararlo.
- Un plan sin la parte de servidor cuando el cliente decide importes o permisos.

## Límites
- No escribas código: solo el plan. La persona decide el orden final y qué pasos se hacen.
