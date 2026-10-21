import { useState, useEffect, useCallback, useMemo } from "react";
import { BarChart3, Search, Calendar, FileText, CheckCircle2, XCircle, ChevronDown, User } from "lucide-react";
import api from "../../api/client";
import DataTable from "../../components/DataTable";
import { useToast } from "../../components/Toast";
import { useAuth } from "../../context/AuthContext";

/**
 * TeacherResults — Vista de resultados de exámenes por grupo.
 */
export default function TeacherResults() {
  const { user } = useAuth();
  const { showToast, ToastContainer } = useToast();
  
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  
  const [attempts, setAttempts] = useState([]);
  const [students, setStudents] = useState({});
  const [exams, setExams] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Cargar grupos del docente
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { data } = await api.get("/api/v1/academic/groups");
        // Get user from context to filter groups by teacher
        // Since user is not in dependency array, we might need to get it or assume it's filtered
        // Wait, AuthContext is not imported here for `user`. Let's just use the array parsing for now.
        const groupsArray = Array.isArray(data) ? data : (data.data || []);
        const myGroups = groupsArray.filter(
          (g) => String(g.teacher_id) === String(user.user_id) && g.is_active
        );
        setGroups(myGroups);
        if (myGroups.length > 0) {
          setSelectedGroupId(myGroups[0].id.toString());
        }
      } catch (err) {
        showToast("Error al cargar grupos", "error");
      }
    };
    fetchGroups();
  }, [showToast, user.user_id]);

  // Cargar intentos y estudiantes del grupo seleccionado
  const fetchResults = useCallback(async () => {
    if (!selectedGroupId) return;
    setIsLoading(true);
    try {
      // 1. Obtener los intentos
      const attemptsRes = await api.get(`/api/v1/academic/groups/${selectedGroupId}/attempts`);
      const fetchedAttempts = Array.isArray(attemptsRes.data) ? attemptsRes.data : (attemptsRes.data.data || []);
      
      // 2. Obtener los estudiantes del grupo para mapear IDs a nombres
      const groupRes = await api.get(`/api/v1/academic/groups/${selectedGroupId}`);
      const enrolledStudents = groupRes.data.data?.students || groupRes.data?.students || [];
      const studentsMap = {};
      enrolledStudents.forEach(s => {
        studentsMap[s.student_id] = s.student_name;
      });
      setStudents(studentsMap);

      // 3. Obtener nombres de exámenes (como no hay endpoint de batch, extraemos títulos de los ovas del grupo si es posible,
      // o mostramos "Examen #ID". En un sistema ideal el intento traería el nombre del examen).
      // Para efectos del MVP, usaremos el ID del examen si no tenemos el título, 
      // pero podemos intentar cruzar con los temas/ovas del grupo.
      const topicsRes = await api.get(`/api/v1/academic/groups/${selectedGroupId}/topics`);
      const topics = Array.isArray(topicsRes.data) ? topicsRes.data : (topicsRes.data.data || []);
      const examNames = {};
      
      for (const topic of topics) {
        try {
          const ovasRes = await api.get(`/api/v1/academic/topics/${topic.id}/ovas`);
          const ovas = Array.isArray(ovasRes.data) ? ovasRes.data : (ovasRes.data.data || []);
          for (const ova of ovas) {
            // Sabemos que si el examen pertenece a este OVA, podemos llamarlo por el OVA
            // Aquí asociamos ova_id con el título del OVA
            examNames[ova.id] = `Examen: ${ova.title}`;
          }
        } catch(e) {}
      }
      setExams(examNames);
      setAttempts(fetchedAttempts);
    } catch (err) {
      showToast("Error al cargar resultados", "error");
    } finally {
      setIsLoading(false);
    }
  }, [selectedGroupId, showToast]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const [search, setSearch] = useState("");

  // Preparar datos para la tabla cruzando con los diccionarios
  const tableData = useMemo(() => {
    let result = attempts.map(a => ({
      ...a,
      student_name: students[a.student_id] || `Estudiante #${a.student_id}`,
      exam_name: a.ova_id ? (exams[a.ova_id] || `Examen OVA #${a.ova_id}`) : `Examen #${a.exam_id}`,
    })).sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(item =>
        item.student_name?.toLowerCase().includes(q) ||
        item.exam_name?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [attempts, students, exams, search]);

  // Cálculos estadísticos rápidos
  const stats = useMemo(() => {
    if (!attempts.length) return { avgScore: 0, passed: 0, total: 0, passRate: 0 };
    const total = attempts.length;
    const passed = attempts.filter(a => a.passed).length;
    const avgScore = attempts.reduce((acc, curr) => acc + (curr.score || 0), 0) / total;
    return {
      avgScore: Math.round(avgScore),
      passed,
      total,
      passRate: Math.round((passed / total) * 100)
    };
  }, [attempts]);

  const columns = [
    { 
      key: "student_name", 
      label: "Estudiante",
      render: (val) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase shadow-xs">
            {val.charAt(0)}
          </div>
          <span className="font-semibold text-slate-800 text-sm">{val}</span>
        </div>
      )
    },
    { 
      key: "exam_name", 
      label: "Evaluación",
      render: (val) => (
        <span className="flex items-center gap-2 text-slate-600 text-sm font-medium">
          <FileText size={16} className="text-slate-400 shrink-0" />
          {val}
        </span>
      )
    },
    { 
      key: "score", 
      label: "Puntaje Obtenido",
      render: (val, row) => (
        <div className="flex items-baseline gap-1.5">
          <span className="font-bold text-slate-800 text-base">{val}%</span>
          <span className="text-xs text-slate-400 font-normal">(mín: {row.passing_score}%)</span>
        </div>
      )
    },
    { 
      key: "passed", 
      label: "Estado",
      render: (passed) => (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border ${
          passed 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-xs' 
            : 'bg-rose-50 text-rose-700 border-rose-200/80 shadow-xs'
        }`}>
          {passed ? <CheckCircle2 size={13} className="text-emerald-600" /> : <XCircle size={13} className="text-rose-600" />}
          {passed ? 'Aprobado' : 'No Aprobado'}
        </span>
      )
    },
    { 
      key: "submitted_at", 
      label: "Fecha de Envío",
      render: (val) => {
        const date = new Date(val);
        return (
          <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
            <Calendar size={13} className="text-slate-400" />
            {date.toLocaleDateString()} · {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </span>
        );
      }
    }
  ];

  return (
    <>
      <ToastContainer />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="text-indigo-600" size={26} />
            Resultados de Evaluaciones
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Consulta el rendimiento académico y los intentos por grupo.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="appearance-none w-full sm:w-auto pl-4 pr-10 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none shadow-xs min-w-[220px] transition-all"
              disabled={groups.length === 0}
            >
              {groups.length === 0 ? (
                <option value="">No tienes grupos asignados</option>
              ) : (
                groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))
              )}
            </select>
            <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Tarjetas de Estadísticas */}
      {attempts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 flex items-center gap-4 hover:shadow-md transition-all duration-200">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100/60 flex items-center justify-center flex-shrink-0 text-indigo-600">
              <FileText size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Intentos</p>
              <h4 className="text-2xl font-bold text-slate-800 tracking-tight mt-0.5">{stats.total}</h4>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 flex items-center gap-4 hover:shadow-md transition-all duration-200">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100/60 flex items-center justify-center flex-shrink-0 text-emerald-600">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tasa de Aprobación</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <h4 className="text-2xl font-bold text-slate-800 tracking-tight">{stats.passRate}%</h4>
                <span className="text-xs text-emerald-600 font-semibold">({stats.passed} aprobados)</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 flex items-center gap-4 hover:shadow-md transition-all duration-200">
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100/60 flex items-center justify-center flex-shrink-0 text-purple-600">
              <BarChart3 size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Puntaje Promedio</p>
              <h4 className="text-2xl font-bold text-slate-800 tracking-tight mt-0.5">{stats.avgScore}%</h4>
            </div>
          </div>
        </div>
      )}

      {selectedGroupId ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por estudiante o examen..." 
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/80 rounded-xl text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-700 shadow-xs transition-all"
              />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={tableData}
            isLoading={isLoading}
            emptyMessage={search ? "No se encontraron intentos que coincidan con la búsqueda." : "Aún no se registran evaluaciones enviadas en este grupo."}
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-12 text-center mt-6">
          <User size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-1.5">Selecciona un grupo docente</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Elige un grupo en el menú desplegable superior para examinar el historial de intentos y calificaciones de los estudiantes.
          </p>
        </div>
      )}
    </>
  );
}
