import { useEffect, useState } from 'react';
import { getOrders } from '../services/api';
import { formatCurrency } from '../shared/utils';
import { useSession } from '../session';
import type { Order } from '../shared/types';
import { canCancel, toOrder } from '../orders';

export default function DashboardPage() {
  const session = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    getOrders().then(setOrders);
  }, []);

  // Mapper y regla de total duplicados: aquí no se aplica el descuento.
  const rows = orders.map((o) => ({
    id: o.ord_id,
    status: o.ord_st,
    total: o.ln_items.reduce((acc, l) => acc + l.qty * l.unit_prc, 0) * 1.21,
  }));

  const pending = rows.filter((r) => r.status === 'pending');
  const revenue = rows.filter((r) => r.status === 'shipped' || r.status === 'approved').reduce((a, r) => a + r.total, 0);
  // Regla oficial de cancelación (dominio), sobre el pedido completo y no sobre la fila resumida.
  const actor = session.status === 'ready' ? session.actor : null;
  const cancellable = orders.filter((o) => canCancel(toOrder(o), actor));

  return (
    <main className="page">
      <h1>Panel</h1>
      <div className="cards">
        <div className="card"><h2>{pending.length}</h2>Pendientes</div>
        <div className="card"><h2>{formatCurrency(revenue)}</h2>Facturación</div>
        <div className="card"><h2>{cancellable.length}</h2>Cancelables por ti</div>
      </div>
    </main>
  );
}
