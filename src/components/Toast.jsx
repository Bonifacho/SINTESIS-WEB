import { useEffect, useState } from "react";
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
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  error: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

const ICON_STYLES = {
  success: "text-emerald-500",
  error: "text-red-500",
  warning: "text-amber-500",
  info: "text-blue-500",
};

function Toast({ message, type = "info", onClose }) {
  const Icon = ICONS[type];

  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg max-w-sm animate-slide-in ${STYLES[type]}`}
    >
      <Icon size={18} className={`shrink-0 mt-0.5 ${ICON_STYLES[type]}`} />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={onClose} className="shrink-0 opacity-50 hover:opacity-100 transition-opacity">
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

  const showToast = (message, type = "info") => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const ToastWrapper = () => (
    <ToastContainer toasts={toasts} removeToast={removeToast} />
  );

  return { showToast, ToastContainer: ToastWrapper };
}
