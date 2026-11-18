// HEREDADO · Cliente HTTP de las pantallas que aún no se han migrado (detalle y panel).
// Sesión 6 · Lo que ha cambiado:
//   · La identidad ya NO se envía: va en la cookie de sesión que pone el BFF (credentials: 'include').
//   · Un fallo ya no abre un alert() con el texto del servidor: se lanza y lo trata quien llama.
import axios from 'axios';
import type { AnyProps, Order, User } from '../shared/types';

const http = axios.create({ baseURL: '/api', withCredentials: true });

export async function doRequest(method: string, url: string, data?: AnyProps) {
  const response = await http.request({ method, url, data });
  return response.data;
}

export const getOrders = (): Promise<Order[]> => doRequest('get', '/orders');
export const getOrder = (id: string): Promise<Order> => doRequest('get', `/orders/${id}`);
export const getMe = (): Promise<User> => doRequest('get', '/me');
export const doAction = (id: string, action: string, data?: AnyProps): Promise<Order> => doRequest('post', `/orders/${id}/${action}`, data);
export const sendLog = (data: AnyProps) => doRequest('post', '/logs', data);
