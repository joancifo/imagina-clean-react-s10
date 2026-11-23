// TEMA 18 · La escalera de consultas de React Testing Library.
// De arriba abajo, cada peldaño se parece menos a cómo encuentra las cosas una persona
// y se rompe más fácil cuando cambia la maquetación.
//
//   1. getByRole(rol, { name })  ← lo que ve quien mira y oye quien escucha. Empieza SIEMPRE aquí.
//   2. getByLabelText            ← campos de formulario con su etiqueta
//   3. getByText                 ← contenido visible que no es un control
//   4. getByTestId               ← último recurso: no significa nada para nadie salvo para el test
//   5. container.querySelector   ← no es una consulta de RTL: es acoplarse al HTML
//
// Documentación: https://testing-library.com/docs/queries/about#priority
import { render, screen } from '@testing-library/react';

function PanelDePedido({ compacto }: { compacto: boolean }) {
  // Dos maquetaciones distintas para EL MISMO contenido: es el refactor visual de cualquier martes.
  return compacto ? (
    <section aria-label="Pedido P-1001">
      <b>Pedido P-1001</b> <em className="estado">Pendiente</em>
      <button data-testid="cancelar">Cancelar</button>
    </section>
  ) : (
    <section aria-label="Pedido P-1001">
      <h2>Pedido P-1001</h2>
      <p>
        Estado: <span className="badge">Pendiente</span>
      </p>
      <footer>
        <button data-testid="cancelar">Cancelar</button>
      </footer>
    </section>
  );
}

describe.each([[false], [true]])('el mismo panel, maquetación compacta = %s', (compacto) => {
  beforeEach(() => render(<PanelDePedido compacto={compacto} />));

  it('1 · por rol y nombre accesible: sobrevive a los dos', () => {
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeEnabled();
    expect(screen.getByRole('region', { name: 'Pedido P-1001' })).toBeInTheDocument();
  });

  it('3 · por texto: sobrevive porque el TEXTO no ha cambiado', () => {
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('4 · por test id: sobrevive, pero el test ya no dice nada sobre la persona usuaria', () => {
    expect(screen.getByTestId('cancelar')).toBeInTheDocument();
  });
});

describe('lo que se rompe en cuanto alguien cambia la maquetación', () => {
  it('buscar por clase CSS o por estructura: el contenido es el mismo y el test falla igual', () => {
    const { container, rerender } = render(<PanelDePedido compacto={false} />);
    expect(container.querySelector('.badge')?.textContent).toBe('Pendiente');
    expect(container.querySelector('h2')).not.toBeNull();

    rerender(<PanelDePedido compacto={true} />); // mismo contenido, otra maquetación
    expect(container.querySelector('.badge')).toBeNull(); // ← aquí falla un test acoplado al HTML
    expect(screen.getByText('Pendiente')).toBeInTheDocument(); // y aquí no
  });
});
