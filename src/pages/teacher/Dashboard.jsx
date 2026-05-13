import { BookOpen, Users, LayoutDashboard, LogOut, ClipboardList, BarChart3 } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Dashboard del Docente — Vista principal después del login.
 * Muestra tarjetas de resumen y navegación lateral a los módulos.
 */
export default function TeacherDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/teacher/dashboard" },
    { label: "Mis Grupos", icon: Users, path: "/teacher/groups" },
    { label: "Gestión OVAs", icon: BookOpen, path: "/teacher/ovas" },
    { label: "Resultados", icon: BarChart3, path: "/teacher/results" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col shadow-xl fixed left-0 top-0 bottom-0">
        {/* Brand */}
        <div className="px-6 py-7 border-b border-slate-700/50">
          <h2 className="text-xl font-bold text-white tracking-tight">SÍNTESIS</h2>
          <p className="text-xs text-slate-400 mt-1">Panel Docente</p>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-slate-700/50">
          <p className="text-sm font-medium text-white truncate">
            {user?.full_name || "Docente"}
          </p>
          <p className="text-xs text-slate-400 truncate">@{user?.username}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${
                  isActive
                    ? "bg-indigo-600/20 text-indigo-300 border-l-[3px] border-indigo-400"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white border-l-[3px] border-transparent"
                }`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-700/50">
          <button
            id="logout-button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            Bienvenido, {user?.full_name?.split(" ")[0] || "Docente"}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Gestiona tus cursos, contenidos y evaluaciones desde aquí.
          </p>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="bg-indigo-50 p-3.5 rounded-lg text-indigo-600">
              <Users size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Mis Grupos</p>
              <h3 className="text-xl font-bold text-gray-800 mt-0.5">—</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="bg-emerald-50 p-3.5 rounded-lg text-emerald-600">
              <BookOpen size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">OVAs Creados</p>
              <h3 className="text-xl font-bold text-gray-800 mt-0.5">—</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="bg-amber-50 p-3.5 rounded-lg text-amber-600">
              <ClipboardList size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Exámenes</p>
              <h3 className="text-xl font-bold text-gray-800 mt-0.5">—</h3>
            </div>
          </div>
        </div>

        {/* Placeholder content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-50 mb-4">
            <LayoutDashboard size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Panel Principal</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Selecciona una opción del menú lateral para comenzar a gestionar tus grupos,
            crear contenido académico o revisar los resultados de tus estudiantes.
          </p>
        </div>
      </main>
    </div>
  );
}
