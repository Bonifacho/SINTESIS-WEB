import { useState, useEffect } from "react";
import { Users, BookOpen, ShieldCheck, GraduationCap, UserCog, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";

/**
 * AdminDashboard — Panel de control del administrador con stats reales.
 */
export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: null, docentes: null, estudiantes: null, administradores: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/api/v1/security/users");
        const users = data.data || [];
        const docentes = users.filter(u => u.roles.includes("docente")).length;
        const estudiantes = users.filter(u => u.roles.includes("estudiante")).length;
        const admins = users.filter(u => u.roles.includes("administrador")).length;
        setStats({ total: users.length, docentes, estudiantes, administradores: admins });
      } catch {
        // silencioso — los stats simplemente no se cargan
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className={`bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}>
      <div className={`${color} p-3.5 rounded-lg`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        {isLoading ? (
          <div className="h-6 w-12 bg-gray-100 rounded animate-pulse mt-1" />
        ) : (
          <h3 className="text-2xl font-bold text-gray-800 mt-0.5">{value ?? "—"}</h3>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Bienvenido, <span className="text-amber-600">{user?.full_name?.split(" ")[0] || "Administrador"}</span>
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Control total del sistema SÍNTESIS — Panel de Administración
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Usuarios" value={stats.total} color="bg-amber-50 text-amber-600" />
        <StatCard icon={UserCog} label="Docentes" value={stats.docentes} color="bg-indigo-50 text-indigo-600" />
        <StatCard icon={GraduationCap} label="Estudiantes" value={stats.estudiantes} color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={ShieldCheck} label="Admins" value={stats.administradores} color="bg-purple-50 text-purple-600" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Ir a Usuarios */}
        <Link
          to="/admin/users"
          className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-amber-200 transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="bg-amber-50 p-3 rounded-lg text-amber-600">
              <Users size={24} />
            </div>
            <ArrowRight size={18} className="text-gray-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-semibold text-gray-800 mb-1">Gestión de Usuarios</h3>
          <p className="text-gray-400 text-sm">
            Crea docentes, estudiantes y administradores. Desactiva cuentas cuando sea necesario.
          </p>
        </Link>

        {/* Ir a Actividades */}
        <Link
          to="/admin/activities"
          className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-indigo-200 transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600">
              <BookOpen size={24} />
            </div>
            <ArrowRight size={18} className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-semibold text-gray-800 mb-1">Actividades del Sistema</h3>
          <p className="text-gray-400 text-sm">
            Visualiza todos los grupos, temas y OVAs creados por docentes en el sistema.
          </p>
        </Link>

        {/* Info card */}
        <div className="md:col-span-2 bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-200/50 rounded-xl p-6 flex items-center gap-5">
          <div className="bg-amber-100 p-3 rounded-lg text-amber-700 shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-1">Flujo recomendado para comenzar</h3>
            <p className="text-gray-500 text-sm">
              1) Crea las cuentas de <strong>docentes</strong> → 2) Los docentes crean grupos y OVAs → 3) Estudiantes acceden desde la app móvil.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
