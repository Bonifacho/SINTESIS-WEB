import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, ArrowRight } from "lucide-react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../../api/client";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useToast } from "../../components/Toast";

/**
 * Ovas — Gestión de OVAs de un tema específico.
 */
export default function Ovas() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast, ToastContainer } = useToast();
  
  const topicName = location.state?.topicName || `Tema #${topicId}`;

  const [ovas, setOvas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOva, setEditingOva] = useState(null);
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [isSaving, setIsSaving] = useState(false);

  // Confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchOvas = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get(`/api/v1/academic/topics/${topicId}/ovas`);
      const ovasArray = Array.isArray(data) ? data : (data.data || []);
      const activeOvas = ovasArray.filter((o) => o.is_active === undefined || o.is_active);
      setOvas(activeOvas);
    } catch (err) {
      showToast("Error al cargar los OVAs", "error");
    } finally {
      setIsLoading(false);
    }
  }, [topicId, showToast]);

  useEffect(() => {
    fetchOvas();
  }, [fetchOvas]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setIsSaving(true);
    try {
      if (editingOva) {
        await api.put(`/api/v1/academic/ovas/${editingOva.id}`, formData);
        showToast("OVA actualizado", "success");
      } else {
        await api.post("/api/v1/academic/ovas", {
          ...formData,
          topic_id: parseInt(topicId),
          order_index: ovas.length,
        });
        showToast("OVA creado exitosamente", "success");
      }
      setModalOpen(false);
      fetchOvas();
    } catch (err) {
      showToast(err.response?.data?.error || "Error al guardar OVA", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/v1/academic/ovas/${deleteTarget.id}`);
      showToast("OVA eliminado correctamente", "success");
      setDeleteTarget(null);
      fetchOvas();
    } catch (err) {
      showToast(err.response?.data?.error || "Error al eliminar OVA", "error");
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
      label: "Objeto de Aprendizaje (OVA)",
      render: (val) => (
        <span className="font-bold text-slate-800 text-sm">{val}</span>
      ),
    },
    {
      key: "description",
      label: "Descripción",
      render: (val) => (
        <span className="text-slate-400 text-xs line-clamp-1 max-w-xs">{val || "Sin descripción"}</span>
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      render: (_, row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/teacher/ovas/${row.id}`, { state: { ovaName: row.title, topicName, groupName: location.state?.groupName }})}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 rounded-lg transition-colors border border-emerald-200/60"
          >
            <span>Ver Contenido</span>
            <ArrowRight size={13} />
          </button>
          <button
            onClick={() => {
              setEditingOva(row);
              setFormData({ title: row.title, description: row.description || "" });
              setModalOpen(true);
            }}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Editar OVA"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
            title="Eliminar OVA"
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
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => navigate("/teacher/ovas")}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            title="Volver a temas"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">OVAs de {topicName}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                {ovas.length} módulo{ovas.length !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">
              Crea y administra recursos pedagógicos, videos, documentos y evaluaciones.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingOva(null);
            setFormData({ title: "", description: "" });
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-indigo-600/20 text-sm"
        >
          <Plus size={18} />
          <span>Nuevo OVA</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={ovas}
        isLoading={isLoading}
        emptyMessage="No hay Objetos Virtuales de Aprendizaje creados en este tema todavía. ¡Haz clic en 'Nuevo OVA' para agregar el primero!"
        onRowClick={(row) => navigate(`/teacher/ovas/${row.id}`, { state: { ovaName: row.title, topicName, groupName: location.state?.groupName }})}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingOva ? "Editar Información del OVA" : "Crear Nuevo Objeto Virtual (OVA)"}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Título del OVA
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
              placeholder="Ej: Fundamentos y Leyes del Movimiento"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Descripción didáctica (Opcional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe los objetivos de aprendizaje de este módulo..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none h-24 text-sm"
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
              {isSaving ? "Guardando…" : "Guardar OVA"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="¿Eliminar este OVA?"
        message={`Se eliminará el OVA "${deleteTarget?.title}" y todos sus recursos vinculados. Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        isLoading={isDeleting}
      />
    </div>
  );
}
