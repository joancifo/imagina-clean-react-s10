// Sesión 10 · Laboratorio · Fase 2 · Tests de CARACTERIZACIÓN de Devoluciones (src/pages/ReturnsPage.tsx).
// No dicen cómo DEBERÍA comportarse la pantalla: fijan cómo se comporta HOY, incluidas las rarezas.
// Una rareza no se arregla aquí: se fija, se apunta en docs/devoluciones/plan.md como pregunta y se decide después.
// Se ejecutan antes de tocar nada y después de CADA paso del refactor: si siguen en verde, el paso no ha cambiado nada.
//
// Los cuatro primeros los escribió Joan Cifo: son el modelo. Los `it.todo` son tuyos (docs/ejercicio-s10.md, Fase 2).
// Cómo se escribe uno: 1) monta el caso · 2) ejecuta con un valor que sabes falso · 3) copia el valor REAL que te dé el error
// · 4) léelo: ¿tiene sentido? Si no lo tiene, es una rareza: comentario «RAREZA · …» encima y pregunta en plan.md.
import { screen } from '@testing-library/react';
import { atDate, CLASS_DAY, closeReturns, legacyBackend, openReturns, plain } from './returns-harness';

beforeEach(() => atDate(CLASS_DAY));
afterEach(closeReturns);

const heading = () => screen.findByRole('heading', { level: 1 });
const refund = () => plain(screen.getByText(/^Reembolso:/).textContent);
// Para tus tests: el motivo es screen.getByRole('combobox', { name: /Motivo/ }) y la cantidad, screen.getByRole('spinbutton').
const submit = () => screen.getByRole('button', { name: 'Registrar devolución' });

describe('Devoluciones (heredada) · modelo', () => {
  it('mientras carga, enseña «Cargando…»', () => {
    openReturns('P-1004', legacyBackend());
    expect(screen.getByText('Cargando…')).toBeInTheDocument();
  });

  it('cabecera y subtítulo: pedido, cliente, fecha de entrega y seguimiento', async () => {
    openReturns('P-1004', legacyBackend());
    expect(await heading()).toHaveTextContent('Devolución del pedido P-1004');
    expect(screen.getByText('Clínica Dental Mar · entregado el 12/11/2026 · seguimiento TRK-88412')).toBeInTheDocument();
  });

  it('standard, 1 unidad que ya no necesita: 148,40 € (169,40 con IVA menos 21,00 de reposición)', async () => {
    openReturns('P-1004', legacyBackend());
    await heading();
    expect(refund()).toBe('Reembolso: 148,40 €');
    expect(screen.getByText('Incluye gastos de reposición del 15 %')).toBeInTheDocument();
  });

  // SEGURIDAD · El cliente envía el IMPORTE y su ROL, y la API heredada los guarda tal cual. Apúntalo en tu mapa.
  it('registrar: envía ESTOS campos, avisa y vuelve al detalle del pedido', async () => {
    const backend = legacyBackend();
    const { user } = openReturns('P-1004', backend);
    await heading();
    await user.click(submit());
    expect(await screen.findByRole('heading', { name: 'Detalle del pedido' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Devolución registrada');
    expect(backend.posted).toEqual([{ ord_id: 'P-1004', sku: 'E-50', qty: 1, rsn_cd: 'NO_LONGER_NEEDED', rfd_amt: 148.4, req_by: 'u2', req_role: 'manager' }]);
  });
});

// ── FASE 2 · OBLIGATORIOS (los cuatro que protegen el primer paso del plan) ─────────────────────
describe('Devoluciones (heredada) · tus tests', () => {
  // T1 · Motivo «Defectuoso». Pista: await user.selectOptions(<motivo>, 'DEFECTIVE'). ¿Cambia el importe? ¿Sigue la nota de reposición?
  it.todo('defectuoso: …');

  // T2 · Lo ya devuelto. legacyBackend() trae RMA-001 (1 unidad de E-50). ¿Qué texto enseña la pantalla?
  //      Después: escribe una cantidad mayor de la que queda (user.clear + user.type) y pulsa registrar. Mira backend.posted.
  it.todo('ya devueltas y cantidad mayor que la que queda: …');

  // T3 · La ventana de 30 días. P-1004 se entregó el 2026-11-12T10:00:00Z. Pista: atDate('2026-12-12T09:59:00Z') ANTES de openReturns.
  //      Haz dos tests: 09:59 y 10:01 del 12/12. ¿Son «30 días» naturales o 30 × 24 horas?
  it.todo('ventana de 30 días: el 12/12 a las 09:59 UTC …');
  it.todo('ventana de 30 días: el 12/12 a las 10:01 UTC …');

  // T4 · El transportista no responde. Pista: legacyBackend({ carrierDown: true }) e importa waitFor de @testing-library/react:
  //      await waitFor(() => expect(backend.calls).toContain('GET /api/returns?ord_id=P-1004')) antes de mirar la pantalla.
  it.todo('si el transportista no responde: …');
});

// ── FASE 2 · SI TE SOBRA TIEMPO ──────────────────────────────────────────────────────────────────
describe('Devoluciones (heredada) · más casos', () => {
  // Datos en returns-harness.tsx: GOLD, SILVER, IN_TRANSIT, ADMIN, AGENT. Los que no son P-1004 necesitan { orders: [X], returns: [] }.
  it.todo('artículo equivocado (WRONG_ITEM): ¿cobra reposición?');
  it.todo('un agente: …');
  it.todo('un manager con GOLD y 5 unidades: …');
  it.todo('un admin con GOLD y 5 unidades: …');
  it.todo('silver, 2 unidades: …');
  it.todo('un pedido que no está entregado (IN_TRANSIT): …');
  it.todo('si el backend responde 500 al registrar (postStatus: 500): …');
});
