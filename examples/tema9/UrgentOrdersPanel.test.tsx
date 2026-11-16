// TEMA 9 · Un componente presentacional se prueba con props: sin mocks, sin providers, sin esperas.
import { fireEvent, render, screen } from '@testing-library/react';
import { fromList, type AsyncState } from './async-state';
import { UrgentOrdersPanel, type UrgentOrderItem } from './UrgentOrdersPanel';

const ITEMS: UrgentOrderItem[] = [{ id: 'P-1003', customer: 'Construcciones Vega', total: '6.207,30 €' }];
const show = (state: AsyncState<UrgentOrderItem[]>, handlers = { onRetry: vi.fn(), onOpen: vi.fn() }) => {
  render(<UrgentOrdersPanel state={state} {...handlers} />);
  return handlers;
};

it('loading', () => {
  show({ status: 'loading' });
  expect(screen.getByRole('status')).toHaveTextContent('Cargando pedidos urgentes…');
});

it('error: mensaje y una salida (reintentar)', () => {
  const { onRetry } = show({ status: 'error', message: 'No hay conexión con el servidor' });
  expect(screen.getByRole('alert')).toHaveTextContent('No hay conexión con el servidor');
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
  expect(onRetry).toHaveBeenCalledOnce();
});

it('empty: un mensaje propio, no una lista en blanco', () => {
  show(fromList<UrgentOrderItem>([]));
  expect(screen.getByText(/No hay pedidos urgentes/)).toBeInTheDocument();
  expect(screen.queryByRole('list')).toBeNull();
});

it('success: pinta lo que recibe y avisa con el identificador', () => {
  const { onOpen } = show(fromList(ITEMS));
  fireEvent.click(screen.getByRole('button', { name: 'P-1003' }));
  expect(onOpen).toHaveBeenCalledWith('P-1003');
  expect(screen.getByText(/Construcciones Vega · 6\.207,30 €/)).toBeInTheDocument();
});
