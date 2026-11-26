---
name: mapear-modulo
description: Elabora el mapa inicial de un módulo heredado de OrderDesk (responsabilidades, dependencias, reglas de negocio escondidas, efectos y riesgos) con evidencia ruta:línea, sin modificar archivos. Úsala cuando pidan mapear, entender o diagnosticar código heredado antes de refactorizarlo, por ejemplo src/pages/ReturnsPage.tsx.
---
# Mapear un módulo heredado

Objetivo: que una persona entienda QUÉ hace el módulo y DÓNDE está cada cosa antes de tocarlo. No propongas código.

## Pasos
1. Lee el módulo entero. Lista sus **responsabilidades** (qué hace, no cómo): carga de datos, reglas, permisos, presentación, envío, navegación, avisos, logs.
2. Para cada responsabilidad: `ruta:línea`, a qué **capa** pertenecería en `src/orders` (dominio, aplicación, infraestructura, presentación, composición) y si hoy está mezclada con otra.
3. **Dependencias externas**: cada URL a la que llama, en qué orden, qué campos usa de cada respuesta y qué pasa si falla.
4. **Reglas de negocio**: cada número, porcentaje, rol o estado que decide algo. Contrasta tu lista con la salida de `npm run rules`, `npm run state` y `npm run map`: si una herramienta encuentra algo que tú no, añádelo; si tú encuentras algo que ella no, dilo.
5. **Riesgos**: seguridad (qué decide el cliente que debería decidir el servidor), datos personales, fechas y zonas horarias, errores que se tragan.

## Formato
Rellena las tablas de `docs/devoluciones/mapa.md`. Marca cada fila como **Hecho** (lo has visto en el código) o **Hipótesis** (lo deduces). Si no encuentras evidencia, escribe «sin evidencia».

## Límites
- No modifiques archivos de código. Solo `docs/devoluciones/mapa.md`, y solo si te lo piden.
- No propongas soluciones todavía: eso es el plan.
- Si dos partes del código contradicen una regla de `shared/policy.json`, señálalo: es una pregunta, no un error que arreglar.
