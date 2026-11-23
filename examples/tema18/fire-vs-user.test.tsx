// TEMA 18 · `fireEvent` frente a `userEvent`, en miniatura.
//
// `fireEvent.change` dispara UN evento con el valor entero: es lo que pasa al pegar, no al escribir.
// `userEvent.type` escribe tecla a tecla, con sus eventos de teclado, su foco y su orden.
// El componente de abajo tiene un error que cualquiera puede escribir con buena intención
// («quitamos los espacios sobrantes mientras escribe») y que solo se ve con el segundo.
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

function CampoConRecorte({ onSubmit }: { onSubmit: (value: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(value);
      }}
    >
      {/* El error: recortar en cada pulsación se come los espacios ENTRE palabras. */}
      <input aria-label="Motivo" value={value} onChange={(event) => setValue(event.target.value.trim())} />
      <button type="submit">Enviar</button>
    </form>
  );
}

const TEXTO = 'Cliente duplicado en el ERP';

it('con fireEvent el error NO se ve: el valor entra de una vez', () => {
  const onSubmit = vi.fn();
  render(<CampoConRecorte onSubmit={onSubmit} />);

  fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: TEXTO } });
  fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));

  expect(onSubmit).toHaveBeenCalledWith(TEXTO); // verde, y la aplicación está rota
});

it('con userEvent el error salta: tecla a tecla, los espacios desaparecen', async () => {
  const onSubmit = vi.fn();
  const user = userEvent.setup();
  render(<CampoConRecorte onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText('Motivo'), TEXTO);
  await user.click(screen.getByRole('button', { name: 'Enviar' }));

  expect(onSubmit).toHaveBeenCalledWith('ClienteduplicadoenelERP'); // lo que vería el backend
  expect(onSubmit).not.toHaveBeenCalledWith(TEXTO);
});

it('userEvent respeta lo que el navegador respeta: un botón deshabilitado no se pulsa', async () => {
  const onClick = vi.fn();
  const user = userEvent.setup();
  render(
    <button disabled onClick={onClick}>
      Confirmar
    </button>,
  );

  await user.click(screen.getByRole('button')).catch(() => undefined);
  expect(onClick).not.toHaveBeenCalled();
});
