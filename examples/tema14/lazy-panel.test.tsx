// TEMA 14 · El código perezoso no se descarga hasta que hace falta, y mientras llega se ve un fallback.
import { fireEvent, render, screen } from '@testing-library/react';
import { createLazyPanel } from './lazy-panel';

it('el informe no se descarga al abrir la pantalla, solo al pedirlo', async () => {
  const loader = vi.fn(async () => ({ default: () => <h2>Informe mensual</h2> }));
  const PanelOnDemand = createLazyPanel(loader);
  render(<PanelOnDemand />);
  expect(loader).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: 'Ver informe' }));
  expect(screen.getByText('Cargando informe…')).toBeInTheDocument();
  expect(await screen.findByRole('heading', { name: 'Informe mensual' })).toBeInTheDocument();
  expect(loader).toHaveBeenCalledTimes(1);
});
