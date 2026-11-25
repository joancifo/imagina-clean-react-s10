# Tema 22 · Revisión de código: el PR #142

Un PR de verdad: compila, sus tests pasan y su E2E está en verde. Añade un botón «Exportar CSV» a la lista de pedidos. La descripción con la que llega está en `pr-142.md`.

## Cómo verlo
```bash
git apply examples/tema22/pr-142.patch   # sobre tu rama, con lo tuyo ya guardado en un commit
git status            # 5 archivos nuevos, 2 modificados
npm test              # en verde
```
Al terminar, guarda solo `mi-revision.md` y descarta el resto: `git restore . && git clean -fd`.

## Parte C del ejercicio · Tres capas de revisión (15 minutos)
Pasos, preguntas guía y trampas en `docs/ejercicio-s9.md` (Parte C). Tu entrega es `mi-revision.md`.

1. **Herramientas (3 min).** `npm run lint:arch` · `npm run audit:secrets` · `npm run test:weak`
2. **Copilot (3 min).** `/revisar-pr revisa los cambios de esta rama`
3. **Tú (6 min).** Las ocho preguntas guía, con `docs/checklist-pr.md` y `docs/revision-de-codigo.md`.
4. **Veredicto (1 min).** ¿Entra, no entra o se habla antes?

Pista: hay al menos **nueve** problemas y **una** cosa que merece un `praise`.
