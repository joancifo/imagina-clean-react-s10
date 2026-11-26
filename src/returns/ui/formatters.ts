// PRESENTACIÓN · Formato para la pantalla. Mismo criterio que Pedidos: zona horaria fija (Europe/Madrid).
const CURRENCY = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const DATE = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Madrid' });

export const formatCurrency = (value: number): string => CURRENCY.format(value);
export const formatDate = (iso: string): string => DATE.format(new Date(iso));
