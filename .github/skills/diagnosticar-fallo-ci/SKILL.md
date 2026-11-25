---
name: diagnosticar-fallo-ci
description: Diagnostica un fallo del pipeline de CI de OrderDesk (GitHub Actions) a partir de su log. Úsala cuando alguien pegue la salida de un job fallido, adjunte un log de examples/tema21/logs o pregunte por qué ha fallado la CI.
---
# Diagnosticar un fallo de CI de OrderDesk

El pipeline está en [.github/workflows/ci.yml](../../workflows/ci.yml) y sus decisiones, en [docs/adr/007-e2e-y-ci.md](../../../docs/adr/007-e2e-y-ci.md).

## Pasos
1. Identifica el **job** y el **paso** que fallan. Si el log no lo dice, pregúntalo antes de seguir.
2. Clasifica el fallo en UNO de estos tipos: código · test · dependencias · configuración del pipeline · rendimiento · seguridad. Si dudas entre dos, dilo.
3. Cita la **línea exacta** del log que sostiene el diagnóstico. Sin cita, es una hipótesis y así se dice.
4. Da el **comando para reproducirlo en local** (los scripts de `package.json`: `npm run typecheck`, `npm run test:e2e`, `npm run test:pipeline`…).
5. Propón el **cambio mínimo** que lo arregla, con la ruta del archivo.
6. Si es un E2E, distingue fallo **determinista** (falla en todos los intentos) de **intermitente** (pasa en un reintento). Para los intermitentes, pide la traza (`playwright-report`) antes de proponer nada.

## Formato de la respuesta
```
Job / paso:      …
Tipo:            …
Evidencia:       «línea del log»
Reproducir:      $ …
Causa probable:  …
Cambio mínimo:   ruta — qué cambia
Valida:          quién y cómo (test, revisión, administración del repositorio)
```

## Lo que NUNCA propones
- Desactivar un control para volver a verde: `continue-on-error`, `|| true`, `test.skip`, subir `retries`, subir el presupuesto de `perf-budget.json` o el `timeout` sin una medición.
- Tocar `permissions`, secretos, variables protegidas ni reglas de rama. Si el diagnóstico apunta ahí, explícalo y deja la decisión a una persona.
- Cambios en archivos que el log no menciona sin decir por qué.
