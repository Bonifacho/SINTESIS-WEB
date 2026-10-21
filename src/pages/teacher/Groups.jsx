import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Users, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useToast } from "../../components/Toast";

/**
 * TeacherGroups — Página de gestión de grupos académicos del docente.
 *
 * Consume:
 *   GET    /api/v1/academic/groups
 *   POST   /api/v1/academic/groups
 *   PUT    /api/v1/academic/groups/<id>
 *   DELETE /api/v1/academic/groups/<id>
 */
export default function TeacherGroups() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();

  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Confirm dialog state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Cargar grupos ──────────────────────────────────────────────────────
  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/api/v1/academic/groups");
      // Filtrar solo los grupos del docente actual y que estén activos
      const groupsArray = Array.isArray(data) ? data : (data.data || []);
      const myGroups = groupsArray.filter(
        (g) => String(g.teacher_id) === String(user.user_id) && g.is_active
      );
      setGroups(myGroups);
    } catch (err) {
      showToast("Error al cargar los grupos", "error");
    } finally {
      setIsLoading(false);
    }
  }, [user.user_id, showToast]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // ── Abrir modal para crear ─────────────────────────────────────────────
  const handleCreate = () => {
    setEditingGroup(null);
    setGroupName("");
    setModalOpen(true);
  };

  // ── Abrir modal para editar ────────────────────────────────────────────
  const handleEdit = (group) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setModalOpen(true);
  };

  // ── Guardar (crear o editar) ───────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setIsSaving(true);
    try {
      if (editingGroup) {
        await api.put(`/api/v1/academic/groups/${editingGroup.id}`, {
          name: groupName.trim(),
        });
        showToast("Grupo actualizado exitosamente", "success");
      } else {
        await api.post("/api/v1/academic/groups", {
          name: groupName.trim(),
          teacher_id: user.user_id,
        });
        showToast("Grupo creado exitosamente", "success");
      }
      setModalOpen(false);
      fetchGroups();
    } catch (err) {
      const msg = err.response?.data?.error || "Error al guardar el grupo";
      showToast(msg, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Eliminar (soft delete) ─────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/v1/academic/groups/${deleteTarget.id}`);
      showToast("Grupo eliminado correctamente", "success");
      setDeleteTarget(null);
      fetchGroups();
    } catch (err) {
      const msg = err.response?.data?.error || "Error al eliminar el grupo";
      showToast(msg, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Columnas de la tabla ───────────────────────────────────────────────
  const columns = [
    {
      key: "id",
      label: "Código",
      render: (val) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200/60">
          #{val}
        </span>
      ),
    },
    {
      key: "name",
      label: "Nombre del Curso",
      render: (val) => (
        <span className="font-bold text-slate-800 text-sm">{val}</span>
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      render: (_, row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/teacher/groups/${row.id}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50/80 hover:bg-indigo-100/80 rounded-lg transition-colors border border-indigo-100"
            title="Ver estudiantes matriculados"
          >
            <Users size={14} />
            <span>Estudiantes</span>
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Editar nombre"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
            title="Desactivar grupo"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <ToastContainer />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/70 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Mis Grupos Académicos</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
              {groups.length} activo{groups.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Administra tus cursos asignados, gestiona matrículas y organiza contenidos.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-indigo-600/20 text-sm"
        >
          <Plus size={18} />
          <span>Nuevo Grupo</span>
        </button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={groups}
        isLoading={isLoading}
        emptyMessage="Aún no tienes grupos creados. ¡Haz clic en 'Nuevo Grupo' para comenzar!"
        onRowClick={(row) => navigate(`/teacher/groups/${row.id}`)}
      />

      {/* Modal de Crear/Editar */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingGroup ? "Editar Nombre del Grupo" : "Crear Nuevo Grupo Académico"}
        size="sm"
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Nombre del curso o grupo
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
              placeholder="Ej: Enlace Químico 11-B"
              required
              autoFocus
              disabled={isSaving}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !groupName.trim()}
              className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl transition-all font-semibold text-sm shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Guardando…" : editingGroup ? "Guardar Cambios" : "Crear Grupo"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="¿Desactivar este grupo?"
        message={`El grupo "${deleteTarget?.name}" será marcado como inactivo. Podrás reactivarlo en cualquier momento.`}
        confirmText="Desactivar"
        isLoading={isDeleting}
      />
    </div>
  );
}
