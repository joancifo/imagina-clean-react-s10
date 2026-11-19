// Material S7 · Degradación controlada: una pantalla rota no tumba la aplicación y deja rastro.
import { render, screen } from '@testing-library/react';
import { FeatureBoundary } from './FeatureBoundary';
import { createMemoryLogger } from './memory-logger';
import { ObservabilityProvider } from './ObservabilityProvider';

function Broken(): never {
  throw new RangeError('importe imposible para Talleres Norte');
}

it('si la pantalla se rompe, se ve un aviso, el resto sigue y queda una entrada ui.crash sin datos', () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined); // React informa en consola del error capturado
  const logger = createMemoryLogger();
  render(
    <ObservabilityProvider logger={logger}>
      <nav>Menú</nav>
      <FeatureBoundary feature="orders-detail">
        <Broken />
      </FeatureBoundary>
    </ObservabilityProvider>,
  );
  expect(screen.getByRole('alert')).toHaveTextContent('No se ha podido mostrar esta pantalla');
  expect(screen.getByText('Menú')).toBeInTheDocument();
  expect(logger.entries).toEqual([expect.objectContaining({ level: 'error', event: 'ui.crash', feature: 'orders-detail', fields: { errorName: 'RangeError' } })]);
  expect(JSON.stringify(logger.entries)).not.toContain('Talleres');
});
