// PRESENTACIÓN · Componente CONECTADO (contenedor) de la lista de pedidos.
// Su trabajo es conectar piezas, no decidir:
//   URL ──▶ useOrdersCriteria ─┐
//   caso de uso ─▶ useOrdersList ─┼─▶ buildOrdersListViewModel ─▶ componentes presentacionales
//   actor (props) ─────────────┘
// Lo que necesita del resto de la aplicación llega por PROPS (actor, onNotify): no importa stores globales.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { needsJustification } from '../domain/approval';
import type { Actor } from '../domain/cancellation';
import { EMPTY_APPROVAL_FORM, parseApprovalForm, type ApprovalFormErrors, type ApprovalFormInput } from './approval-form';
import { ApproveDialog } from './components/ApproveDialog';
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
  const [approveTarget, setApproveTarget] = useState<string | null>(null); // pedido urgente: hay que justificar
  const [form, setForm] = useState<ApprovalFormInput>(EMPTY_APPROVAL_FORM);
  const [formErrors, setFormErrors] = useState<ApprovalFormErrors>({});
  const [error, setError] = useState<{ message: string; retryable: boolean } | null>(null);

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

  /** Un pedido urgente abre el diálogo; el resto se aprueba sin ceremonia. La regla es del dominio. */
  const startApproval = (orderId: string) => {
    setError(null);
    const order = state.orders.find((candidate) => candidate.id === orderId);
    if (order && needsJustification(order)) {
      setForm(EMPTY_APPROVAL_FORM);
      setFormErrors({});
      return setApproveTarget(orderId);
    }
    return runApproval(orderId);
  };

  const runApproval = async (orderId: string, draft = undefined as undefined | { note: string | null; channel: 'web' | 'phone' | 'email' }) => {
    setError(null);
    const outcome = await approve({ orderId, actor, draft });
    if (!outcome.ok) return setError({ message: outcome.message, retryable: outcome.retryable });
    setApproveTarget(null);
    onNotify(`Pedido ${orderId} aprobado`);
    if (opensDetailAfterApproval(outcome.order)) navigate(orderDetailPath(orderId));
    else reload();
  };

  const confirmApproval = () => {
    if (!approveTarget) return;
    const parsed = parseApprovalForm(form, { requiresJustification: true });
    setFormErrors(parsed.ok ? {} : parsed.error);
    if (parsed.ok) void runApproval(approveTarget, parsed.value);
  };

  const handleCancel = async (reason: string) => {
    if (!cancelTarget) return;
    setError(null);
    const outcome = await cancel({ orderId: cancelTarget, reason, actor });
    if (!outcome.ok) return setError({ message: outcome.message, retryable: false });
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
      {error && !cancelTarget && !approveTarget && (
        <p role="alert">
          {error.message} {error.retryable && <button onClick={reload}>Reintentar</button>}
        </p>
      )}
      {viewModel.emptyMessage ? (
        <p>{viewModel.emptyMessage}</p>
      ) : (
        <OrdersTable
          rows={viewModel.rows}
          showAmounts={viewModel.showAmounts}
          compact={compact}
          busy={approving || cancelling || state.refreshing}
          onOpen={(orderId) => navigate(orderDetailPath(orderId))}
          onApprove={startApproval}
          onCancel={(orderId) => { setError(null); setCancelTarget(orderId); }}
        />
      )}
      {cancelTarget && (
        <CancelDialog key={cancelTarget} orderId={cancelTarget} busy={cancelling} error={error?.message ?? null} onConfirm={handleCancel} onClose={() => { setError(null); setCancelTarget(null); }} />
      )}
      {approveTarget && (
        <ApproveDialog
          key={approveTarget}
          orderId={approveTarget}
          total={viewModel.rows.find((row) => row.id === approveTarget)?.total ?? null}
          values={form}
          errors={formErrors}
          busy={approving}
          onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
          onConfirm={confirmApproval}
          onClose={() => { setError(null); setApproveTarget(null); }}
        />
      )}
    </main>
  );
}
