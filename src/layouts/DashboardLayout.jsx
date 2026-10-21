import { LogOut, Menu, X } from "lucide-react";
import { useNavigate, useLocation, Link, Outlet } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

/**
 * DashboardLayout — Layout compartido para Docente y Admin.
 *
 * Props:
 *   - menuItems:  Array de { label, icon, path }
 *   - panelTitle: "Panel Docente" | "Administrador"
 *   - accentColor: "indigo" | "amber" (para diferenciar visualmente)
 *
 * Usa <Outlet /> de React Router para renderizar la página hija.
 */
export default function DashboardLayout({ menuItems = [], panelTitle = "Panel", accentColor = "indigo" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    setIsLoggingOut(false);
    navigate("/login", { replace: true });
  };

  const accentStyles = {
    indigo: {
      active: "bg-indigo-600/25 text-indigo-200 border-l-[3px] border-indigo-400 font-semibold shadow-sm",
      badge: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
      avatarBg: "bg-indigo-600 text-white",
      dot: "bg-indigo-400",
    },
    amber: {
      active: "bg-amber-600/25 text-amber-200 border-l-[3px] border-amber-400 font-semibold shadow-sm",
      badge: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
      avatarBg: "bg-amber-600 text-white",
      dot: "bg-amber-400",
    },
  };
  const accent = accentStyles[accentColor] || accentStyles.indigo;

  const userInitial = user?.full_name?.trim()?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || "U";

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="px-6 py-6 border-b border-slate-800/80 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-black text-white shadow-md shadow-indigo-900/40 text-sm tracking-wider">
              S
            </div>
            <h2 className="text-lg font-extrabold text-white tracking-wider">SÍNTESIS</h2>
          </div>
          <div className="mt-2.5">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${accent.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${accent.dot} animate-pulse`} />
              {panelTitle}
            </span>
          </div>
        </div>
      </div>

      {/* User profile card */}
      <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full ${accent.avatarBg} font-bold text-sm flex items-center justify-center shadow-inner ring-2 ring-slate-800 flex-shrink-0`}>
            {userInitial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-100 truncate leading-snug">
              {user?.full_name || "Usuario"}
            </p>
            <p className="text-xs text-slate-400 truncate">@{user?.username || "sintesis"}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Menú Principal
        </p>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 text-sm ${
                isActive
                  ? accent.active
                  : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100 border-l-[3px] border-transparent font-medium"
              }`}
            >
              <item.icon size={18} className={isActive ? "text-white" : "text-slate-400 group-hover:text-white"} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800/80">
        <button
          onClick={() => setIsLogoutConfirmOpen(true)}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 rounded-xl transition-colors text-sm font-semibold border border-transparent hover:border-rose-900/40"
        >
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ── Mobile overlay ──────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar (Desktop: fixed, Mobile: slide-in) ──────────────────── */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-64 bg-slate-950 text-white flex flex-col shadow-2xl z-40 border-r border-slate-800/60
          transition-transform duration-200 ease-in-out
          lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Close button (mobile only) */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X size={20} />
        </button>
        {sidebarContent}
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        {/* Top bar (mobile) */}
        <header className="lg:hidden bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu size={22} />
            </button>
            <h2 className="text-sm font-bold text-slate-900">SÍNTESIS</h2>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${accent.badge}`}>
            {panelTitle}
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 sm:p-7 lg:p-9 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
        title="Cerrar Sesión"
        message="¿Estás seguro de que deseas salir del portal SÍNTESIS?"
        confirmText="Salir"
        isLoading={isLoggingOut}
      />
    </div>
  );
}
