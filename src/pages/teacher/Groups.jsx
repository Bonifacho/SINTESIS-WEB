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
    { key: "id", label: "ID" },
    { key: "name", label: "Nombre del Grupo" },
    {
      key: "actions",
      label: "Acciones",
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/teacher/groups/${row.id}`);
            }}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Ver matrículas"
          >
            <Users size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            title="Editar nombre"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(row);
            }}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar grupo"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <ToastContainer />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mis Grupos</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gestiona tus grupos académicos y sus estudiantes.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors shadow-sm text-sm"
        >
          <Plus size={18} />
          Nuevo Grupo
        </button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={groups}
        isLoading={isLoading}
        emptyMessage="Aún no tienes grupos creados. ¡Crea tu primer grupo académico!"
        onRowClick={(row) => navigate(`/teacher/groups/${row.id}`)}
      />

      {/* Modal de Crear/Editar */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingGroup ? "Editar Grupo" : "Nuevo Grupo"}
        size="sm"
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre del grupo
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all text-sm"
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
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !groupName.trim()}
              className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Guardando…" : editingGroup ? "Actualizar" : "Crear Grupo"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="¿Eliminar este grupo?"
        message={`El grupo "${deleteTarget?.name}" será desactivado. Los estudiantes matriculados perderán acceso.`}
        confirmText="Eliminar"
        isLoading={isDeleting}
      />
    </>
  );
}
