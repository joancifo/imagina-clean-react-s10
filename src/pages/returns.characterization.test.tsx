// Sesión 10 · Laboratorio · Fase 2 · Tests de CARACTERIZACIÓN de Devoluciones (src/pages/ReturnsPage.tsx).
// No dicen cómo DEBERÍA comportarse la pantalla: fijan cómo se comporta HOY, incluidas las rarezas.
// Una rareza no se arregla aquí: se fija, se apunta en docs/devoluciones/plan.md como pregunta y se decide después.
// Se ejecutan antes de tocar nada y después de CADA paso del refactor: si siguen en verde, el paso no ha cambiado nada.
import { screen, waitFor } from '@testing-library/react';
import { ADMIN, AGENT, atDate, CLASS_DAY, closeReturns, GOLD, IN_TRANSIT, legacyBackend, openReturns, plain, SILVER, STANDARD } from './returns-harness';

beforeEach(() => atDate(CLASS_DAY));
afterEach(closeReturns);

const heading = () => screen.findByRole('heading', { level: 1 });
const refund = () => plain(screen.getByText(/^Reembolso:/).textContent);
const motive = () => screen.getByRole('combobox', { name: /Motivo/ });
const quantity = () => screen.getByRole('spinbutton');
const submit = () => screen.getByRole('button', { name: 'Registrar devolución' });

describe('Devoluciones (heredada) · lo que se ve', () => {
  it('mientras carga, enseña «Cargando…»', () => {
    openReturns('P-1004', legacyBackend());
    expect(screen.getByText('Cargando…')).toBeInTheDocument();
  });

  it('cabecera y subtítulo: pedido, cliente, fecha de entrega y seguimiento', async () => {
    openReturns('P-1004', legacyBackend());
    expect(await heading()).toHaveTextContent('Devolución del pedido P-1004');
    expect(screen.getByText('Clínica Dental Mar · entregado el 12/11/2026 · seguimiento TRK-88412')).toBeInTheDocument();
  });

  it('descuenta lo ya devuelto de esa línea: 3 pedidas, 1 devuelta, quedan 2', async () => {
    openReturns('P-1004', legacyBackend());
    await heading();
    expect(screen.getByText('Ya devueltas: 1 · Puedes devolver hasta 2')).toBeInTheDocument();
  });
});

describe('Devoluciones (heredada) · el reembolso', () => {
  it('standard, 1 unidad que ya no necesita: 148,40 € (169,40 con IVA menos 21,00 de reposición)', async () => {
    openReturns('P-1004', legacyBackend());
    await heading();
    expect(refund()).toBe('Reembolso: 148,40 €');
    expect(screen.getByText('Incluye gastos de reposición del 15 %')).toBeInTheDocument();
  });

  it('defectuoso: sin gastos de reposición, 169,40 €', async () => {
    const { user } = openReturns('P-1004', legacyBackend());
    await heading();
    await user.selectOptions(motive(), 'DEFECTIVE');
    expect(refund()).toBe('Reembolso: 169,40 €');
    expect(screen.queryByText('Incluye gastos de reposición del 15 %')).not.toBeInTheDocument();
  });

  // RAREZA · Si el error fue NUESTRO (artículo equivocado), también cobra reposición. ¿Regla o error? → plan.md, pregunta 1.
  it('artículo equivocado: TAMBIÉN cobra reposición, 148,40 €', async () => {
    const { user } = openReturns('P-1004', legacyBackend());
    await heading();
    await user.selectOptions(motive(), 'WRONG_ITEM');
    expect(refund()).toBe('Reembolso: 148,40 €');
  });

  // RAREZA · La reposición se calcula sobre el precio SIN descuento ni IVA. → plan.md, pregunta 2.
  it('silver, 2 unidades: 64,97 € (74,72 con 5 % e IVA, menos 9,75 de reposición sobre el precio sin descuento)', async () => {
    const { user } = openReturns('P-2002', legacyBackend({ orders: [SILVER], returns: [] }));
    await heading();
    await user.clear(quantity());
    await user.type(quantity(), '2');
    expect(refund()).toBe('Reembolso: 64,97 €');
  });

  it('gold: 10 % de descuento y nunca paga reposición (1 × D-40 = 103,46 €)', async () => {
    openReturns('P-2001', legacyBackend({ orders: [GOLD], returns: [] }));
    await heading();
    expect(refund()).toBe('Reembolso: 103,46 €');
    expect(screen.queryByText('Incluye gastos de reposición del 15 %')).not.toBeInTheDocument();
  });
});

