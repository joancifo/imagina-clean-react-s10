import { fireEvent, render, screen, within } from '@testing-library/react';
import { AgentOrderCard, ManagerOrderCard } from './composition';

it('manager: importe, responsable y acción, porque los ha compuesto así', () => {
  const onApprove = vi.fn();
  render(<ManagerOrderCard onApprove={onApprove} />);
  const card = screen.getByRole('article', { name: 'P-1003' });
  expect(within(card).getByText('6.207,30 €')).toBeInTheDocument();
  fireEvent.click(within(card).getByRole('button', { name: 'Aprobar' }));
  expect(onApprove).toHaveBeenCalledOnce();
});

it('agente: sin importe y sin acciones. No hay un showTotal={false}: simplemente no se ha puesto', () => {
  render(<AgentOrderCard />);
  const card = screen.getByRole('article', { name: 'P-1003' });
  expect(within(card).queryByText(/€/)).toBeNull();
  expect(within(card).queryByRole('button')).toBeNull();
});
