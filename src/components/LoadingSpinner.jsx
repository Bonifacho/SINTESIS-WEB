/**
 * LoadingSpinner — Indicador de carga reutilizable.
 *
 * Props:
 *   - size:  "sm" | "md" | "lg" (default: "md")
 *   - text:  Texto opcional debajo del spinner
 *   - fullScreen: Si true, ocupa toda la pantalla centrado
 */
export default function LoadingSpinner({ size = "md", text, fullScreen = false }) {
  const sizes = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-[3px]",
    lg: "w-12 h-12 border-4",
  };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${sizes[size]} border-indigo-200 border-t-indigo-600 rounded-full animate-spin`}
      />
      {text && <p className="text-gray-500 text-sm font-medium">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">{spinner}</div>
  );
}
