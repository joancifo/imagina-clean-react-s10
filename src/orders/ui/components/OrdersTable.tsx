// PRESENTACIÓN · Componente presentacional: recibe filas YA preparadas (view model) y callbacks.
// Compara con src/components/OrderRow.tsx (heredado): 15 props, 10 booleanas, y decide permisos al pintar.
// Aquí no hay ni un rol, ni un importe sin formatear, ni una regla: solo «pinta esto» y «avisa de esto».
import type { OrderRowViewModel } from '../orders-list-view-model';

type Props = {
  rows: OrderRowViewModel[];
  showAmounts: boolean;
  compact: boolean;
  busy: boolean;
  onOpen: (orderId: string) => void;
  onApprove: (orderId: string) => void;
  onCancel: (orderId: string) => void;
};

const ROW_CLASS = { normal: 'order-row', urgent: 'order-row order-row--urgent', muted: 'order-row order-row--muted' } satisfies Record<OrderRowViewModel['tone'], string>;

export function OrdersTable({ rows, showAmounts, compact, busy, onOpen, onApprove, onCancel }: Props) {
  return (
    <table>
      <thead>
        <tr>
          <th>Pedido</th>
          <th>Cliente</th>
          <th>Fecha</th>
          {showAmounts && <th>Responsable</th>}
          <th>Estado</th>
          {showAmounts && <th>Total</th>}
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className={ROW_CLASS[row.tone]}>
            <td><button onClick={() => onOpen(row.id)}>{row.id}</button></td>
            <td>{compact ? row.customer.slice(0, 12) : row.customer}</td>
            <td>{row.date}</td>
            {showAmounts && <td>{row.owner}</td>}
            <td><span className={row.tone === 'muted' ? 'badge badge--danger' : 'badge'}>{row.statusLabel}</span></td>
            {showAmounts && <td className="order-row__total">{row.total}</td>}
            <td>
              {row.canApprove && <button disabled={busy} onClick={() => onApprove(row.id)}>Aprobar</button>}
              {row.canCancel && <button disabled={busy} onClick={() => onCancel(row.id)}>Cancelar</button>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
