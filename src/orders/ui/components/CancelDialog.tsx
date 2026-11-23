// PRESENTACIÓN · Diálogo de cancelación. Estado LOCAL de UI: el texto que se está escribiendo solo le importa a este componente.
// No valida el motivo: lo envía y pinta el error que le devuelven (la regla vive en el dominio).
//
// Sesión 8 · Dos cosas que solo se ven si el test escribe como escribe una persona:
//   1. El texto se guarda TAL CUAL mientras se escribe. Recortarlo en cada pulsación se traga los espacios
//      entre palabras: `fireEvent.change` lo esconde (pone el valor entero de golpe), `user.type` lo destapa.
//      El motivo se recorta al ENVIAR, que es cuando ya se sabe dónde terminan las palabras.
//   2. Al abrirse, el foco entra en el diálogo. Si no, quien navega con teclado sigue en la fila de la tabla
//      y tiene que adivinar que se ha abierto algo.
import { useEffect, useRef, useState } from 'react';

type Props = { orderId: string; busy: boolean; error: string | null; onConfirm: (reason: string) => void; onClose: () => void };

const ERROR_ID = 'cancelar-motivo-error';

export function CancelDialog({ orderId, busy, error, onConfirm, onClose }: Props) {
  const [reason, setReason] = useState('');
  const field = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    field.current?.focus();
  }, []);

  return (
    <div className="dialog" role="dialog" aria-label="Cancelar pedido">
      <h2>Cancelar {orderId}</h2>
      <textarea
        ref={field}
        aria-label="Motivo"
        value={reason}
        aria-invalid={error !== null}
        aria-describedby={error ? ERROR_ID : undefined}
        onChange={(e) => setReason(e.target.value)}
      />
      {error && <p id={ERROR_ID} role="alert">{error}</p>}
      <button onClick={() => onConfirm(reason.trim())} disabled={busy} aria-busy={busy}>Confirmar</button>
      <button onClick={onClose}>Volver</button>
    </div>
  );
}
