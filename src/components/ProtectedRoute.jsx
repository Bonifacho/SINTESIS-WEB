import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute — Componente de guardia que protege rutas del portal.
 *
 * Props:
 *   - children:      El componente/página a renderizar si pasa la validación.
 *   - allowedRoles:  Array de roles permitidos (ej: ["docente", "administrador"]).
 *                    Si no se pasa, solo valida que haya sesión activa.
 *
 * Comportamiento:
 *   1. Si está cargando la sesión, muestra un spinner.
 *   2. Si no hay token, redirige a /login.
 *   3. Si hay token pero el rol del usuario no está en allowedRoles, redirige a /unauthorized.
 *   4. Si todo es válido, renderiza los children.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, token, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm font-medium">Cargando sesión…</p>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRoles = user.roles || [];
    const hasRole = userRoles.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}
