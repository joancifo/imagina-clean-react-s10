// HEREDADO · Devoluciones (RMA) de un pedido entregado. Ruta: /orders/:id/returns
// Se escribió «para salir del paso» y desde entonces cada cambio ha añadido un if.
// Sesión 10 · Es el código del laboratorio. NO lo arregles a ojo: primero el mapa, después la red
// (tests de caracterización), después el plan. Ver docs/ejercicio-s10.md.
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatCurrency, formatDate } from '../shared/utils';
import { useAppStore } from '../store/appStore';
import type { AnyProps } from '../shared/types';

export default function ReturnsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setToast } = useAppStore();
  const [me, setMe] = useState<AnyProps | null>(null);
  const [order, setOrder] = useState<AnyProps | null>(null);
  const [shipment, setShipment] = useState<AnyProps | null>(null);
  const [previous, setPrevious] = useState<AnyProps[]>([]);
  const [sku, setSku] = useState('');
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState('NO_LONGER_NEEDED');
  const [refund, setRefund] = useState(0);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' }).then((r) => r.json()).then(setMe);
    fetch('/api/orders/' + id, { credentials: 'include' })
      .then((r) => r.json())
      .then((o) => {
        setOrder(o);
        setSku(o.ln_items[0]?.sku ?? '');
        fetch('/api/carrier/shipments/' + o.ord_id, { credentials: 'include' })
          .then((r) => r.json())
          .then((s) => setShipment(s))
          .catch(() => {});
        fetch('/api/returns?ord_id=' + o.ord_id, { credentials: 'include' })
          .then((r) => r.json())
          .then(setPrevious);
      });
  }, [id]);

  // Reembolso
  useEffect(() => {
    if (!order) return;
    const line = order.ln_items.find((l: AnyProps) => l.sku === sku);
    if (!line) return;
    const base = qty * line.unit_prc;
    const pct = order.cust_tier === 'gold' ? 0.1 : order.cust_tier === 'silver' ? 0.05 : 0;
    let amount = base * (1 - pct) * 1.21;
    // gastos de reposición (pedido de Dirección, 2024)
    if (reason !== 'DEFECTIVE' && order.cust_tier !== 'gold') amount = amount - base * 0.15;
    setRefund(Math.round(amount * 100) / 100);
  }, [order, sku, qty, reason]);

  if (!order || !shipment || !me) return <main className="page">Cargando…</main>;

  if (me.usr_role === 'agent') {
    return (
      <main className="page">
        <p>No tienes permiso para gestionar devoluciones.</p>
      </main>
    );
  }

  if (order.ord_st !== 'shipped' || shipment.sts_cd !== 'DLV') {
    return (
      <main className="page">
        <h1>Devolución del pedido {order.ord_id}</h1>
        <p>Este pedido todavía no se ha entregado.</p>
      </main>
    );
  }

  const days = (Date.now() - new Date(shipment.dlv_ts).getTime()) / 86400000;
  if (days > 30) {
    return (
      <main className="page">
        <h1>Devolución del pedido {order.ord_id}</h1>
        <p>Han pasado más de 30 días desde la entrega ({formatDate(shipment.dlv_ts)}).</p>
      </main>
    );
  }

  const line = order.ln_items.find((l: AnyProps) => l.sku === sku);
  const returned = previous.filter((r) => r.sku === sku).reduce((acc, r) => acc + r.qty, 0);
  const max = line ? line.qty - returned : 0;
  const needsAdmin = me.usr_role === 'manager' && refund > 500;

  const submit = async () => {
    if (qty < 1 || qty > max) {
      setError('Cantidad no válida');
      return;
    }
    setSending(true);
    const res = await fetch('/api/returns', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ord_id: order.ord_id, sku, qty, rsn_cd: reason, rfd_amt: refund, req_by: me.usr_id, req_role: me.usr_role }),
    });
    if (!res.ok) {
      setError('Error ' + res.status);
      setSending(false);
      return;
    }
    console.log('Devolución registrada', order.cust_nm, refund);
    setToast('Devolución registrada');
    navigate('/orders/' + order.ord_id);
  };

  return (
    <main className="page">
      <h1>Devolución del pedido {order.ord_id}</h1>
      <p>
        {order.cust_nm} · entregado el {formatDate(shipment.dlv_ts)} · seguimiento {shipment.trk_no}
      </p>
      <label>
        Artículo{' '}
        <select value={sku} onChange={(e) => setSku(e.target.value)}>
          {order.ln_items.map((l: AnyProps) => (
            <option key={l.sku} value={l.sku}>
              {l.sku} ({l.qty} uds.)
            </option>
          ))}
        </select>
      </label>
      <p>
        Ya devueltas: {returned} · Puedes devolver hasta {max}
      </p>
      <label>
        Cantidad <input type="number" min={1} max={max} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
      </label>
      <label>
        Motivo{' '}
        <select value={reason} onChange={(e) => setReason(e.target.value)}>
          <option value="NO_LONGER_NEEDED">Ya no lo necesita</option>
          <option value="DEFECTIVE">Defectuoso</option>
          <option value="WRONG_ITEM">Artículo equivocado</option>
        </select>
      </label>
      <p>
        <strong>Reembolso: {formatCurrency(refund)}</strong>
      </p>
      {reason !== 'DEFECTIVE' && order.cust_tier !== 'gold' && <p className="note">Incluye gastos de reposición del 15 %</p>}
      {needsAdmin && <p className="error">Requiere aprobación de un administrador</p>}
      {error && <p className="error">{error}</p>}
      <button disabled={sending || needsAdmin || max === 0} onClick={submit}>
        Registrar devolución
      </button>
    </main>
  );
}
