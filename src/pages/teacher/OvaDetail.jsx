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
      const activeResources = (data.data.resources || []).filter((r) => r.is_active === undefined || r.is_active);
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
    video: <Video size={16} className="text-rose-500" />,
    pdf: <File size={16} className="text-amber-500" />,
    link: <LinkIcon size={16} className="text-sky-500" />,
    text: <FileText size={16} className="text-emerald-500" />
  };

  const TYPE_BADGES = {
    video: "bg-rose-50 border-rose-100 text-rose-700",
    pdf: "bg-amber-50 border-amber-100 text-amber-700",
    link: "bg-sky-50 border-sky-100 text-sky-700",
    text: "bg-emerald-50 border-emerald-100 text-emerald-700"
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
        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-semibold border ${TYPE_BADGES[val] || "bg-slate-50 border-slate-200 text-slate-700"}`}>
          {TYPE_ICONS[val]} {TYPE_LABELS[val]}
        </span>
      )
    },
    { 
      key: "display_title", 
      label: "Título del Recurso",
      render: (val) => <span className="font-semibold text-slate-800">{val}</span>
    },
    { 
      key: "content", 
      label: "Contenido / Enlace", 
      render: (_, row) => (
        <span className="text-sm text-slate-500 truncate max-w-[260px] block font-mono text-xs">
          {row.resource_type === "text" ? "Contenido de texto estructurado" : row.url}
        </span>
      )
    },
    {
      key: "actions",
      label: "Acciones",
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button 
            onClick={() => openModal(row)} 
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
            title="Editar Recurso"
          >
            <Pencil size={16} />
          </button>
          <button 
            onClick={() => setDeleteTarget(row)} 
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            title="Eliminar Recurso"
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3.5">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200/60"
            title="Volver"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{ova?.title || "Cargando..."}</h1>
            <p className="text-slate-500 text-sm mt-0.5">Gestión de recursos y evaluación de este Objeto Virtual.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => navigate(`/teacher/ovas/${ovaId}/exam`, { state: { ovaName: ova?.title }})}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-medium py-2.5 px-4 rounded-xl transition-all shadow-sm shadow-emerald-200 text-sm"
          >
            <ClipboardCheck size={18} />
            Configurar Examen
          </button>
          <button 
            onClick={() => openModal()} 
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-medium py-2.5 px-4 rounded-xl transition-all shadow-sm shadow-indigo-200 text-sm"
          >
            <Plus size={18} />
            Añadir Recurso
          </button>
        </div>
      </div>

      {/* Tarjeta de información del OVA */}
      {ova && ova.description && (
        <div className="bg-gradient-to-r from-indigo-50/70 via-indigo-50/40 to-slate-50 border border-indigo-100 rounded-2xl p-5 mb-6 text-sm text-slate-700 shadow-xs">
          <div className="flex items-center gap-2 mb-1 text-indigo-700 font-semibold text-xs uppercase tracking-wider">
            Descripción del OVA
          </div>
          <p className="text-slate-600 leading-relaxed">{ova.description}</p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={resources}
        isLoading={isLoading}
        emptyMessage="Aún no has añadido recursos pedagógicos a este OVA."
      />

      {/* Modal Recursos */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingResource ? "Editar Recurso" : "Nuevo Recurso"} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          
          {!editingResource && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Tipo de Recurso</label>
              <div className="grid grid-cols-2 gap-2.5">
                {Object.entries(TYPE_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData({ ...formData, resource_type: key, url: "", content: "" })}
                    className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl border text-sm font-medium transition-all ${
                      formData.resource_type === key 
                        ? "border-indigo-500 bg-indigo-50/80 text-indigo-700 shadow-xs" 
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {TYPE_ICONS[key]} {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Título del Recurso</label>
            <input
              type="text"
              value={formData.display_title}
              onChange={(e) => setFormData({ ...formData, display_title: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-800 text-sm transition-all"
              placeholder="Ej: Video explicativo sobre bucles"
              required
            />
          </div>

          {formData.resource_type === "text" ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Contenido de Texto</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-800 text-sm min-h-[140px] resize-y transition-all"
                placeholder="Escribe el contenido educativo aquí..."
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {formData.resource_type === "pdf" ? "URL del PDF" : formData.resource_type === "video" ? "URL del Video (YouTube / MP4)" : "URL del Enlace"}
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-800 text-sm font-mono transition-all"
                placeholder="https://..."
                required
              />
            </div>
          )}

          <div className="flex gap-3 pt-3">
            <button 
              type="button" 
              onClick={() => setModalOpen(false)} 
              className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium text-sm transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSaving} 
              className="flex-1 py-2.5 bg-indigo-600 active:scale-[0.98] text-white rounded-xl hover:bg-indigo-700 font-medium text-sm disabled:opacity-50 transition-all shadow-sm shadow-indigo-200"
            >
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
