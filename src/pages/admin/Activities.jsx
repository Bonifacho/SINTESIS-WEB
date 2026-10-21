import { useState, useEffect, useCallback } from "react";
import { BookOpen, Users, FileText, BarChart3, ChevronRight, Search, RefreshCw } from "lucide-react";
import api from "../../api/client";
import LoadingSpinner from "../../components/LoadingSpinner";

/**
 * AdminActivities — Vista de todas las actividades académicas del sistema.
 * El administrador puede supervisar grupos, temas y OVAs de todos los docentes.
 */
export default function AdminActivities() {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState("");
  const [expandedGroup, setExpandedGroup] = useState(null);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { data } = await api.get("/api/v1/academic/groups");
      setGroups(data.data || data || []);
    } catch (err) {
      setGroups([]);
      setLoadError(err.response?.data?.error || "No se pudieron cargar los grupos.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const filtered = groups.filter(g =>
    g.name?.toLowerCase().includes(search.toLowerCase()) ||
    g.teacher_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <BookOpen className="text-amber-600" size={26} />
            Actividades del Sistema
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Supervisa los grupos académicos, temas curriculares y OVAs creados en la plataforma.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchGroups}
            className="p-2.5 rounded-xl border border-slate-200/80 text-slate-500 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50 active:scale-[0.98] transition-all shadow-xs"
            title="Recargar actividades"
          >
            <RefreshCw size={17} className={isLoading ? "animate-spin text-amber-600" : ""} />
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre de grupo o docente a cargo..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none text-slate-700 shadow-xs transition-all"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : loadError ? (
        <div className="bg-rose-50 rounded-2xl border border-rose-200 p-8 text-center shadow-xs">
          <p className="text-rose-700 text-sm font-semibold">{loadError}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-12 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 mb-4">
            <BookOpen size={24} className="text-slate-400" />
          </div>
          <p className="text-slate-500 text-sm font-medium">
            {search ? "No se encontraron grupos que coincidan con la búsqueda." : "Aún no hay grupos creados en la plataforma."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs text-center">
              <p className="text-2xl font-extrabold text-amber-600 tracking-tight">{groups.length}</p>
              <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">Grupos</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs text-center">
              <p className="text-2xl font-extrabold text-indigo-600 tracking-tight">
                {groups.reduce((acc, g) => acc + (g.topics_count || g.topics?.length || 0), 0)}
              </p>
              <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">Temas</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs text-center">
              <p className="text-2xl font-extrabold text-emerald-600 tracking-tight">
                {groups.reduce((acc, g) => acc + (g.ovas_count || 0), 0)}
              </p>
              <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">OVAs</p>
            </div>
          </div>

          {/* Groups list */}
          {filtered.map(group => (
            <div
              key={group.id}
              className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden hover:shadow-md transition-all duration-200"
            >
              {/* Group header */}
              <button
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50/60 transition-colors"
                onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100/60 flex items-center justify-center text-amber-600 shrink-0 shadow-xs">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-base leading-snug">{group.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Docente: <span className="font-semibold text-slate-700">{group.teacher_name || group.teacher?.full_name || "—"}</span>
                      {group.students_count !== undefined && (
                        <span className="ml-2.5 font-medium text-slate-400">· {group.students_count} estudiantes</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    {group.topics_count !== undefined && (
                      <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100/80 px-2.5 py-1 rounded-xl font-semibold shadow-xs">
                        {group.topics_count} temas
                      </span>
                    )}
                    {group.ovas_count !== undefined && (
                      <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100/80 px-2.5 py-1 rounded-xl font-semibold shadow-xs">
                        {group.ovas_count} OVAs
                      </span>
                    )}
                  </div>
                  <ChevronRight
                    size={17}
                    className={`text-slate-400 transition-transform duration-200 ${expandedGroup === group.id ? "rotate-90 text-amber-600" : ""}`}
                  />
                </div>
              </button>

              {/* Expanded details */}
              {expandedGroup === group.id && (
                <div className="border-t border-slate-100 px-6 py-5 bg-slate-50/60">
                  <GroupDetails groupId={group.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function GroupDetails({ groupId }) {
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/api/v1/academic/groups/${groupId}/topics`);
        setTopics(data.data || data || []);
      } catch {
        setTopics([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [groupId]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm py-2 font-medium">
        <div className="w-4 h-4 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
        Cargando contenidos temáticos...
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <p className="text-sm text-slate-400 py-2 flex items-center gap-2 font-medium">
        <FileText size={15} />
        Este grupo aún no tiene temas asignados.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
        <BarChart3 size={13} className="text-indigo-600" />
        Temas y Contenidos del Grupo
      </p>
      {topics.map(topic => (
        <div
          key={topic.id}
          className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-slate-200/80 shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-sm text-slate-800 font-semibold">{topic.name || topic.title}</span>
          </div>
          {topic.ovas_count !== undefined && (
            <span className="text-xs bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-lg font-medium">
              {topic.ovas_count} OVAs
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
