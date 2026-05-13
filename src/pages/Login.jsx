import { useState } from "react";
import { LogIn, AlertCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Login — Pantalla de inicio de sesión del portal web.
 *
 * Conecta directamente con POST /api/v1/security/login via AuthContext.
 * Después de autenticar:
 *   - Si el usuario tiene rol "administrador" → redirige a /admin/dashboard
 *   - Si el usuario tiene rol "docente"       → redirige a /teacher/dashboard
 *   - Si no tiene ninguno de esos roles       → muestra error de acceso denegado
 */
export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const userData = await login(username, password);

      // Redirigir según el rol principal del usuario
      const roles = userData.roles || [];
      if (roles.includes("administrador")) {
        navigate("/admin/dashboard", { replace: true });
      } else if (roles.includes("docente")) {
        navigate("/teacher/dashboard", { replace: true });
      }
    } catch (err) {
      // Extraer mensaje de error legible
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Error de conexión. Verifica que el servidor esté activo.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Decorative background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-10 pb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 mb-5">
              <LogIn size={30} className="text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">SÍNTESIS</h1>
            <p className="text-slate-400 mt-2 text-sm">Portal Administrativo y Docente</p>
          </div>

          {/* Form */}
          <div className="px-8 pb-10">
            {/* Error message */}
            {error && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3.5 mb-6">
                <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Usuario
                </label>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all"
                  placeholder="ej: profemaria"
                  required
                  autoComplete="username"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Contraseña
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
              </div>

              <button
                id="login-submit"
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 flex justify-center items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Autenticando…
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </button>
            </form>

            <p className="text-center text-slate-500 text-xs mt-6">
              Los estudiantes deben usar la aplicación móvil.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-6">
          SÍNTESIS © 2026 — Sistema INtegrado Tecnológico
        </p>
      </div>
    </div>
  );
}