describe('Devoluciones (heredada) · quién y cuándo', () => {
  it('un agente no puede gestionar devoluciones', async () => {
    openReturns('P-1004', legacyBackend({ me: AGENT }));
    expect(await screen.findByText('No tienes permiso para gestionar devoluciones.')).toBeInTheDocument();
  });

  it('un manager no puede registrar más de 500 €: aviso y botón desactivado', async () => {
    const { user } = openReturns('P-2001', legacyBackend({ orders: [GOLD], returns: [] }));
    await heading();
    await user.clear(quantity());
    await user.type(quantity(), '5');
    expect(refund()).toBe('Reembolso: 517,28 €');
    expect(screen.getByText('Requiere aprobación de un administrador')).toBeInTheDocument();
    expect(submit()).toBeDisabled();
  });

  it('un admin sí puede registrar más de 500 €', async () => {
    const { user } = openReturns('P-2001', legacyBackend({ me: ADMIN, orders: [GOLD], returns: [] }));
    await heading();
    await user.clear(quantity());
    await user.type(quantity(), '5');
    expect(screen.queryByText('Requiere aprobación de un administrador')).not.toBeInTheDocument();
    expect(submit()).toBeEnabled();
  });

  it('un pedido que no está entregado no admite devolución', async () => {
    openReturns('P-1002', legacyBackend({ orders: [IN_TRANSIT], returns: [] }));
    await heading();
    expect(screen.getByText('Este pedido todavía no se ha entregado.')).toBeInTheDocument();
  });

  // RAREZA · «30 días» son 30 × 24 horas desde la HORA de entrega (10:00 UTC), no 30 días naturales. → plan.md, pregunta 3.
  it('ventana de 30 días contada en horas: el 12/12 a las 09:59 UTC todavía se puede', async () => {
    atDate('2026-12-12T09:59:00Z');
    openReturns('P-1004', legacyBackend());
    await heading();
    expect(submit()).toBeInTheDocument();
  });

  it('ventana de 30 días contada en horas: el 12/12 a las 10:01 UTC ya no', async () => {
    atDate('2026-12-12T10:01:00Z');
    openReturns('P-1004', legacyBackend());
    await heading();
    expect(screen.getByText('Han pasado más de 30 días desde la entrega (12/11/2026).')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Registrar devolución' })).not.toBeInTheDocument();
  });
});

describe('Devoluciones (heredada) · registrar', () => {
  // SEGURIDAD · El cliente envía el IMPORTE y su ROL, y la API heredada los guarda tal cual. → plan.md, el paso del BFF.
  it('envía ESTOS campos, avisa y vuelve al detalle del pedido', async () => {
    const backend = legacyBackend();
    const { user } = openReturns('P-1004', backend);
    await heading();
    await user.click(submit());
    expect(await screen.findByRole('heading', { name: 'Detalle del pedido' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Devolución registrada');
    expect(backend.posted).toEqual([{ ord_id: 'P-1004', sku: 'E-50', qty: 1, rsn_cd: 'NO_LONGER_NEEDED', rfd_amt: 148.4, req_by: 'u2', req_role: 'manager' }]);
  });

  it('una cantidad mayor que la que queda: «Cantidad no válida» y no envía nada', async () => {
    const backend = legacyBackend();
    const { user } = openReturns('P-1004', backend);
    await heading();
    await user.clear(quantity());
    await user.type(quantity(), '3');
    await user.click(submit());
    expect(screen.getByText('Cantidad no válida')).toBeInTheDocument();
    expect(backend.posted).toEqual([]);
  });

  it('si el backend responde 500: «Error 500», se queda en la pantalla y se puede reintentar', async () => {
    const { user } = openReturns('P-1004', legacyBackend({ postStatus: 500 }));
    await heading();
    await user.click(submit());
    expect(await screen.findByText('Error 500')).toBeInTheDocument();
    expect(submit()).toBeEnabled();
  });

  // RAREZA · Si el transportista no responde, la pantalla se queda cargando PARA SIEMPRE (.catch(() => {})). → plan.md, pregunta 4.
  it('si el transportista no responde, se queda en «Cargando…» aunque el resto haya llegado', async () => {
    const backend = legacyBackend({ carrierDown: true });
    openReturns('P-1004', backend);
    await waitFor(() => expect(backend.calls).toContain('GET /api/returns?ord_id=P-1004'));
    expect(screen.getByText('Cargando…')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
