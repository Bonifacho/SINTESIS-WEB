import { useEffect, useState, useCallback } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

/**
 * Toast — Sistema de notificaciones flotantes.
 *
 * Uso con el hook useToast():
 *   const { showToast, ToastContainer } = useToast();
 *   showToast("Grupo creado exitosamente", "success");
 *
 * Tipos: "success" | "error" | "warning" | "info"
 */

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES = {
  success: "bg-emerald-50/95 border-emerald-200/80 text-emerald-900 shadow-emerald-500/10",
  error: "bg-rose-50/95 border-rose-200/80 text-rose-900 shadow-rose-500/10",
  warning: "bg-amber-50/95 border-amber-200/80 text-amber-900 shadow-amber-500/10",
  info: "bg-indigo-50/95 border-indigo-200/80 text-indigo-900 shadow-indigo-500/10",
};

const ICON_STYLES = {
  success: "text-emerald-600",
  error: "text-rose-600",
  warning: "text-amber-600",
  info: "text-indigo-600",
};

function Toast({ message, type = "info", onClose }) {
  const Icon = ICONS[type];

  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md max-w-sm animate-slide-in ${STYLES[type]}`}
    >
      <Icon size={18} className={`shrink-0 mt-0.5 ${ICON_STYLES[type]}`} />
      <p className="text-sm font-medium flex-1 leading-snug">{message}</p>
      <button onClick={onClose} className="shrink-0 opacity-40 hover:opacity-100 transition-opacity p-0.5">
        <X size={14} />
      </button>
    </div>
  );
}

/**
 * ToastContainer — Contenedor que renderiza todos los toasts activos.
 */
function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

/**
 * useToast — Hook para gestionar notificaciones toast.
 *
 * Retorna:
 *   - showToast(message, type): Muestra una notificación.
 *   - ToastContainer: Componente JSX que debe renderizarse en el layout.
 */
let toastIdCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info") => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const ToastWrapper = useCallback(() => (
    <ToastContainer toasts={toasts} removeToast={removeToast} />
  ), [toasts, removeToast]);

  return { showToast, ToastContainer: ToastWrapper };
}
