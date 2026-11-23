// PRESENTACIÓN · Diálogo de aprobación. Componente PRESENTACIONAL: recibe valores y errores, avisa de los cambios.
// No parsea (eso es approval-form.ts), no llama a nadie (eso es el contenedor) y no sabe qué es un pedido urgente.
//
// Sesión 8 · Un mensaje de error suelto debajo de un campo lo ve quien MIRA la pantalla. Para que lo reciba
// quien la escucha, el mensaje tiene que estar ATADO a su campo: aria-invalid dice «este campo está mal»
// y aria-describedby dice «el porqué está aquí». Un test de componente lo comprueba con
// `toHaveAccessibleDescription`, igual que una persona lo oiría al poner el foco en el campo.
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

/** Un identificador por campo: el mensaje y el campo tienen que poder señalarse el uno al otro. */
const ERROR_IDS = { note: 'aprobar-nota-error', confirmTotal: 'aprobar-revisado-error', channel: 'aprobar-canal-error' } as const;

export function ApproveDialog({ orderId, total, values, errors, busy, onChange, onConfirm, onClose }: Props) {
  return (
    <div className="dialog" role="dialog" aria-label="Aprobar pedido">
      <h2>Aprobar {orderId}</h2>
      {total && <p>Importe: {total}</p>}

      <label>
        Justificación
        <textarea
          aria-label="Justificación"
          value={values.note}
          aria-invalid={errors.note !== undefined}
          aria-describedby={errors.note ? ERROR_IDS.note : undefined}
          onChange={(event) => onChange({ note: event.target.value })}
        />
      </label>
      {errors.note && <p id={ERROR_IDS.note} role="alert">{APPROVAL_FORM_MESSAGES[errors.note]}</p>}

      <label>
        <input
          type="checkbox"
          checked={values.confirmTotal}
          aria-invalid={errors.confirmTotal !== undefined}
          aria-describedby={errors.confirmTotal ? ERROR_IDS.confirmTotal : undefined}
          onChange={(event) => onChange({ confirmTotal: event.target.checked })}
        />{' '}
        He revisado el importe
      </label>
      {errors.confirmTotal && <p id={ERROR_IDS.confirmTotal} role="alert">{APPROVAL_FORM_MESSAGES[errors.confirmTotal]}</p>}

      <label>
        Canal
        <select
          aria-label="Canal"
          value={values.channel}
          aria-invalid={errors.channel !== undefined}
          aria-describedby={errors.channel ? ERROR_IDS.channel : undefined}
          onChange={(event) => onChange({ channel: event.target.value })}
        >
          <option value="web">Web</option>
          <option value="phone">Teléfono</option>
          <option value="email">Correo</option>
        </select>
      </label>
      {errors.channel && <p id={ERROR_IDS.channel} role="alert">{APPROVAL_FORM_MESSAGES[errors.channel]}</p>}

      <button onClick={onConfirm} disabled={busy} aria-busy={busy}>Confirmar aprobación</button>
      <button onClick={onClose}>Volver</button>
    </div>
  );
}
