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
    { key: "order_index", label: "Orden" },
    { key: "title", label: "Título del OVA" },
    { key: "description", label: "Descripción", render: (val) => <span className="text-gray-500 line-clamp-1">{val || "Sin descripción"}</span> },
    {
      key: "actions",
      label: "Acciones",
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/teacher/ovas/${row.id}`, { state: { ovaName: row.title }});
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors mr-2"
          >
            Contenido <ArrowRight size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingOva(row);
              setFormData({ title: row.title, description: row.description || "" });
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
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate("/teacher/ovas")} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">OVAs de {topicName}</h1>
          <p className="text-gray-500 text-sm mt-0.5">Crea y organiza los Objetos Virtuales de Aprendizaje.</p>
        </div>
        <button
          onClick={() => {
            setEditingOva(null);
            setFormData({ title: "", description: "" });
            setModalOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors shadow-sm text-sm"
        >
          <Plus size={18} />
          Nuevo OVA
        </button>
      </div>

      <DataTable
        columns={columns}
        data={ovas}
        isLoading={isLoading}
        emptyMessage="No hay OVAs en este tema."
        onRowClick={(row) => navigate(`/teacher/ovas/${row.id}`, { state: { ovaName: row.title }})}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingOva ? "Editar OVA" : "Nuevo OVA"} size="sm">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Título del OVA</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-indigo-500"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción (Opcional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-indigo-500 resize-none h-24"
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

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="¿Eliminar OVA?"
        message={`Se eliminará el OVA "${deleteTarget?.title}" y todos sus recursos. Esta acción no se puede deshacer.`}
        isLoading={isDeleting}
      />
    </>
  );
}
