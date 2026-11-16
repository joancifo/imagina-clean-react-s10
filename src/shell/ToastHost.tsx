// SHELL · El aviso (toast) SÍ es estado global: lo puede lanzar cualquier pantalla y se pinta una vez, aquí.
// Antes lo pintaba OrdersPage (Efecto 5): un aviso lanzado desde otra pantalla solo se veía al volver a la lista.
import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';

export function ToastHost() {
  const { toast, setToast } = useAppStore();
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast, setToast]);
  return toast ? <div className="toast" role="status">{toast}</div> : null;
}
