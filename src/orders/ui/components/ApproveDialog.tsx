// PRESENTACIÓN · Diálogo de aprobación. Componente PRESENTACIONAL: recibe valores y errores, avisa de los cambios.
// No parsea (eso es approval-form.ts), no llama a nadie (eso es el contenedor) y no sabe qué es un pedido urgente.
import type { ApprovalFormInput } from '../approval-form';
import { APPROVAL_FORM_MESSAGES } from '../approval-form-messages';
import type { ApprovalFormErrors } from '../approval-form';

type Props = {
  orderId: string;
  total: string | null;
  values: ApprovalFormInput;
  errors: ApprovalFormErrors;
  busy: boolean;
  onChange: (patch: Partial<ApprovalFormInput>) => void;
  onConfirm: () => void;
  onClose: () => void;
};

export function ApproveDialog({ orderId, total, values, errors, busy, onChange, onConfirm, onClose }: Props) {
  return (
    <div className="dialog" role="dialog" aria-label="Aprobar pedido">
      <h2>Aprobar {orderId}</h2>
      {total && <p>Importe: {total}</p>}

      <label>
        Justificación
        <textarea aria-label="Justificación" value={values.note} onChange={(event) => onChange({ note: event.target.value })} />
      </label>
      {errors.note && <p role="alert">{APPROVAL_FORM_MESSAGES[errors.note]}</p>}

      <label>
        <input type="checkbox" checked={values.confirmTotal} onChange={(event) => onChange({ confirmTotal: event.target.checked })} /> He revisado el importe
      </label>
      {errors.confirmTotal && <p role="alert">{APPROVAL_FORM_MESSAGES[errors.confirmTotal]}</p>}

      <label>
        Canal
        <select aria-label="Canal" value={values.channel} onChange={(event) => onChange({ channel: event.target.value })}>
          <option value="web">Web</option>
          <option value="phone">Teléfono</option>
          <option value="email">Correo</option>
        </select>
      </label>
      {errors.channel && <p role="alert">{APPROVAL_FORM_MESSAGES[errors.channel]}</p>}

      <button onClick={onConfirm} disabled={busy}>Confirmar aprobación</button>
      <button onClick={onClose}>Volver</button>
    </div>
  );
}
