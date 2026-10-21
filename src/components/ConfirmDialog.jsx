import { AlertTriangle } from "lucide-react";

/**
 * ConfirmDialog — Diálogo de confirmación para acciones destructivas.
 *
 * Props:
 *   - isOpen:       Boolean que controla la visibilidad.
 *   - onClose:      Callback para cancelar/cerrar.
 *   - onConfirm:    Callback al confirmar la acción.
 *   - title:        Título del diálogo (default: "¿Estás seguro?").
 *   - message:      Mensaje descriptivo.
 *   - confirmText:  Texto del botón de confirmación (default: "Eliminar").
 *   - isLoading:    Muestra spinner en el botón de confirmar.
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "¿Estás seguro?",
  message = "Esta acción no se puede deshacer.",
  confirmText = "Eliminar",
  isLoading = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm animate-modal-in overflow-hidden">
        <div className="p-6 text-center">
          {/* Warning Icon */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100/80 mb-4 shadow-sm">
            <AlertTriangle size={26} className="text-rose-500" />
          </div>

          <h3 className="text-lg font-bold text-slate-800 mb-1.5">{title}</h3>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">{message}</p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white rounded-xl transition-all font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-rose-200"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Procesando…
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
