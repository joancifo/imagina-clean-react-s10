// PRESENTACIÓN · Formato para la pantalla. El dominio trabaja con números y fechas ISO; el texto es de la UI.
// Zona horaria fija: todas las personas ven la misma fecha para el mismo pedido (decisión de producto).
const CURRENCY = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const DATE = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Madrid' });

export const formatCurrency = (value: number): string => CURRENCY.format(value);
export const formatDate = (iso: string): string => DATE.format(new Date(iso));
