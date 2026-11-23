// TEMA 18 · Los cuatro estados de cualquier pantalla que lee datos.
// Si un componente solo se prueba con datos, la mitad de lo que ve la persona usuaria no se prueba nunca:
// la espera, el vacío y el error son tres pantallas más, y las tres salen en producción.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

type Estado = { status: 'loading' } | { status: 'ready'; items: string[] } | { status: 'error' };

function ListaDePedidos({ estado, onRetry }: { estado: Estado; onRetry: () => void }) {
  if (estado.status === 'loading') return <p>Cargando…</p>;
  if (estado.status === 'error')
    return (
      <div>
        <p role="alert">No se pudieron cargar los pedidos</p>
        <button onClick={onRetry}>Reintentar</button>
      </div>
    );
  if (estado.items.length === 0) return <p>Todavía no hay pedidos</p>;
  return (
    <ul>
      {estado.items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

const render4 = (estado: Estado) => {
  const onRetry = vi.fn();
  return { onRetry, ...render(<ListaDePedidos estado={estado} onRetry={onRetry} />) };
};

it('cargando: lo dice, y no enseña una lista vacía que parezca «no hay nada»', () => {
  render4({ status: 'loading' });
  expect(screen.getByText('Cargando…')).toBeInTheDocument();
  expect(screen.queryByRole('list')).toBeNull();
});

it('vacío: «todavía no hay» es una frase distinta de «ha fallado»', () => {
  render4({ status: 'ready', items: [] });
  expect(screen.getByText('Todavía no hay pedidos')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).toBeNull();
});

it('error: se anuncia con role="alert" y ofrece una salida', async () => {
  const user = userEvent.setup();
  const { onRetry } = render4({ status: 'error' });
  expect(screen.getByRole('alert')).toHaveTextContent('No se pudieron cargar los pedidos');
  await user.click(screen.getByRole('button', { name: 'Reintentar' }));
  expect(onRetry).toHaveBeenCalled();
});

it('con datos: una lista con sus elementos', () => {
  render4({ status: 'ready', items: ['P-1001', 'P-1002'] });
  expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['P-1001', 'P-1002']);
});
