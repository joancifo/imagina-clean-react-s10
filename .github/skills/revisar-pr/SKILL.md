---
name: revisar-pr
description: Revisa un Pull Request de OrderDesk con la checklist de arquitectura del equipo y comentarios en formato Conventional Comments. Úsala cuando pidan revisar un PR, un diff, un parche de examples/tema22 o los cambios de la rama actual.
---
# Revisar un Pull Request de OrderDesk

Criterios: [docs/checklist-pr.md](../../../docs/checklist-pr.md) y [docs/revision-de-codigo.md](../../../docs/revision-de-codigo.md).

## Pasos
1. Resume en dos líneas **qué cambia y por qué**, según la descripción del PR. Si no hay descripción, ese es el primer comentario.
2. Recorre la checklist por bloques. Solo comenta lo que tenga **evidencia en el diff** (`ruta:línea`).
3. Prioriza por riesgo: límites de capa y datos de fuera → seguridad → tests que no comprueban → el resto.
4. Indica qué **comandos** confirmarían cada hallazgo (`npm run lint:arch`, `npm run test:weak`, `npm run audit:secrets`…).

## Formato de cada comentario (Conventional Comments)
```
<etiqueta> (<bloqueante|no bloqueante>): <asunto>
ruta:línea
<por qué importa, en una o dos frases>
<propuesta concreta o pregunta>
```
Etiquetas: `issue`, `suggestion`, `question`, `nitpick`, `praise`, `todo`, `thought`.

## Límites
- Como mucho 8 comentarios. Si hay más, agrúpalos por causa.
- Nada de estilo que ya resuelve una herramienta (formato, orden de imports).
- No apruebes ni rechaces: la decisión es de una persona. Cierra con «Riesgos que no puedo valorar desde el diff».
