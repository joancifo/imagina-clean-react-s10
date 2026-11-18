// PRESENTACIÓN · Componente CONECTADO (contenedor) de la lista de pedidos.
// Su trabajo es conectar piezas, no decidir:
//   URL ──▶ useOrdersCriteria ─┐
//   caso de uso ─▶ useOrdersList ─┼─▶ buildOrdersListViewModel ─▶ componentes presentacionales
//   actor (props) ─────────────┘
// Lo que necesita del resto de la aplicación llega por PROPS (actor, onNotify): no importa stores globales.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Actor } from '../domain/cancellation';
import { CancelDialog } from './components/CancelDialog';
import { OrdersFilters } from './components/OrdersFilters';
import { OrdersTable } from './components/OrdersTable';
import { buildOrdersListViewModel } from './orders-list-view-model';
import { opensDetailAfterApproval, orderDetailPath } from './orders-navigation';
import { useApproveOrder } from './useApproveOrder';
import { useCancelOrder } from './useCancelOrder';
import { useOrdersCriteria } from './useOrdersCriteria';
import { useOrdersList } from './useOrdersList';

type Props = { actor: Actor; onNotify: (message: string) => void };

export function OrdersListPage({ actor, onNotify }: Props) {
  const navigate = useNavigate();
  const [criteria, setCriteria] = useOrdersCriteria(); // estado de URL
  const { state, reload } = useOrdersList(); // estado de servidor
  const { approve, pending: approving } = useApproveOrder();
  const { cancel, pending: cancelling } = useCancelOrder();
  const [compact, setCompact] = useState(false); // estado local de UI
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (state.status === 'loading') return <main className="page">Cargando…</main>;
  if (state.status === 'error') {
    return (
      <main className="page">
        <p role="alert">No se pudieron cargar los pedidos</p>
        <button onClick={reload}>Reintentar</button>
      </main>
    );
  }

  // Estado derivado: se CALCULA en cada render. Ni useState ni useEffect.
  const viewModel = buildOrdersListViewModel(state.orders, criteria, actor);

  const handleApprove = async (orderId: string) => {
    setError(null);
    const outcome = await approve({ orderId, actor });
    if (!outcome.ok) return setError(outcome.message);
    onNotify(`Pedido ${orderId} aprobado`);
    if (opensDetailAfterApproval(outcome.order)) navigate(orderDetailPath(orderId));
    else reload();
  };

  const handleCancel = async (reason: string) => {
    if (!cancelTarget) return;
    setError(null);
    const outcome = await cancel({ orderId: cancelTarget, reason, actor });
    if (!outcome.ok) return setError(outcome.message);
    onNotify('Pedido cancelado');
    setCancelTarget(null);
    reload(); // el servidor es la fuente de verdad: no se «parchea» la lista a mano
  };

  return (
    <main className="page">
      <h1>Pedidos</h1>
      <OrdersFilters criteria={criteria} onChange={setCriteria} />
      <label>
        <input type="checkbox" checked={compact} onChange={(e) => setCompact(e.target.checked)} /> Compacto
      </label>
      <p className="summary">{viewModel.summary}</p>
      {error && !cancelTarget && <p role="alert">{error}</p>}
      {viewModel.emptyMessage ? (
        <p>{viewModel.emptyMessage}</p>
      ) : (
        <OrdersTable
          rows={viewModel.rows}
          showAmounts={viewModel.showAmounts}
          compact={compact}
          busy={approving || cancelling || state.refreshing}
          onOpen={(orderId) => navigate(orderDetailPath(orderId))}
          onApprove={handleApprove}
          onCancel={(orderId) => { setError(null); setCancelTarget(orderId); }}
        />
      )}
      {cancelTarget && (
        <CancelDialog key={cancelTarget} orderId={cancelTarget} busy={cancelling} error={error} onConfirm={handleCancel} onClose={() => { setError(null); setCancelTarget(null); }} />
      )}
    </main>
  );
}
