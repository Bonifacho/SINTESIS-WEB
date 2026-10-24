import { useState, useEffect, useCallback } from "react";
import { BookOpen, Users, ClipboardList, LayoutDashboard, ArrowRight, RefreshCw, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/LoadingSpinner";
import EdaDashboard from "../../components/teacher/EdaDashboard";

/**
 * Contenido de la página Dashboard del Docente.
 * Integra métricas reales y el Dashboard de Análisis Exploratorio de Datos (AED / EDA).
 */
export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [stats, setStats] = useState({
    groupsCount: 0,
    ovasCount: 0,
    examsCount: 0,
    groups: [],
  });

  // Estado para el módulo EDA
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [attempts, setAttempts] = useState([]);
  const [activityEvents, setActivityEvents] = useState([]);
  const [isLoadingEda, setIsLoadingEda] = useState(false);

  // 1. Cargar estadísticas generales y grupos del docente
  const fetchStatsAndGroups = useCallback(async () => {
    if (!user) return;
    setIsLoadingStats(true);
    try {
      const { data: groupsRes } = await api.get("/api/v1/academic/groups");
      const allGroups = Array.isArray(groupsRes) ? groupsRes : (groupsRes.data || []);
      const myGroups = allGroups.filter(
        (g) => String(g.teacher_id) === String(user.user_id || user.id) && g.is_active
      );

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
                  // ignorar errores silenciosos
                }
              })
            );
          } catch {
            // ignorar errores silenciosos
          }
        })
      );

      setStats({
        groupsCount: myGroups.length,
        ovasCount: totalOvas,
        examsCount: totalExams,
        groups: myGroups,
      });

      return myGroups;
    } catch (err) {
      console.error("[Dashboard] Error al cargar estadísticas:", err);
      return [];
    } finally {
      setIsLoadingStats(false);
    }
  }, [user]);

  // 2. Cargar intentos y eventos de student_progress para el AED
  const fetchEdaData = useCallback(async (currentGroups) => {
    const targetGroups = currentGroups || stats.groups;
    if (!targetGroups || targetGroups.length === 0) {
      setAttempts([]);
      setActivityEvents([]);
      return;
    }

    setIsLoadingEda(true);
    try {
      const groupsToQuery = selectedGroupId
        ? targetGroups.filter((g) => String(g.id) === String(selectedGroupId))
        : targetGroups;

      const groupDataList = await Promise.all(
        groupsToQuery.map(async (group) => {
          try {
            const [attemptsRes, activityRes] = await Promise.all([
              api.get(`/api/v1/academic/groups/${group.id}/attempts`).catch(() => ({ data: [] })),
              api.get(`/api/v1/academic/groups/${group.id}/activity`).catch(() => ({ data: [] })),
            ]);

            const fetchedAttempts = Array.isArray(attemptsRes.data)
              ? attemptsRes.data
              : attemptsRes.data?.data || [];

            const fetchedActivity = Array.isArray(activityRes.data)
              ? activityRes.data
              : activityRes.data?.data || [];

            return {
              attempts: fetchedAttempts.map((a) => ({
                ...a,
                group_id: group.id,
                group_name: group.name,
              })),
              activity: fetchedActivity.map((ac) => ({
                ...ac,
                group_id: group.id,
                group_name: group.name,
              })),
            };
          } catch {
            return { attempts: [], activity: [] };
          }
        })
      );

      const allAtts = groupDataList.flatMap((g) => g.attempts);
      const allActs = groupDataList.flatMap((g) => g.activity);

      setAttempts(allAtts);
      setActivityEvents(allActs);
    } catch (err) {
      console.error("[Dashboard] Error al cargar datos para AED:", err);
    } finally {
      setIsLoadingEda(false);
    }
  }, [selectedGroupId, stats.groups]);

  // Carga inicial coordinada
  useEffect(() => {
    fetchStatsAndGroups().then((groups) => {
      if (groups && groups.length > 0) {
        fetchEdaData(groups);
      }
    });
  }, [fetchStatsAndGroups]);

  // Recargar EDA cuando cambia el grupo seleccionado
  useEffect(() => {
    if (stats.groups.length > 0) {
      fetchEdaData(stats.groups);
    }
  }, [selectedGroupId, fetchEdaData, stats.groups]);

  const handleRefreshAll = async () => {
    const groups = await fetchStatsAndGroups();
    if (groups && groups.length > 0) {
      await fetchEdaData(groups);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 text-white p-7 sm:p-9 shadow-xl border border-slate-800/80">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-20 -top-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wide border border-indigo-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Portal Docente Activo · PGC 6° Semestre
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Bienvenido, {user?.full_name || user?.username || "Docente"}
            </h1>
            <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
              Supervisa el rendimiento académico de tus grupos mediante analítica descriptiva, histogramas de frecuencia y trazabilidad en tiempo real.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefreshAll}
              disabled={isLoadingStats || isLoadingEda}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all shadow-sm active:scale-95"
              title="Actualizar datos"
            >
              <RefreshCw size={18} className={(isLoadingStats || isLoadingEda) ? "animate-spin text-indigo-400" : ""} />
            </button>
            <button
              onClick={() => navigate("/teacher/results")}
              className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all active:scale-95 flex items-center gap-2"
            >
              <BarChart3 size={16} />
              <span>Ver Calificaciones</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats Cards de Conteo ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Mis Grupos */}
        <div 
          onClick={() => navigate("/teacher/groups")}
          className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200/70 hover:shadow-md hover:border-indigo-300/80 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-inner group-hover:scale-105 transition-transform">
              <Users size={22} />
            </div>
            <span className="text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              Gestionar <ArrowRight size={13} />
            </span>
          </div>
          <div className="mt-5">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Mis Grupos</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {isLoadingStats ? "..." : stats.groupsCount}
              </h3>
              <span className="text-xs text-slate-400 font-medium">asignados</span>
            </div>
          </div>
        </div>

        {/* OVAs Creados */}
        <div 
          onClick={() => navigate("/teacher/ovas")}
          className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200/70 hover:shadow-md hover:border-emerald-300/80 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-inner group-hover:scale-105 transition-transform">
              <BookOpen size={22} />
            </div>
            <span className="text-xs font-semibold text-emerald-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              Explorar <ArrowRight size={13} />
            </span>
          </div>
          <div className="mt-5">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">OVAs Creados</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {isLoadingStats ? "..." : stats.ovasCount}
              </h3>
              <span className="text-xs text-slate-400 font-medium">módulos</span>
            </div>
          </div>
        </div>

        {/* Exámenes Activos */}
        <div 
          onClick={() => navigate("/teacher/results")}
          className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200/70 hover:shadow-md hover:border-amber-300/80 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-inner group-hover:scale-105 transition-transform">
              <ClipboardList size={22} />
            </div>
            <span className="text-xs font-semibold text-amber-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              Resultados <ArrowRight size={13} />
            </span>
          </div>
          <div className="mt-5">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Exámenes Activos</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {isLoadingStats ? "..." : stats.examsCount}
              </h3>
              <span className="text-xs text-slate-400 font-medium">evaluaciones</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MÓDULO PRINCIPAL: DASHBOARD DE ANALÍTICA EXPLORATORIA (AED) ───── */}
      <EdaDashboard
        groups={stats.groups}
        selectedGroupId={selectedGroupId}
        onGroupChange={setSelectedGroupId}
        attempts={attempts}
        activityEvents={activityEvents}
        isLoading={isLoadingEda}
        onRefresh={() => fetchEdaData(stats.groups)}
      />

      {/* ── Panel de Accesos Rápidos a Grupos ────────────────────────────── */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/70 p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
              <LayoutDashboard size={20} className="text-indigo-600" />
              Tus Grupos Académicos
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Accede directamente a los módulos y matrículas de tus cursos</p>
          </div>
          <button
            onClick={() => navigate("/teacher/groups")}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            Administrar grupos <ArrowRight size={14} />
          </button>
        </div>

        {isLoadingStats ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="md" />
          </div>
        ) : stats.groups.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Users size={26} />
            </div>
            <p className="text-sm font-semibold text-slate-600">No tienes grupos activos asignados actualmente.</p>
            <p className="text-xs text-slate-400 mt-1">Crea tu primer curso en la sección de grupos para comenzar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.groups.map((group) => (
              <div
                key={group.id}
                className="p-5 rounded-2xl border border-slate-200/70 bg-slate-50/40 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100">
                      Curso #{group.id}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Activo" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base mt-2.5 leading-snug">{group.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">Asignado a tu cuenta docente</p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => navigate(`/teacher/groups/${group.id}`)}
                    className="text-xs font-semibold text-slate-600 hover:text-indigo-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1"
                  >
                    <Users size={13} />
                    <span>Estudiantes</span>
                  </button>
                  <button
                    onClick={() => navigate("/teacher/ovas", { state: { groupId: group.id, groupName: group.name } })}
                    className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1 active:scale-95"
                  >
                    <span>Ver OVAs</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
