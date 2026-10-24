import { useState, useEffect, useCallback, useMemo } from "react";
import { Download, Search, ChevronDown, CheckCircle2, XCircle, BarChart3, ClipboardList } from "lucide-react";
import api from "../../api/client";
import { useToast } from "../../components/Toast";
import { useAuth } from "../../context/AuthContext";
import EdaDashboard from "../../components/teacher/EdaDashboard";

const PAGE_SIZE = 6;

/**
 * TeacherResults — Vista de resultados de exámenes de los grupos docentes
 * alineada con el boceto visual (Boceto 3) y modo de Análisis Exploratorio (AED).
 */
export default function TeacherResults() {
  const { user } = useAuth();
  const { showToast, ToastContainer } = useToast();

  const [viewMode, setViewMode] = useState("table"); // "table" | "eda"
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all"); // "all" | "passed" | "failed"
  const [studentSearch, setStudentSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [allAttempts, setAllAttempts] = useState([]);
  const [activityEvents, setActivityEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Cargar grupos del docente
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { data } = await api.get("/api/v1/academic/groups");
        const groupsArray = Array.isArray(data) ? data : data.data || [];
        const myGroups = groupsArray.filter(
          (g) => String(g.teacher_id) === String(user?.user_id || user?.id) && g.is_active
        );
        setGroups(myGroups);
      } catch (err) {
        showToast("Error al cargar grupos", "error");
      }
    };
    if (user) {
      fetchGroups();
    }
  }, [showToast, user]);

  // 2. Cargar intentos según grupo o todos los grupos
  const fetchAllResults = useCallback(async () => {
    if (!groups || groups.length === 0) return;
    setIsLoading(true);
    try {
      const targetGroups = selectedGroupId
        ? groups.filter((g) => String(g.id) === String(selectedGroupId))
        : groups;

      const groupResultsPromises = targetGroups.map(async (group) => {
        try {
          const [attemptsRes, groupDetailsRes, topicsRes, activityRes] = await Promise.all([
            api.get(`/api/v1/academic/groups/${group.id}/attempts`).catch(() => ({ data: [] })),
            api.get(`/api/v1/academic/groups/${group.id}`).catch(() => ({ data: {} })),
            api.get(`/api/v1/academic/groups/${group.id}/topics`).catch(() => ({ data: [] })),
            api.get(`/api/v1/academic/groups/${group.id}/activity`).catch(() => ({ data: [] })),
          ]);

          const fetchedAttempts = Array.isArray(attemptsRes.data)
            ? attemptsRes.data
            : attemptsRes.data?.data || [];

          const fetchedActivity = Array.isArray(activityRes.data)
            ? activityRes.data
            : activityRes.data?.data || [];

          const enrolledStudents =
            groupDetailsRes.data?.data?.students || groupDetailsRes.data?.students || [];
          const studentsMap = {};
          enrolledStudents.forEach((s) => {
            studentsMap[s.student_id] = s.student_name;
          });

          const topics = Array.isArray(topicsRes.data)
            ? topicsRes.data
            : topicsRes.data?.data || [];
          const ovaExamTitles = {};

          for (const topic of topics) {
            try {
              const ovasRes = await api.get(`/api/v1/academic/topics/${topic.id}/ovas`);
              const ovas = Array.isArray(ovasRes.data) ? ovasRes.data : ovasRes.data?.data || [];
              for (const ova of ovas) {
                ovaExamTitles[ova.id] = ova.title;
              }
            } catch {
              // ignore error on ova fetch
            }
          }

          return fetchedAttempts.map((attempt) => {
            const rawExamTitle =
              attempt.ova_id && ovaExamTitles[attempt.ova_id]
                ? ovaExamTitles[attempt.ova_id]
                : attempt.ova_title || `Examen #${attempt.exam_id}`;
            const cleanExamTitle = rawExamTitle.replace(/^Evaluaci[oó]n:\s*/i, "");

            return {
              ...attempt,
              group_id: group.id,
              group_name: group.name,
              student_name: studentsMap[attempt.student_id] || `Estudiante #${attempt.student_id}`,
              exam_clean_title: cleanExamTitle,
            };
          });

          return {
            attempts: mappedAttempts,
            activity: fetchedActivity.map((ac) => ({ ...ac, group_id: group.id, group_name: group.name })),
          };
        } catch {
          return { attempts: [], activity: [] };
        }
      });

      const nestedResults = await Promise.all(groupResultsPromises);
      const combinedAttempts = nestedResults.flatMap((r) => r.attempts || []);
      const combinedActivity = nestedResults.flatMap((r) => r.activity || []);

      setAllAttempts(combinedAttempts);
      setActivityEvents(combinedActivity);
    } catch {
      showToast("Error al cargar los resultados de exámenes", "error");
    } finally {
      setIsLoading(false);
    }
  }, [groups, selectedGroupId, showToast]);

  useEffect(() => {
    fetchAllResults();
  }, [fetchAllResults]);

  // 3. Filtrar datos según estudiante y estado
  const filteredData = useMemo(() => {
    let result = [...allAttempts];

    // Filtro por Estado
    if (selectedStatus === "passed") {
      result = result.filter((a) => a.passed);
    } else if (selectedStatus === "failed") {
      result = result.filter((a) => !a.passed);
    }

    // Filtro por Nombre de Estudiante
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      result = result.filter((a) => a.student_name?.toLowerCase().includes(q));
    }

    // Ordenar más recientes primero
    return result.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
  }, [allAttempts, selectedStatus, studentSearch]);

  // Reset a página 1 al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGroupId, selectedStatus, studentSearch]);

  // Paginación
  const totalResults = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const pagedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredData.slice(start, start + PAGE_SIZE);
  }, [filteredData, currentPage]);

  const startIndex = totalResults === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(currentPage * PAGE_SIZE, totalResults);

  // 4. Exportar a CSV (Boceto 3)
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      showToast("No hay datos para exportar con los filtros actuales.", "error");
      return;
    }

    const headers = ["ESTUDIANTE", "GRUPO", "EXAMEN", "PUNTAJE", "ESTADO", "FECHA"];
    const rows = filteredData.map((item) => {
      const dateStr = new Date(item.submitted_at).toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      return [
        `"${item.student_name.replace(/"/g, '""')}"`,
        `"${item.group_name.replace(/"/g, '""')}"`,
        `"${item.exam_clean_title.replace(/"/g, '""')}"`,
        `"${item.score}%"`,
        `"${item.passed ? "Aprobado" : "Reprobado"}"`,
        `"${dateStr}"`,
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Resultados_Examenes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Reporte CSV exportado exitosamente", "success");
  };

  return (
    <>
      <ToastContainer />

      {/* ── Header: Título y Selector de Vista (Tabla vs AED) ──────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Resultados
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Resultados de exámenes y analítica exploratoria de tus grupos
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Segmented control: Tabla vs Dashboard AED */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-inner">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "table"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ClipboardList size={14} />
              <span>Tabla</span>
            </button>
            <button
              onClick={() => setViewMode("eda")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "eda"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 size={14} />
              <span>Dashboard AED</span>
            </button>
          </div>

          {viewMode === "table" && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-800 font-semibold py-2 px-3.5 rounded-xl border border-slate-200/90 shadow-xs transition-all text-xs"
            >
              <Download size={15} className="text-slate-700" />
              <span>Exportar CSV</span>
            </button>
          )}
        </div>
      </div>

      {viewMode === "eda" ? (
        <EdaDashboard
          groups={groups}
          selectedGroupId={selectedGroupId}
          onGroupChange={setSelectedGroupId}
          attempts={allAttempts}
          activityEvents={activityEvents}
          isLoading={isLoading}
          onRefresh={fetchAllResults}
        />
      ) : (
        <>
          {/* ── Barra de Filtros (Boceto 3) ─────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
              {/* Filtro: Grupo */}
              <div className="lg:col-span-3">
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Grupo
                </label>
                <div className="relative">
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full appearance-none pl-3.5 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                  >
                    <option value="">Todos los grupos</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>

          {/* Filtro: Estado */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Estado
            </label>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full appearance-none pl-3.5 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer"
              >
                <option value="all">Todos</option>
                <option value="passed">Aprobado</option>
                <option value="failed">Reprobado</option>
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Filtro: Estudiante */}
          <div className="lg:col-span-6">
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Estudiante
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabla de Resultados (Boceto 3) ──────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-3.5 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  ESTUDIANTE
                </th>
                <th className="py-3.5 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  GRUPO
                </th>
                <th className="py-3.5 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  EXAMEN
                </th>
                <th className="py-3.5 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  PUNTAJE
                </th>
                <th className="py-3.5 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  ESTADO
                </th>
                <th className="py-3.5 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  FECHA
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                    <p className="text-sm font-medium">Cargando resultados...</p>
                  </td>
                </tr>
              ) : pagedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <p className="text-base font-semibold text-slate-600 mb-1">
                      No se encontraron resultados
                    </p>
                    <p className="text-xs text-slate-400">
                      Prueba ajustando los filtros de grupo, estado o estudiante.
                    </p>
                  </td>
                </tr>
              ) : (
                pagedData.map((row) => {
                  const dateStr = new Date(row.submitted_at).toLocaleDateString("es-CO", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <tr
                      key={row.attempt_id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-4 px-6 font-semibold text-slate-800">
                        {row.student_name}
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        {row.group_name}
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        {row.exam_clean_title}
                      </td>
                      <td className="py-4 px-6 font-bold text-emerald-600">
                        {row.score}%
                      </td>
                      <td className="py-4 px-6">
                        {row.passed ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                            Aprobado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100">
                            Reprobado
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-500 text-xs font-medium">
                        {dateStr}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Footer de la Tabla: Conteo y Paginación (Boceto 3) ───────── */}
        <div className="py-3.5 px-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-white">
          <p className="text-xs text-slate-500 font-medium">
            {totalResults > 0
              ? `Mostrando ${startIndex}–${endIndex} de ${totalResults} resultados`
              : "Mostrando 0 resultados"}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || totalResults === 0}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                currentPage === 1 || totalResults === 0
                  ? "border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50/50"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 bg-white shadow-xs"
              }`}
            >
              Ant
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalResults === 0}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                currentPage === totalPages || totalResults === 0
                  ? "border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50/50"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 bg-white shadow-xs"
              }`}
            >
              Sig
            </button>
          </div>
        </div>
      </div>
        </>
      )}
    </>
  );
}
