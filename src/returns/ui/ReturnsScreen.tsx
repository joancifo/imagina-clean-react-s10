// PRESENTACIÓN · Pantalla de devolución NUEVA (paso 5 del plan), detrás del flag newReturns.
// Contenedor: carga con el caso de uso, guarda el borrador y envía. No calcula ni formatea (view model) ni pinta campos (ReturnForm).
// Mismos textos que la heredada salvo los cambios declarados en docs/adr/008-devoluciones.md.
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReturnableView } from '../application/load-returnable-order';
import type { ReturnsFailure } from '../application/ports';
import { formatDate } from './formatters';
import { ReturnForm } from './components/ReturnForm';
import { LOAD_MESSAGES, REQUEST_MESSAGES } from './return-messages';
import { buildReturnFormViewModel, initialDraft, type ReturnDraft } from './return-form-view-model';
import { useReturnsModule } from './ReturnsProvider';

type Props = { orderId: string; role: string; onNotify: (message: string) => void };
type LoadState = { status: 'loading' } | { status: 'failed'; failure: ReturnsFailure } | { status: 'ready'; data: ReturnableView };

export function ReturnsScreen({ orderId, role, onNotify }: Props) {
  const { loadReturnableOrder, requestReturn } = useReturnsModule();
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [draft, setDraft] = useState<ReturnDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    const result = await loadReturnableOrder(orderId);
    if (!result.ok) return setState({ status: 'failed', failure: result.error });
    setDraft(initialDraft(result.value.order));
    setState({ status: 'ready', data: result.value });
  }, [loadReturnableOrder, orderId]);

  // Efecto legítimo: sincroniza con un sistema externo (el servidor), no con otro estado.
  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === 'loading' || (state.status === 'ready' && draft === null)) return <main className="page">Cargando…</main>;
  if (state.status === 'failed') {
    if (state.failure === 'not-found') return <main className="page"><h1>No existe el pedido {orderId}</h1></main>;
    return (
      <main className="page">
        <p role="alert">{LOAD_MESSAGES[state.failure as keyof typeof LOAD_MESSAGES] ?? LOAD_MESSAGES.unavailable}</p>
        <button onClick={() => void load()}>Reintentar</button>
      </main>
    );
  }

  const { order, window } = state.data;
  if (window === 'not-delivered') {
    return (
      <main className="page">
        <h1>Devolución del pedido {order.orderId}</h1>
        <p>Este pedido todavía no se ha entregado.</p>
      </main>
    );
  }
  if (window === 'closed') {
    return (
      <main className="page">
        <h1>Devolución del pedido {order.orderId}</h1>
        <p>Han pasado más de 30 días desde la entrega ({formatDate(order.delivery!.deliveredAt)}).</p>
      </main>
    );
  }

  const current = draft!;
  const submit = async () => {
    setError(null);
    setSending(true);
    const result = await requestReturn({ order, sku: current.sku, quantity: current.quantity, reason: current.reason, role });
    setSending(false);
    if (!result.ok) return setError(REQUEST_MESSAGES[result.error]);
    onNotify('Devolución registrada');
    navigate(`/orders/${order.orderId}`);
  };

  return <ReturnForm view={buildReturnFormViewModel(order, current, role)} draft={current} error={error} sending={sending} onChange={setDraft} onSubmit={() => void submit()} />;
}
