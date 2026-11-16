// TEMA 10 · Estado derivado: se CALCULA, no se sincroniza.
// Referencia: react.dev · «You Might Not Need an Effect».
// Mismo componente, dos versiones. La del efecto pinta primero un dato INCORRECTO y renderiza el doble.
import { fireEvent, render, screen } from '@testing-library/react';
import { useEffect, useState } from 'react';

const ORDERS = [{ id: 'P-1', status: 'pending' }, { id: 'P-2', status: 'approved' }, { id: 'P-3', status: 'pending' }];
const countByStatus = (status: string) => ORDERS.filter((order) => order.status === status).length;

/** ✗ Estado derivado guardado con useState y sincronizado con useEffect (como los Efectos 3 y 4 de OrderDesk). */
function WithEffect({ onRender }: { onRender: (shown: string) => void }) {
  const [status, setStatus] = useState('pending');
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(countByStatus(status));
  }, [status]);
  onRender(`${status}:${count}`);
  return <button onClick={() => setStatus('approved')}>{count} pedidos</button>;
}

/** ✓ El contador se calcula durante el render a partir del estado mínimo. */
function Calculated({ onRender }: { onRender: (shown: string) => void }) {
  const [status, setStatus] = useState('pending');
  const count = countByStatus(status);
  onRender(`${status}:${count}`);
  return <button onClick={() => setStatus('approved')}>{count} pedidos</button>;
}

it('✗ con efecto: 4 renders y dos fotogramas con un contador que no corresponde al filtro', () => {
  const frames: string[] = [];
  render(<WithEffect onRender={(shown) => frames.push(shown)} />);
  fireEvent.click(screen.getByRole('button'));
  expect(frames).toEqual([
    'pending:0', //  ✗ primer render: hay 2 pendientes, pero el efecto aún no se ha ejecutado
    'pending:2',
    'approved:2', // ✗ el filtro ya ha cambiado y el contador es el del filtro anterior
    'approved:1',
  ]);
});

it('✓ calculado: 2 renders y nunca hay un dato incoherente', () => {
  const frames: string[] = [];
  render(<Calculated onRender={(shown) => frames.push(shown)} />);
  fireEvent.click(screen.getByRole('button'));
  expect(frames).toEqual(['pending:2', 'approved:1']);
});
