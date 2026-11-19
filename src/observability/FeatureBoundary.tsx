// OBSERVABILIDAD · Límite de error por feature: si una pantalla se rompe, se rompe SOLA.
// Degradación controlada: el resto de la aplicación (cabecera, navegación, otras rutas) sigue funcionando,
// la persona usuaria ve un aviso que entiende y el equipo recibe una entrada 'ui.crash' con la feature.
// React solo captura errores de render con un componente de clase (react.dev · «Catching rendering errors with an error boundary»).
import { Component, type ReactNode } from 'react';
import type { Logger } from './port';
import { useLogger } from './ObservabilityProvider';

type Props = { feature: string; fallback?: ReactNode; children: ReactNode };
type InnerProps = Props & { logger: Logger };

class Boundary extends Component<InnerProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    // El TIPO del error y la feature. El mensaje y la pila no viajan: pueden contener datos de la pantalla.
    this.props.logger.log({ level: 'error', event: 'ui.crash', feature: this.props.feature, fields: { errorName: error instanceof Error ? error.name : typeof error } });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return this.props.fallback ?? (
      <main className="page" role="alert">
        No se ha podido mostrar esta pantalla. Recarga la página; si vuelve a pasar, ya nos ha llegado el aviso.
      </main>
    );
  }
}

export function FeatureBoundary(props: Props) {
  return <Boundary {...props} logger={useLogger()} />;
}
