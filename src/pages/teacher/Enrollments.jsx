import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, UserPlus, UserMinus, Search } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/client";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useToast } from "../../components/Toast";

/**
 * Enrollments — Página de matrículas de un grupo académico.
 *
 * Muestra los estudiantes matriculados en el grupo seleccionado y permite
 * buscar estudiantes registrados en el sistema para matricularlos.
 *
 * Consume:
 *   GET    /api/v1/academic/groups/<id>/enrollments
 *   GET    /api/v1/security/users
 *   POST   /api/v1/academic/enrollments
 *   DELETE /api/v1/academic/enrollments/<id>
 */
export default function Enrollments() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();

  const [groupName, setGroupName] = useState("");
  const [enrollments, setEnrollments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal de agregar estudiante
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Confirm dialog para desmatricular
  const [removeTarget, setRemoveTarget] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // ── Cargar datos ───────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [enrollRes, usersRes, groupsRes] = await Promise.all([
        api.get(`/api/v1/academic/groups/${groupId}/enrollments`),
        api.get("/api/v1/security/users"),
        api.get("/api/v1/academic/groups"),
      ]);

      const usersData = usersRes.data.data || [];
      setAllUsers(usersData);

      // Encontrar el nombre del grupo
      const group = (groupsRes.data.data || []).find(
        (g) => g.id === parseInt(groupId)
      );
      setGroupName(group?.name || `Grupo #${groupId}`);

      // Enriquecer las matrículas con datos del estudiante
      const enrollData = (enrollRes.data.data || []).filter((e) => e.is_active === undefined || e.is_active);
      const enriched = enrollData.map((enrollment) => {
        const student = usersData.find((u) => u.id === enrollment.student_id);
        return {
          ...enrollment,
          student_name: student?.full_name || "—",
          student_username: student?.username || "—",
          student_document: student?.document_id || "—",
        };
      });
      setEnrollments(enriched);
    } catch (err) {
      showToast("Error al cargar los datos del grupo", "error");
    } finally {
      setIsLoading(false);
    }
  }, [groupId, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Estudiantes disponibles para matricular ────────────────────────────
  // Filtra: solo estudiantes activos que NO estén ya matriculados en este grupo
  const enrolledStudentIds = new Set(enrollments.map((e) => e.student_id));
  const availableStudents = allUsers.filter((u) => {
    const isStudent = u.roles?.includes("estudiante");
    const isActive = u.is_active === undefined || u.is_active;
    const notEnrolled = !enrolledStudentIds.has(u.id);
    const matchesSearch =
      !searchQuery ||
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.document_id?.includes(searchQuery);
    return isStudent && isActive && notEnrolled && matchesSearch;
  });

  // ── Matricular estudiante ──────────────────────────────────────────────
  const handleEnroll = async (studentId) => {
    setIsEnrolling(true);
    try {
      await api.post("/api/v1/academic/enrollments", {
        student_id: studentId,
        group_id: parseInt(groupId),
      });
      showToast("Estudiante matriculado exitosamente", "success");
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.error || "Error al matricular";
      showToast(msg, "error");
    } finally {
      setIsEnrolling(false);
    }
  };

  // ── Desmatricular estudiante ───────────────────────────────────────────
  const handleRemove = async () => {
    if (!removeTarget) return;
    setIsRemoving(true);
    try {
      await api.delete(`/api/v1/academic/enrollments/${removeTarget.id}`);
      showToast("Estudiante desmatriculado", "success");
      setRemoveTarget(null);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.error || "Error al desmatricular";
      showToast(msg, "error");
    } finally {
      setIsRemoving(false);
    }
  };

  // ── Columnas de la tabla de matriculados ───────────────────────────────
  const columns = [
    {
      key: "student_name",
      label: "Estudiante",
      render: (val, row) => {
        const initial = val?.trim()?.charAt(0)?.toUpperCase() || "E";
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {initial}
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">{val}</p>
              <p className="text-xs text-slate-400">@{row.student_username}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "student_document",
      label: "Documento",
      render: (val) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/60 font-mono">
          {val || "—"}
        </span>
      ),
    },
    {
      key: "enrolled_at",
      label: "Fecha de Matrícula",
      render: (val) => {
        if (!val) return "—";
        return (
          <span className="text-xs text-slate-500 font-medium">
            {new Date(val).toLocaleDateString("es-CO", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "",
      render: (_, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setRemoveTarget(row);
          }}
          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
          title="Desmatricular estudiante"
        >
          <UserMinus size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <ToastContainer />

      {/* Header con botón de volver */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/70 shadow-sm">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => navigate("/teacher/groups")}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            title="Volver a grupos"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{groupName}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                {enrollments.length} matriculado{enrollments.length !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">
              Gestión de estudiantes inscritos y adición de nuevos participantes al curso.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setSearchQuery("");
            setAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-indigo-600/20 text-sm"
        >
          <UserPlus size={17} />
          <span>Matricular Estudiante</span>
        </button>
      </div>

      {/* Tabla de matriculados */}
      <DataTable
        columns={columns}
        data={enrollments}
        isLoading={isLoading}
        emptyMessage="No hay estudiantes matriculados en este grupo todavía. Haz clic en 'Matricular Estudiante' para inscribir alumnos."
      />

      {/* Modal de búsqueda y matrícula */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Inscribir Estudiante al Grupo"
        size="md"
      >
        {/* Buscador */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
            placeholder="Buscar por nombre, usuario o cédula…"
            autoFocus
          />
        </div>

        {/* Lista de estudiantes disponibles */}
        <div className="max-h-80 overflow-y-auto space-y-1.5 divide-y divide-slate-100">
          {availableStudents.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-10 font-medium">
              {searchQuery
                ? "No se encontraron estudiantes que coincidan con la búsqueda."
                : "No hay más estudiantes disponibles para inscribir."}
            </p>
          ) : (
            availableStudents.map((student) => {
              const init = student.full_name?.trim()?.charAt(0)?.toUpperCase() || "E";
              return (
                <div
                  key={student.id}
                  className="flex items-center justify-between px-3.5 py-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-200">
                      {init}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {student.full_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        @{student.username} · Cédula: <span className="font-mono text-slate-500">{student.document_id}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEnroll(student.id)}
                    disabled={isEnrolling}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-semibold transition-all border border-indigo-100 disabled:opacity-50"
                  >
                    <UserPlus size={13} />
                    <span>Inscribir</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </Modal>

      {/* Confirm Remove */}
      <ConfirmDialog
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
        title="¿Desmatricular estudiante?"
        message={`¿Estás seguro de desmatricular a "${removeTarget?.student_name}" de este grupo?`}
        confirmText="Desmatricular"
        isLoading={isRemoving}
      />
    </div>
  );
}
