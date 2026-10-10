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
    { key: "student_name", label: "Nombre" },
    { key: "student_username", label: "Usuario" },
    { key: "student_document", label: "Documento" },
    {
      key: "enrolled_at",
      label: "Fecha Matrícula",
      render: (val) => {
        if (!val) return "—";
        return new Date(val).toLocaleDateString("es-CO", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
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
          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Desmatricular"
        >
          <UserMinus size={16} />
        </button>
      ),
    },
  ];

  return (
    <>
      <ToastContainer />

      {/* Header con botón de volver */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/teacher/groups")}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">{groupName}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {enrollments.length} estudiante{enrollments.length !== 1 ? "s" : ""} matriculado{enrollments.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => {
            setSearchQuery("");
            setAddModalOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors shadow-sm text-sm"
        >
          <UserPlus size={18} />
          Matricular
        </button>
      </div>

      {/* Tabla de matriculados */}
      <DataTable
        columns={columns}
        data={enrollments}
        isLoading={isLoading}
        emptyMessage="No hay estudiantes matriculados en este grupo. Usa el botón 'Matricular' para agregar."
      />

      {/* Modal de búsqueda y matrícula */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Matricular Estudiante"
        size="md"
      >
        {/* Buscador */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all text-sm"
            placeholder="Buscar por nombre, usuario o documento…"
            autoFocus
          />
        </div>

        {/* Lista de estudiantes disponibles */}
        <div className="max-h-80 overflow-y-auto space-y-1">
          {availableStudents.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">
              {searchQuery
                ? "No se encontraron estudiantes con esa búsqueda."
                : "No hay estudiantes disponibles para matricular."}
            </p>
          ) : (
            availableStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {student.full_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    @{student.username} · Doc: {student.document_id}
                  </p>
                </div>
                <button
                  onClick={() => handleEnroll(student.id)}
                  disabled={isEnrolling}
                  className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  <UserPlus size={14} />
                  Agregar
                </button>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Confirm Desmatricular */}
      <ConfirmDialog
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
        title="¿Desmatricular estudiante?"
        message={`"${removeTarget?.student_name}" será removido del grupo. Podrás volver a matricularlo después.`}
        confirmText="Desmatricular"
        isLoading={isRemoving}
      />
    </>
  );
}
