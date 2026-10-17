import { useState, useEffect, useCallback } from "react";
import { BookOpen, Users, ClipboardList, LayoutDashboard, ArrowRight, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/LoadingSpinner";

/**
 * Contenido de la página Dashboard del Docente.
 * Muestra métricas reales agregadas para el docente en sesión.
 */
export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    groupsCount: 0,
    ovasCount: 0,
    examsCount: 0,
    groups: [],
  });

  const fetchStats = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // 1. Obtener grupos del docente
      const { data: groupsRes } = await api.get("/api/v1/academic/groups");
      const allGroups = Array.isArray(groupsRes) ? groupsRes : (groupsRes.data || []);
      const myGroups = allGroups.filter(
        (g) => String(g.teacher_id) === String(user.user_id || user.id) && g.is_active
      );

      // 2. Por cada grupo, consultar sus temas y OVAs en paralelo
      let totalOvas = 0;
      let totalExams = 0;

      await Promise.all(
        myGroups.map(async (group) => {
          try {
            const { data: topicsRes } = await api.get(`/api/v1/academic/groups/${group.id}/topics`);
            const topics = Array.isArray(topicsRes) ? topicsRes : (topicsRes.data || []);

            await Promise.all(
              topics.map(async (topic) => {
                try {
                  const { data: ovasRes } = await api.get(`/api/v1/academic/topics/${topic.id}/ovas`);
                  const ovas = Array.isArray(ovasRes) ? ovasRes : (ovasRes.data || []);
                  totalOvas += ovas.length;
                  totalExams += ovas.filter((o) => o.has_exam || o.exam_id).length;
                } catch {
                  // Ignorar errores silenciosos en subconsultas
                }
              })
            );
          } catch {
            // Ignorar errores silenciosos en subconsultas
          }
        })
      );

      setStats({
        groupsCount: myGroups.length,
        ovasCount: totalOvas,
        examsCount: totalExams,
        groups: myGroups,
      });
    } catch (err) {
      console.error("[Dashboard] Error al cargar estadísticas:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Bienvenido, {user?.full_name || user?.username || "Docente"}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Gestiona tus cursos, contenidos y evaluaciones desde aquí.
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={isLoading}
          className="p-2.5 rounded-lg border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
          title="Actualizar datos"
        >
          <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
        </button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div 
          onClick={() => navigate("/teacher/groups")}
          className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer"
        >
          <div className="bg-indigo-50 p-3.5 rounded-lg text-indigo-600">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Mis Grupos</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-0.5">
              {isLoading ? "..." : stats.groupsCount}
            </h3>
          </div>
        </div>

        <div 
          onClick={() => navigate("/teacher/ovas")}
          className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer"
        >
          <div className="bg-emerald-50 p-3.5 rounded-lg text-emerald-600">
            <BookOpen size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">OVAs Creados</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-0.5">
              {isLoading ? "..." : stats.ovasCount}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="bg-amber-50 p-3.5 rounded-lg text-amber-600">
            <ClipboardList size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Exámenes Activos</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-0.5">
              {isLoading ? "..." : stats.examsCount}
            </h3>
          </div>
        </div>
      </div>

      {/* Panel de Accesos Rápidos a Grupos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <LayoutDashboard size={20} className="text-indigo-600" />
            Tus Cursos Asignados
          </h2>
          <button
            onClick={() => navigate("/teacher/groups")}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            Ver todos los grupos <ArrowRight size={14} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner size="md" />
          </div>
        ) : stats.groups.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Users size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No tienes grupos activos asignados actualmente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.groups.map((group) => (
              <div
                key={group.id}
                onClick={() => navigate("/teacher/ovas", { state: { groupId: group.id, groupName: group.name } })}
                className="p-4 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer flex justify-between items-center"
              >
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm">{group.name}</h4>
                  <p className="text-xs text-gray-400 mt-1">Clic para gestionar temas y OVAs</p>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
