// PRESENTACIÓN · Diálogo de cancelación. Estado LOCAL de UI: el texto que se está escribiendo solo le importa a este componente.
// No valida el motivo: lo envía y pinta el error que le devuelven (la regla vive en el dominio).
import { useState } from 'react';

type Props = { orderId: string; busy: boolean; error: string | null; onConfirm: (reason: string) => void; onClose: () => void };

export function CancelDialog({ orderId, busy, error, onConfirm, onClose }: Props) {
  const [reason, setReason] = useState('');
  return (
    <div className="dialog" role="dialog" aria-label="Cancelar pedido">
      <h2>Cancelar {orderId}</h2>
      <textarea aria-label="Motivo" value={reason} onChange={(e) => setReason(e.target.value)} />
      {error && <p role="alert">{error}</p>}
      <button onClick={() => onConfirm(reason)} disabled={busy}>Confirmar</button>
      <button onClick={onClose}>Volver</button>
    </div>
  );
}
