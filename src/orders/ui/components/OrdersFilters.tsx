// PRESENTACIÓN · Componente presentacional: pinta los criterios y avisa de los cambios. No sabe que existen la URL ni el router.
import type { OrdersCriteria } from '../orders-criteria';

type Props = { criteria: OrdersCriteria; canFilterByOwner: boolean; onChange: (patch: Partial<OrdersCriteria>) => void };

export function OrdersFilters({ criteria, canFilterByOwner, onChange }: Props) {
  return (
    <div className="filters">
      <input aria-label="Buscar cliente o pedido" placeholder="Buscar" value={criteria.text} onChange={(e) => onChange({ text: e.target.value })} />
      <select aria-label="Estado" value={criteria.status} onChange={(e) => onChange({ status: e.target.value as OrdersCriteria['status'] })}>
        <option value="all">Todos</option>
        <option value="pending">Pendientes</option>
        <option value="approved">Aprobados</option>
        <option value="shipped">Enviados</option>
        <option value="cancelled">Cancelados</option>
      </select>
      {/* Sesión 8 · A un agente el backend no le dice de quién es cada pedido: el filtro no se ofrece. */}
      {canFilterByOwner && (
        <label>
          <input type="checkbox" checked={criteria.onlyMine} onChange={(e) => onChange({ onlyMine: e.target.checked })} /> Solo míos
        </label>
      )}
      <select aria-label="Ordenar" value={criteria.sort} onChange={(e) => onChange({ sort: e.target.value as OrdersCriteria['sort'] })}>
        <option value="date">Fecha</option>
        <option value="total">Importe</option>
        <option value="customer">Cliente</option>
      </select>
    </div>
  );
}
