import { Users, LayoutDashboard, LogOut, ShieldCheck, BookOpen } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Dashboard del Administrador — Vista principal con acceso total.
 */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { label: "Gestión de Usuarios", icon: Users, path: "/admin/users" },
    { label: "Todos los Grupos", icon: BookOpen, path: "/admin/groups" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col shadow-xl fixed left-0 top-0 bottom-0">
        {/* Brand */}
        <div className="px-6 py-7 border-b border-slate-700/50">
          <h2 className="text-xl font-bold text-white tracking-tight">SÍNTESIS</h2>
          <div className="flex items-center gap-1.5 mt-1">
            <ShieldCheck size={12} className="text-amber-400" />
            <p className="text-xs text-amber-400 font-medium">Administrador</p>
          </div>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-slate-700/50">
          <p className="text-sm font-medium text-white truncate">
            {user?.full_name || "Administrador"}
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
                    ? "bg-amber-600/20 text-amber-300 border-l-[3px] border-amber-400"
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
          <h1 className="text-2xl font-bold text-gray-800">Panel de Administración</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Control total del sistema SÍNTESIS.
          </p>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="bg-amber-50 p-3.5 rounded-lg text-amber-600">
              <Users size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Usuarios del Sistema</p>
              <h3 className="text-xl font-bold text-gray-800 mt-0.5">—</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="bg-indigo-50 p-3.5 rounded-lg text-indigo-600">
              <BookOpen size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Grupos Totales</p>
              <h3 className="text-xl font-bold text-gray-800 mt-0.5">—</h3>
            </div>
          </div>
        </div>

        {/* Placeholder */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-50 mb-4">
            <ShieldCheck size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Centro de Control</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Desde aquí puedes gestionar usuarios, crear cuentas de docentes
            y supervisar toda la actividad del sistema.
          </p>
        </div>
      </main>
    </div>
  );
}
