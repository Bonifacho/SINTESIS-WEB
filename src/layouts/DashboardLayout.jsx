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
      active: "bg-indigo-600/20 text-indigo-300 border-l-[3px] border-indigo-400",
      badge: "text-indigo-400",
    },
    amber: {
      active: "bg-amber-600/20 text-amber-300 border-l-[3px] border-amber-400",
      badge: "text-amber-400",
    },
  };
  const accent = accentStyles[accentColor] || accentStyles.indigo;

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="px-6 py-7 border-b border-slate-700/50">
        <h2 className="text-xl font-bold text-white tracking-tight">SÍNTESIS</h2>
        <p className={`text-xs mt-1 font-medium ${accent.badge}`}>{panelTitle}</p>
      </div>

      {/* User info */}
      <div className="px-6 py-4 border-b border-slate-700/50">
        <p className="text-sm font-medium text-white truncate">
          {user?.full_name || "Usuario"}
        </p>
        <p className="text-xs text-slate-400 truncate">@{user?.username}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${
                isActive
                  ? accent.active
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
          onClick={() => setIsLogoutConfirmOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium"
        >
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Mobile overlay ──────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar (Desktop: fixed, Mobile: slide-in) ──────────────────── */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-64 bg-slate-900 text-white flex flex-col shadow-xl z-40
          transition-transform duration-200 ease-in-out
          lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Close button (mobile only) */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-1 text-slate-400 hover:text-white"
        >
          <X size={20} />
        </button>
        {sidebarContent}
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        {/* Top bar (mobile) */}
        <header className="lg:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <Menu size={22} />
          </button>
          <h2 className="text-sm font-semibold text-gray-800">SÍNTESIS</h2>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">
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
