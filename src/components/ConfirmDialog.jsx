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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm animate-modal-in">
        <div className="p-6 text-center">
          {/* Warning Icon */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mb-4">
            <AlertTriangle size={28} className="text-red-500" />
          </div>

          <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 mb-6">{message}</p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
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
