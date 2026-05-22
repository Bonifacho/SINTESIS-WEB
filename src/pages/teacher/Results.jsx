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

  // Preparar datos para la tabla cruzando con los diccionarios
  const tableData = useMemo(() => {
    return attempts.map(a => ({
      ...a,
      student_name: students[a.student_id] || `Estudiante #${a.student_id}`,
      exam_name: a.ova_id ? (exams[a.ova_id] || `Examen OVA #${a.ova_id}`) : `Examen #${a.exam_id}`,
    })).sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
  }, [attempts, students, exams]);

  // Cálculos estadísticos rápidos
  const stats = useMemo(() => {
    if (!tableData.length) return { avgScore: 0, passed: 0, total: 0 };
    const total = tableData.length;
    const passed = tableData.filter(a => a.passed).length;
    const avgScore = tableData.reduce((acc, curr) => acc + curr.score, 0) / total;
    return {
      avgScore: Math.round(avgScore),
      passed,
      total,
      passRate: Math.round((passed / total) * 100)
    };
  }, [tableData]);

  const columns = [
    { 
      key: "student_name", 
      label: "Estudiante",
      render: (val) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase">
            {val.charAt(0)}
          </div>
          <span className="font-medium text-gray-800">{val}</span>
        </div>
      )
    },
    { 
      key: "exam_name", 
      label: "Evaluación",
      render: (val) => (
        <span className="flex items-center gap-2 text-gray-600 text-sm">
          <FileText size={16} className="text-gray-400" />
          {val}
        </span>
      )
    },
    { 
      key: "score", 
      label: "Puntaje",
      render: (val, row) => (
        <span className="font-medium text-gray-800">
          {val}% <span className="text-xs text-gray-400 font-normal ml-1">(min: {row.passing_score}%)</span>
        </span>
      )
    },
    { 
      key: "passed", 
      label: "Estado",
      render: (passed) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
          passed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {passed ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          {passed ? 'Aprobado' : 'Reprobado'}
        </span>
      )
    },
    { 
      key: "submitted_at", 
      label: "Fecha de Envío",
      render: (val) => {
        const date = new Date(val);
        return (
          <span className="text-gray-500 text-sm flex items-center gap-2">
            <Calendar size={14} />
            {date.toLocaleDateString()} {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="text-indigo-600" />
            Resultados de Evaluaciones
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Consulta el rendimiento de tus estudiantes por grupo.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500/30 outline-none shadow-sm min-w-[200px]"
              disabled={groups.length === 0}
            >
              {groups.length === 0 ? (
                <option value="">No tienes grupos</option>
              ) : (
                groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))
              )}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Tarjetas de Estadísticas */}
      {tableData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <FileText className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Exámenes Realizados</p>
              <h4 className="text-2xl font-bold text-gray-800">{stats.total}</h4>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="text-emerald-600" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Tasa de Aprobación</p>
              <h4 className="text-2xl font-bold text-gray-800">{stats.passRate}%</h4>
              <p className="text-xs text-emerald-600 font-medium">{stats.passed} aprobados</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="text-indigo-600" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Puntaje Promedio</p>
              <h4 className="text-2xl font-bold text-gray-800">{stats.avgScore}%</h4>
            </div>
          </div>
        </div>
      )}

      {selectedGroupId ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-medium text-gray-700">Registro de Intentos</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar estudiante..." 
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none w-64"
              />
            </div>
          </div>
          <DataTable
            columns={columns}
            data={tableData}
            isLoading={isLoading}
            emptyMessage="Aún no hay resultados para este grupo."
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center mt-6">
          <User size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">Selecciona un grupo</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Elige un grupo en el menú desplegable de arriba para ver las calificaciones y el rendimiento de los estudiantes.
          </p>
        </div>
      )}
    </>
  );
}
