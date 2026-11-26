// PRESENTACIONAL · El formulario de devolución. Recibe el view model y avisa de los cambios: no carga, no calcula, no envía.
// Accesible: cada campo con su <label for>, el error atado al campo de cantidad (aria-invalid + aria-describedby).
import { useId } from 'react';
import type { ReturnReason } from '../../domain/return-rules';
import { REASON_OPTIONS, type ReturnDraft, type ReturnFormViewModel } from '../return-form-view-model';

type Props = {
  view: ReturnFormViewModel;
  draft: ReturnDraft;
  error: string | null;
  sending: boolean;
  onChange: (draft: ReturnDraft) => void;
  onSubmit: () => void;
};

export function ReturnForm({ view, draft, error, sending, onChange, onSubmit }: Props) {
  const id = useId();
  return (
    <main className="page">
      <h1>{view.title}</h1>
      <p>{view.subtitle}</p>
      {/* noValidate: la validación es nuestra (caso de uso) y su mensaje está atado al campo; la del navegador no se lee igual en todos */}
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label htmlFor={`${id}-sku`}>Artículo</label>{' '}
        <select id={`${id}-sku`} value={draft.sku} onChange={(event) => onChange({ ...draft, sku: event.target.value })}>
          {view.lines.map((line) => (
            <option key={line.value} value={line.value}>{line.label}</option>
          ))}
        </select>
        <p>{view.remaining}</p>
        <label htmlFor={`${id}-qty`}>Cantidad</label>{' '}
        <input
          id={`${id}-qty`}
          type="number"
          min={1}
          max={view.max}
          value={draft.quantity}
          aria-invalid={error === 'Cantidad no válida'}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange({ ...draft, quantity: Number(event.target.value) })}
        />
        <label htmlFor={`${id}-reason`}>Motivo</label>{' '}
        <select id={`${id}-reason`} value={draft.reason} onChange={(event) => onChange({ ...draft, reason: event.target.value as ReturnReason })}>
          {REASON_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <p><strong>{view.refund}</strong></p>
        {view.restockingNote && <p className="note">{view.restockingNote}</p>}
        {view.needsAdmin && <p className="error">Requiere aprobación de un administrador</p>}
        {error && <p className="error" id={`${id}-error`} role="alert">{error}</p>}
        <button type="submit" disabled={sending || !view.canSubmit}>Registrar devolución</button>
      </form>
    </main>
  );
}
