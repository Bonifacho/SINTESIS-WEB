import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Página mostrada cuando un usuario autenticado intenta acceder
 * a una sección para la cual no tiene el rol requerido.
 */
export default function Unauthorized() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
          <ShieldAlert size={40} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Acceso Denegado</h1>
        <p className="text-gray-500 mb-6">
          No tienes los permisos necesarios para acceder a esta sección del portal.
        </p>
        <Link
          to="/login"
          className="inline-block bg-primary hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
        >
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}
