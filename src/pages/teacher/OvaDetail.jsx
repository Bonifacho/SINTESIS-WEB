import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, Video, FileText, Link as LinkIcon, File, ClipboardCheck } from "lucide-react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../../api/client";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useToast } from "../../components/Toast";

/**
 * OvaDetail — Gestión de recursos dentro de un OVA.
 */
export default function OvaDetail() {
  const { ovaId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast, ToastContainer } = useToast();
  
  const [ova, setOva] = useState(null);
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [formData, setFormData] = useState({ resource_type: "video", display_title: "", url: "", content: "" });
  const [isSaving, setIsSaving] = useState(false);

  // Confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchOvaData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get(`/api/v1/academic/ovas/${ovaId}`);
      setOva(data.data);
      const activeResources = (data.data.resources || []).filter((r) => r.is_active);
      // Sort por order_index
      activeResources.sort((a, b) => a.order_index - b.order_index);
      setResources(activeResources);
    } catch (err) {
      showToast("Error al cargar detalles del OVA", "error");
    } finally {
      setIsLoading(false);
    }
  }, [ovaId, showToast]);

  useEffect(() => {
    fetchOvaData();
  }, [fetchOvaData]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.display_title.trim()) return;
    setIsSaving(true);
    try {
      if (editingResource) {
        await api.put(`/api/v1/academic/resources/${editingResource.id}`, formData);
        showToast("Recurso actualizado", "success");
      } else {
        await api.post(`/api/v1/academic/ovas/${ovaId}/resources`, {
          ...formData,
          order_index: resources.length,
        });
        showToast("Recurso añadido exitosamente", "success");
      }
      setModalOpen(false);
      fetchOvaData();
    } catch (err) {
      showToast(err.response?.data?.error || "Error al guardar el recurso", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/v1/academic/resources/${deleteTarget.id}`);
      showToast("Recurso eliminado", "success");
      setDeleteTarget(null);
      fetchOvaData();
    } catch (err) {
      showToast("Error al eliminar", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const openModal = (res = null) => {
    if (res) {
      setEditingResource(res);
      setFormData({
        resource_type: res.resource_type,
        display_title: res.display_title,
        url: res.url || "",
        content: res.content || ""
      });
    } else {
      setEditingResource(null);
      setFormData({ resource_type: "video", display_title: "", url: "", content: "" });
    }
    setModalOpen(true);
  };

  const TYPE_ICONS = {
    video: <Video size={16} className="text-red-500" />,
    pdf: <File size={16} className="text-orange-500" />,
    link: <LinkIcon size={16} className="text-blue-500" />,
    text: <FileText size={16} className="text-emerald-500" />
  };

  const TYPE_LABELS = {
    video: "Video",
    pdf: "Documento PDF",
    link: "Enlace Externo",
    text: "Texto Enriquecido"
  };

  const columns = [
    { 
      key: "resource_type", 
      label: "Tipo", 
      render: (val) => (
        <span className="flex items-center gap-2 bg-gray-50 px-2.5 py-1 rounded-md text-xs font-medium text-gray-700 w-max border border-gray-100">
          {TYPE_ICONS[val]} {TYPE_LABELS[val]}
        </span>
      )
    },
    { key: "display_title", label: "Título del Recurso" },
    { 
      key: "content", 
      label: "Contenido", 
      render: (_, row) => (
        <span className="text-sm text-gray-500 truncate max-w-[200px] block">
          {row.resource_type === "text" ? "Contenido de texto..." : row.url}
        </span>
      )
    },
    {
      key: "actions",
      label: "Acciones",
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openModal(row)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
            <Pencil size={16} />
          </button>
          <button onClick={() => setDeleteTarget(row)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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
        <button onClick={() => navigate(-1)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">{ova?.title || "Cargando..."}</h1>
          <p className="text-gray-500 text-sm mt-0.5">Materiales y recursos de este OVA.</p>
        </div>
        <button
          onClick={() => navigate(`/teacher/ovas/${ovaId}/exam`, { state: { ovaName: ova?.title }})}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors shadow-sm text-sm"
        >
          <ClipboardCheck size={18} />
          Configurar Examen
        </button>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors shadow-sm text-sm">
          <Plus size={18} />
          Añadir Recurso
        </button>
      </div>

      {/* Tarjeta de información del OVA */}
      {ova && ova.description && (
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 mb-6 text-sm text-indigo-900">
          <strong className="block mb-1 text-indigo-700">Descripción del OVA:</strong>
          {ova.description}
        </div>
      )}

      <DataTable
        columns={columns}
        data={resources}
        isLoading={isLoading}
        emptyMessage="Aún no has añadido recursos a este OVA."
      />

      {/* Modal Recursos */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingResource ? "Editar Recurso" : "Nuevo Recurso"} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          
          {!editingResource && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de Recurso</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(TYPE_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData({ ...formData, resource_type: key, url: "", content: "" })}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                      formData.resource_type === key 
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-medium" 
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {TYPE_ICONS[key]} {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Título del Recurso</label>
            <input
              type="text"
              value={formData.display_title}
              onChange={(e) => setFormData({ ...formData, display_title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-indigo-500"
              required
            />
          </div>

          {formData.resource_type === "text" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contenido de Texto</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-indigo-500 min-h-[120px] resize-y"
                placeholder="Escribe el contenido aquí..."
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {formData.resource_type === "pdf" ? "URL del PDF" : formData.resource_type === "video" ? "URL del Video (YouTube, etc.)" : "URL del Enlace"}
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-indigo-500"
                placeholder="https://..."
                required
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border rounded-lg hover:bg-gray-50 font-medium text-sm">Cancelar</button>
            <button type="submit" disabled={isSaving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm disabled:opacity-50">
              {isSaving ? "Guardando..." : "Guardar Recurso"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="¿Eliminar Recurso?"
        message={`Se eliminará "${deleteTarget?.display_title}". Esta acción no se puede deshacer.`}
        isLoading={isDeleting}
      />
    </>
  );
}
