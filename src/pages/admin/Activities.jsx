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
  const [search, setSearch] = useState("");
  const [expandedGroup, setExpandedGroup] = useState(null);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/api/v1/groups");
      setGroups(data.data || data || []);
    } catch {
      setGroups([]);
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
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="text-amber-500" />
            Actividades del Sistema
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Supervisa todos los grupos y OVAs creados en la plataforma.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchGroups}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50 transition-colors"
            title="Recargar"
          >
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por grupo o docente..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/30 outline-none shadow-sm"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-50 mb-4">
            <BookOpen size={24} className="text-gray-300" />
          </div>
          <p className="text-gray-400 text-sm">
            {search ? "No se encontraron grupos con ese criterio." : "No hay grupos creados en el sistema aún."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
              <p className="text-2xl font-bold text-amber-600">{groups.length}</p>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Grupos</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
              <p className="text-2xl font-bold text-indigo-600">
                {groups.reduce((acc, g) => acc + (g.topics_count || g.topics?.length || 0), 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Temas</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
              <p className="text-2xl font-bold text-emerald-600">
                {groups.reduce((acc, g) => acc + (g.ovas_count || 0), 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">OVAs</p>
            </div>
          </div>

          {/* Groups list */}
          {filtered.map(group => (
            <div
              key={group.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200"
            >
              {/* Group header */}
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
                onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                    <Users size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{group.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Docente: {group.teacher_name || group.teacher?.full_name || "—"} 
                      {group.students_count !== undefined && (
                        <span className="ml-2">· {group.students_count} estudiantes</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    {group.topics_count !== undefined && (
                      <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-medium">
                        {group.topics_count} temas
                      </span>
                    )}
                    {group.ovas_count !== undefined && (
                      <span className="text-xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-medium">
                        {group.ovas_count} OVAs
                      </span>
                    )}
                  </div>
                  <ChevronRight
                    size={16}
                    className={`text-gray-400 transition-transform duration-200 ${expandedGroup === group.id ? "rotate-90" : ""}`}
                  />
                </div>
              </button>

              {/* Expanded details */}
              {expandedGroup === group.id && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
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
        const { data } = await api.get(`/api/v1/groups/${groupId}/topics`);
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
      <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
        <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
        Cargando temas...
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-2 flex items-center gap-2">
        <FileText size={14} />
        Este grupo aún no tiene temas.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <BarChart3 size={12} />
        Temas del grupo
      </p>
      {topics.map(topic => (
        <div
          key={topic.id}
          className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-gray-100"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span className="text-sm text-gray-700 font-medium">{topic.name || topic.title}</span>
          </div>
          {topic.ovas_count !== undefined && (
            <span className="text-xs text-gray-400">{topic.ovas_count} OVAs</span>
          )}
        </div>
      ))}
    </div>
  );
}
