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

  const StatCard = ({ icon: Icon, label, value, color, bgLight }) => (
    <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex items-center gap-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <div className={`w-12 h-12 rounded-xl ${bgLight} flex items-center justify-center shrink-0 shadow-xs`}>
        <Icon size={22} className={color} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        {isLoading ? (
          <div className="h-7 w-14 bg-slate-100 rounded-lg animate-pulse mt-1" />
        ) : (
          <h3 className="text-2xl font-bold text-slate-800 tracking-tight mt-0.5">{value ?? "—"}</h3>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 rounded-2xl p-6 sm:p-8 text-white mb-8 border border-white/10 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-3 border border-amber-500/30">
              <ShieldCheck size={14} /> Panel de Administración Global
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Bienvenido, {user?.full_name?.split(" ")[0] || "Administrador"}
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl leading-relaxed">
              Supervisa la plataforma SÍNTESIS, administra cuentas de usuario y monitorea las actividades pedagógicas.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 text-xs font-medium text-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Sistema Operativo
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Usuarios" value={stats.total} color="text-amber-600" bgLight="bg-amber-50 border border-amber-100/60" />
        <StatCard icon={UserCog} label="Docentes" value={stats.docentes} color="text-indigo-600" bgLight="bg-indigo-50 border border-indigo-100/60" />
        <StatCard icon={GraduationCap} label="Estudiantes" value={stats.estudiantes} color="text-emerald-600" bgLight="bg-emerald-50 border border-emerald-100/60" />
        <StatCard icon={ShieldCheck} label="Administradores" value={stats.administradores} color="text-purple-600" bgLight="bg-purple-50 border border-purple-100/60" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {/* Ir a Usuarios */}
        <Link
          to="/admin/users"
          className="group bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 hover:shadow-md hover:border-amber-300 transition-all duration-200 hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100/60 flex items-center justify-center text-amber-600 shadow-xs">
              <Users size={22} />
            </div>
            <ArrowRight size={18} className="text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-bold text-slate-800 text-base mb-1">Gestión de Usuarios</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Crea docentes, estudiantes y administradores. Administra roles y el estado de activación de cuentas.
          </p>
        </Link>

        {/* Ir a Actividades */}
        <Link
          to="/admin/activities"
          className="group bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 hover:shadow-md hover:border-indigo-300 transition-all duration-200 hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100/60 flex items-center justify-center text-indigo-600 shadow-xs">
              <BookOpen size={22} />
            </div>
            <ArrowRight size={18} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-bold text-slate-800 text-base mb-1">Actividades del Sistema</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Supervisa todos los grupos académicos, temas curriculares y OVAs creados por los docentes en la plataforma.
          </p>
        </Link>
      </div>

      {/* Info card */}
      <div className="bg-gradient-to-r from-amber-50/70 via-amber-50/40 to-slate-50 border border-amber-200/70 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-200/60 flex items-center justify-center text-amber-700 shrink-0">
          <TrendingUp size={24} />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-sm mb-1">Flujo Recomendado de Operación</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            1) Crea o habilita las cuentas de los <strong>docentes</strong> → 2) Los docentes configuran sus grupos, temas y OVAs → 3) Los estudiantes ingresan y aprenden desde la aplicación móvil.
          </p>
        </div>
      </div>
    </>
  );
}
