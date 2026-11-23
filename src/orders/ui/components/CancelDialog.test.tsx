// Ejercicio S8 · Parte B · El diálogo de cancelación, probado como lo usa una persona.
//
// `fireEvent.change` pone el valor entero de golpe: es lo que hace un pegado, no lo que hace alguien
// escribiendo. `userEvent` escribe tecla a tecla, mueve el foco, respeta `disabled` y dispara los mismos
// eventos que el navegador. Dos de los tests de este archivo solo fallan con `userEvent`.
//
// Documentación: https://testing-library.com/docs/user-event/intro
// OMITIDO de partida · Quita el `.skip` cuando empieces la Parte B. Dos de estos tests fallan: son el ejercicio.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CancelDialog } from './CancelDialog';

const MOTIVO = 'Cliente duplicado en el ERP';

function open(props: Partial<React.ComponentProps<typeof CancelDialog>> = {}) {
  const onConfirm = vi.fn();
  const onClose = vi.fn();
  const user = userEvent.setup();
  const view = render(<CancelDialog orderId="P-1001" busy={false} error={null} onConfirm={onConfirm} onClose={onClose} {...props} />);
  return { ...view, user, onConfirm, onClose, field: () => screen.getByLabelText('Motivo') };
}

describe.skip('Parte B · diálogo de cancelación', () => {
  it('se presenta: tiene nombre accesible y dice qué pedido se va a cancelar', () => {
    open();
    expect(screen.getByRole('dialog', { name: 'Cancelar pedido' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cancelar P-1001' })).toBeInTheDocument();
  });

  // Quien navega con teclado estaba en la fila de la tabla. Si el foco no entra, no se entera de que hay un diálogo.
  it('al abrirse, el foco entra en el motivo', () => {
    const { field } = open();
    expect(field()).toHaveFocus();
  });

  // El que destapa el recorte en cada pulsación: tecla a tecla, los espacios ENTRE palabras desaparecen.
  it('lo que se escribe es lo que se envía', async () => {
    const { user, field, onConfirm } = open();
    await user.type(field(), MOTIVO);
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(onConfirm).toHaveBeenCalledWith(MOTIVO);
  });

  it('los espacios de los extremos se quitan al ENVIAR, no mientras se escribe', async () => {
    const { user, field, onConfirm } = open();
    await user.type(field(), `   ${MOTIVO}  `);
    expect(field()).toHaveValue(`   ${MOTIVO}  `); // mientras escribe, nadie le toca el texto
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(onConfirm).toHaveBeenCalledWith(MOTIVO);
  });

  it('el error se anuncia Y queda atado al campo que lo provoca', () => {
    const { field } = open({ error: 'El motivo debe tener al menos 10 caracteres' });
    expect(screen.getByRole('alert')).toHaveTextContent('El motivo debe tener al menos 10 caracteres');
    expect(field()).toBeInvalid();
    expect(field()).toHaveAccessibleDescription('El motivo debe tener al menos 10 caracteres');
  });

  it('sin error, el campo no está marcado como inválido', () => {
    const { field } = open();
    expect(field()).toBeValid();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('mientras envía no se puede confirmar otra vez', async () => {
    const { user, onConfirm } = open({ busy: true });
    const confirm = screen.getByRole('button', { name: 'Confirmar' });
    expect(confirm).toBeDisabled();
    await user.click(confirm).catch(() => undefined);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('«Volver» cierra y no envía nada', async () => {
    const { user, onClose, onConfirm } = open();
    await user.click(screen.getByRole('button', { name: 'Volver' }));
    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
