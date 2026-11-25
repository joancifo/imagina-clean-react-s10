---
applyTo: ".github/workflows/**"
---
# Pipeline de CI (Sesión 9)

- Antes de cambiar el pipeline, comprueba la especificación: `npm run test:pipeline` (`scripts/pipeline.test.mjs`). Si un cambio la pone en rojo, el cambio está mal o la decisión ha cambiado y necesita un ADR.
- `permissions` a nivel de workflow: `contents: read`. Se amplían solo en el job que lo necesite, con un comentario que diga por qué.
- Ningún `${{ github.event.* }}` dentro de `run:`: los datos del evento entran por `env:` y se usan como variable de entorno.
- `npm ci`, nunca `npm install`. Node desde `.nvmrc` (`node-version-file`), con `cache: npm`.
- Nada de `continue-on-error`, `|| true` ni pasos comentados para volver a verde. Un control que molesta se discute en un PR, no se silencia.
- Cada job con `timeout-minutes`. Los E2E dependen de `quality` (`needs`) y suben `playwright-report` con `if: ${{ !cancelled() }}`.
- Cambios en permisos, secretos, entornos, despliegues o reglas de rama: propón el cambio y deja la decisión a una persona. No los apliques.
