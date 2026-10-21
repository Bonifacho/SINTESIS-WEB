import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, FolderOpen, ArrowRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const { showToast, ToastContainer } = useToast();

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(
    location.state?.groupId ? String(location.state.groupId) : ""
  );
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

  // ── Sincronizar selección si cambia la navegación externa ──────────────────
  useEffect(() => {
    if (location.state?.groupId) {
      setSelectedGroupId(String(location.state.groupId));
    }
  }, [location.state?.groupId]);

  // ── Cargar grupos del docente ──────────────────────────────────────────
  const fetchGroups = useCallback(async () => {
    try {
      const { data } = await api.get("/api/v1/academic/groups");
      const groupsArray = Array.isArray(data) ? data : (data.data || []);
      const myGroups = groupsArray.filter(
        (g) => String(g.teacher_id) === String(user.user_id) && g.is_active
      );
      setGroups(myGroups);
      if (myGroups.length > 0) {
        const navGroupId = location.state?.groupId ? String(location.state.groupId) : null;
        if (navGroupId && myGroups.some((g) => String(g.id) === navGroupId)) {
          setSelectedGroupId(navGroupId);
        } else if (!selectedGroupId) {
          setSelectedGroupId(myGroups[0].id.toString());
        }
      }
    } catch (err) {
      showToast("Error al cargar los grupos", "error");
    }
  }, [user.user_id, showToast, selectedGroupId, location.state?.groupId]);

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
    {
      key: "order_index",
      label: "Orden",
      render: (val, _, idx) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200/60 font-mono">
          #{val ?? (idx + 1)}
        </span>
      ),
    },
    {
      key: "title",
      label: "Título de la Unidad",
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
            onClick={() => navigate(`/teacher/ovas/topic/${row.id}`, { state: { topicName: row.title }})}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50/80 hover:bg-indigo-100/80 rounded-lg transition-colors border border-indigo-100"
          >
            <span>Ver OVAs</span>
            <ArrowRight size={13} />
          </button>
          <button
            onClick={() => {
              setEditingTopic(row);
              setTopicTitle(row.title);
              setModalOpen(true);
            }}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Editar tema"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
            title="Eliminar tema"
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/70 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Gestión de Contenido</h1>
            {selectedGroupId && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                {topics.length} tema{topics.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Administra los temas (unidades pedagógicas) y los objetos virtuales de aprendizaje de cada curso.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Selector de Grupo */}
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-xs min-w-[220px]"
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
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-indigo-600/20 text-sm"
          >
            <Plus size={18} />
            <span>Nuevo Tema</span>
          </button>
        </div>
      </div>

      {!selectedGroupId ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/70 p-14 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <FolderOpen size={30} />
          </div>
          <h3 className="text-base font-bold text-slate-800">Ningún grupo académico seleccionado</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
            Por favor selecciona uno de tus cursos en el menú desplegable superior para ver y administrar sus temas.
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={topics}
          isLoading={isLoading}
          emptyMessage="No hay temas en este curso todavía. ¡Haz clic en 'Nuevo Tema' para crear la primera unidad!"
          onRowClick={(row) => navigate(`/teacher/ovas/topic/${row.id}`, { state: { topicName: row.title }})}
        />
      )}

      {/* Modal CRUD */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTopic ? "Editar Título del Tema" : "Crear Nueva Unidad Temática"}
        size="sm"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Título del tema o unidad
            </label>
            <input
              type="text"
              value={topicTitle}
              onChange={(e) => setTopicTitle(e.target.value)}
              placeholder="Ej: Unidad 1 - Cinemática y Movimiento"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
              autoFocus
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-semibold text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              {isSaving ? "Guardando…" : "Guardar Tema"}
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
        confirmText="Eliminar"
        isLoading={isDeleting}
      />
    </div>
  );
}
