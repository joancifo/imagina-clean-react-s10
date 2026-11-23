// Ejercicio S8 · Parte B · El formulario de aprobación, probado por su comportamiento accesible.
//
// Un mensaje de error debajo de un campo lo ve quien MIRA la pantalla. Quien la escucha necesita que el
// mensaje esté ATADO al campo: `aria-invalid` dice «este campo está mal» y `aria-describedby` dice «el
// porqué está aquí». `toHaveAccessibleDescription` comprueba exactamente eso, y no el HTML que lo produce:
// el test sobrevive a un cambio de maquetación y falla si se rompe la relación.
// OMITIDO de partida · Quita el `.skip` cuando empieces la Parte B. Dos de estos tests fallan: son el ejercicio.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EMPTY_APPROVAL_FORM, type ApprovalFormErrors, type ApprovalFormInput } from '../approval-form';
import { ApproveDialog } from './ApproveDialog';

function open(options: { values?: Partial<ApprovalFormInput>; errors?: ApprovalFormErrors; busy?: boolean; total?: string | null } = {}) {
  const onChange = vi.fn();
  const onConfirm = vi.fn();
  const onClose = vi.fn();
  const user = userEvent.setup();
  render(
    <ApproveDialog
      orderId="P-1003"
      total={'total' in options ? options.total! : '6.207,30 €'}
      values={{ ...EMPTY_APPROVAL_FORM, ...options.values }}
      errors={options.errors ?? {}}
      busy={options.busy ?? false}
      onChange={onChange}
      onConfirm={onConfirm}
      onClose={onClose}
    />,
  );
  return { user, onChange, onConfirm, onClose };
}

describe.skip('Parte B · diálogo de aprobación', () => {
  it('enseña el pedido y su importe', () => {
    open();
    expect(screen.getByRole('dialog', { name: 'Aprobar pedido' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Aprobar P-1003' })).toBeInTheDocument();
    expect(screen.getByText(/Importe: 6\.207,30/)).toBeInTheDocument();
  });

  it('sin importe visible, no se inventa una línea vacía', () => {
    open({ total: null });
    expect(screen.queryByText(/Importe:/)).toBeNull();
  });

  it('cada error se ata a SU campo', () => {
    open({ errors: { note: 'note-too-short', confirmTotal: 'confirm-required', channel: 'channel-unknown' } });

    expect(screen.getByLabelText('Justificación')).toHaveAccessibleDescription('La justificación necesita al menos 10 caracteres');
    expect(screen.getByRole('checkbox')).toHaveAccessibleDescription('Confirma que has revisado el importe');
    expect(screen.getByLabelText('Canal')).toHaveAccessibleDescription('Elige un canal de la lista');

    expect(screen.getByLabelText('Justificación')).toBeInvalid();
    expect(screen.getByRole('checkbox')).toBeInvalid();
    expect(screen.getByLabelText('Canal')).toBeInvalid();
  });

  it('sin errores, ningún campo está marcado como inválido', () => {
    open();
    expect(screen.getByLabelText('Justificación')).toBeValid();
    expect(screen.getByRole('checkbox')).toBeValid();
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
  });

  it('escribir la justificación avisa al contenedor en cada pulsación', async () => {
    const { user, onChange } = open();
    await user.type(screen.getByLabelText('Justificación'), 'Cli');
    expect(onChange).toHaveBeenCalledTimes(3);
    // Cada pulsación avisa con el valor del campo: el componente NO guarda estado, lo guarda el contenedor.
    expect(onChange).toHaveBeenNthCalledWith(1, { note: 'C' });
  });

  it('marcar la casilla y cambiar el canal avisan con el valor nuevo', async () => {
    const { user, onChange } = open();
    await user.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith({ confirmTotal: true });
    await user.selectOptions(screen.getByLabelText('Canal'), 'phone');
    expect(onChange).toHaveBeenCalledWith({ channel: 'phone' });
  });

  it('mientras envía, confirmar está deshabilitado y la pantalla lo dice', async () => {
    const { user, onConfirm } = open({ busy: true });
    const confirm = screen.getByRole('button', { name: 'Confirmar aprobación' });
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveAttribute('aria-busy', 'true');
    await user.click(confirm).catch(() => undefined);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
