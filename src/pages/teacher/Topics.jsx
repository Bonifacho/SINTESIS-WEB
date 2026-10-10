import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, FolderOpen, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useToast } from "../../components/Toast";

/**
 * Topics — Gestión de Temas.
 * Permite al docente seleccionar uno de sus grupos y administrar los temas (unidades) de este.
 */
export default function Topics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [topicTitle, setTopicTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Cargar grupos del docente ──────────────────────────────────────────
  const fetchGroups = useCallback(async () => {
    try {
      const { data } = await api.get("/api/v1/academic/groups");
      const groupsArray = Array.isArray(data) ? data : (data.data || []);
      const myGroups = groupsArray.filter(
        (g) => String(g.teacher_id) === String(user.user_id) && g.is_active
      );
      setGroups(myGroups);
      if (myGroups.length > 0 && !selectedGroupId) {
        setSelectedGroupId(myGroups[0].id.toString());
      }
    } catch (err) {
      showToast("Error al cargar los grupos", "error");
    }
  }, [user.user_id, showToast, selectedGroupId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // ── Cargar temas del grupo seleccionado ────────────────────────────────
  const fetchTopics = useCallback(async () => {
    if (!selectedGroupId) return;
    setIsLoading(true);
    try {
      const { data } = await api.get(`/api/v1/academic/groups/${selectedGroupId}/topics`);
      const topicsArray = Array.isArray(data) ? data : (data.data || []);
      // Si el backend no envía is_active, asumimos que es activo
      const activeTopics = topicsArray.filter((t) => t.is_active === undefined || t.is_active);
      setTopics(activeTopics);
    } catch (err) {
      showToast("Error al cargar los temas", "error");
      setTopics([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedGroupId, showToast]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  // ── Handlers CRUD ──────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!topicTitle.trim()) return;
    setIsSaving(true);
    try {
      if (editingTopic) {
        await api.put(`/api/v1/academic/topics/${editingTopic.id}`, {
          title: topicTitle.trim(),
        });
        showToast("Tema actualizado", "success");
      } else {
        await api.post("/api/v1/academic/topics", {
          title: topicTitle.trim(),
          group_id: parseInt(selectedGroupId),
          order_index: topics.length, // auto-incremental simple
        });
        showToast("Tema creado exitosamente", "success");
      }
      setModalOpen(false);
      fetchTopics();
    } catch (err) {
      showToast(err.response?.data?.error || "Error al guardar", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/v1/academic/topics/${deleteTarget.id}`);
      showToast("Tema eliminado correctamente", "success");
      setDeleteTarget(null);
      fetchTopics();
    } catch (err) {
      showToast(err.response?.data?.error || "Error al eliminar", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    { key: "order_index", label: "Orden" },
    { key: "title", label: "Título del Tema" },
    {
      key: "actions",
      label: "Acciones",
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/teacher/ovas/topic/${row.id}`, { state: { topicName: row.title }});
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors mr-2"
          >
            Ver OVAs <ArrowRight size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingTopic(row);
              setTopicTitle(row.title);
              setModalOpen(true);
            }}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(row);
            }}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Contenido</h1>
          <p className="text-gray-500 text-sm mt-1">
            Administra los temas (unidades) de tus grupos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Selector de Grupo */}
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500/30 outline-none shadow-sm min-w-[200px]"
          >
            <option value="" disabled>Selecciona un grupo...</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>

          <button
            onClick={() => {
              setEditingTopic(null);
              setTopicTitle("");
              setModalOpen(true);
            }}
            disabled={!selectedGroupId}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-medium py-2.5 px-4 rounded-lg transition-colors shadow-sm text-sm"
          >
            <Plus size={18} />
            Nuevo Tema
          </button>
        </div>
      </div>

      {!selectedGroupId ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <FolderOpen size={40} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700">Ningún grupo seleccionado</h3>
          <p className="text-gray-500 text-sm mt-2">Por favor selecciona un grupo en el menú desplegable superior para ver sus temas.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={topics}
          isLoading={isLoading}
          emptyMessage="No hay temas en este grupo. ¡Crea el primer tema!"
          onRowClick={(row) => navigate(`/teacher/ovas/topic/${row.id}`, { state: { topicName: row.title }})}
        />
      )}

      {/* Modal CRUD */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTopic ? "Editar Tema" : "Nuevo Tema"}
        size="sm"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Título del Tema</label>
            <input
              type="text"
              value={topicTitle}
              onChange={(e) => setTopicTitle(e.target.value)}
              placeholder="Ej: Unidad 1 - Cinemática"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-indigo-500"
              autoFocus
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border rounded-lg hover:bg-gray-50 font-medium text-sm">Cancelar</button>
            <button type="submit" disabled={isSaving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm disabled:opacity-50">
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmación */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="¿Eliminar Tema?"
        message={`Se eliminará el tema "${deleteTarget?.title}" y todos sus OVAs asociados. Esta acción no se puede deshacer.`}
        isLoading={isDeleting}
      />
    </>
  );
}
