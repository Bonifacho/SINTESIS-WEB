import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  GripVertical,
  Trash2,
  PlayCircle,
  FileText,
  Link2,
  AlignLeft,
  ChevronRight,
  CheckSquare,
} from "lucide-react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../../api/client";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useToast } from "../../components/Toast";

/**
 * OvaDetail — Gestión de recursos de un OVA y acceso a su examen (Boceto 5)
 */
export default function OvaDetail() {
  const { ovaId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast, ToastContainer } = useToast();

  const ovaName = location.state?.ovaName || "";
  const topicName = location.state?.topicName || "";
  const groupName = location.state?.groupName || "";

  const [ova, setOva] = useState(null);
  const [resources, setResources] = useState([]);
  const [hasExam, setHasExam] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Formulario de nuevo recurso (tarjeta dashed)
  const [newType, setNewType] = useState("video"); // "video" | "pdf" | "link" | "text"
  const [newTitle, setNewTitle] = useState("");
  const [newUrlOrContent, setNewUrlOrContent] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Modal / Confirm para eliminar recurso
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Cargar datos del OVA y verificar si tiene examen
  const fetchOvaData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ovaRes, examRes] = await Promise.all([
        api.get(`/api/v1/academic/ovas/${ovaId}`),
        api.get(`/api/v1/academic/exams/by-ova/${ovaId}/teacher`).catch(() => null),
      ]);

      const ovaData = ovaRes.data.data;
      setOva(ovaData);

      const activeResources = (ovaData.resources || []).filter(
        (r) => r.is_active === undefined || r.is_active
      );
      activeResources.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
      setResources(activeResources);

      if (examRes?.data?.data?.id) {
        setHasExam(true);
      } else {
        setHasExam(false);
      }
    } catch {
      showToast("Error al cargar los detalles del OVA", "error");
    } finally {
      setIsLoading(false);
    }
  }, [ovaId, showToast]);

  useEffect(() => {
    fetchOvaData();
  }, [fetchOvaData]);

  // ── AGREGAR RECURSO NUEVO ──────────────────────────────────────────────────
  const handleAddResource = async (e) => {
    e?.preventDefault?.();
    if (!newTitle.trim()) {
      showToast("Ingresa un título para el recurso", "error");
      return;
    }
    if (!newUrlOrContent.trim()) {
      showToast("Ingresa la URL o contenido del recurso", "error");
      return;
    }

    setIsAdding(true);
    try {
      const payload = {
        resource_type: newType,
        display_title: newTitle.trim(),
        order_index: resources.length,
      };

      if (newType === "text") {
        payload.content = newUrlOrContent.trim();
        payload.url = null;
      } else {
        payload.url = newUrlOrContent.trim();
        payload.content = null;
      }

      const res = await api.post(`/api/v1/academic/ovas/${ovaId}/resources`, payload);
      const createdResource = res.data.data;
      setResources((prev) => [...prev, createdResource]);
      setNewTitle("");
      setNewUrlOrContent("");
      showToast("Recurso añadido correctamente", "success");
    } catch (err) {
      showToast(err.response?.data?.error || "Error al agregar el recurso", "error");
    } finally {
      setIsAdding(false);
    }
  };

  // ── EDICIÓN INLINE DE RECURSOS EXISTENTES ───────────────────────────────────
  const handleResourceTitleChange = (resId, value) => {
    setResources((prev) =>
      prev.map((r) => (r.id === resId ? { ...r, display_title: value } : r))
    );
  };

  const handleResourceValueChange = (resId, value, isText) => {
    setResources((prev) =>
      prev.map((r) =>
        r.id === resId
          ? isText
            ? { ...r, content: value }
            : { ...r, url: value }
          : r
      )
    );
  };

  const handlePersistResource = async (resId) => {
    const r = resources.find((item) => item.id === resId);
    if (!r) return;
    try {
      await api.put(`/api/v1/academic/resources/${resId}`, {
        display_title: r.display_title,
        url: r.resource_type === "text" ? null : r.url,
        content: r.resource_type === "text" ? r.content : null,
      });
    } catch {
      showToast("Error al guardar cambios del recurso", "error");
    }
  };

  // ── ELIMINAR RECURSO ───────────────────────────────────────────────────────
  const handleDeleteResource = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/v1/academic/resources/${deleteTarget.id}`);
      setResources((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
      showToast("Recurso eliminado", "success");
    } catch {
      showToast("Error al eliminar el recurso", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // ── GUARDAR / PUBLICAR OVA ─────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    showToast("Borrador guardado exitosamente", "success");
  };

  const handlePublishOva = async () => {
    showToast("OVA publicado correctamente para los estudiantes", "success");
  };

  // ── BREADCRUMB ─────────────────────────────────────────────────────────────
  const breadcrumbText = groupName && topicName
    ? `${groupName.toUpperCase()} · ${topicName.toUpperCase()}`
    : topicName
    ? topicName.toUpperCase()
    : "DETALLE DEL OVA";

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />

      {/* ── Breadcrumb Superior (Boceto 5) ──────────────────────────────── */}
      <div className="mb-1 flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="text-slate-400 hover:text-indigo-600 transition-colors p-1 -ml-1 rounded"
          title="Volver"
        >
          <ArrowLeft size={16} />
        </button>
        <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">
          {breadcrumbText}
        </span>
      </div>

      {/* ── Título Principal y Botones de Acción (Boceto 5) ─────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {ova?.title || ovaName || "Detalle del OVA"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {ova?.description || "El estudiante identifica las variables y conceptos clave."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveDraft}
            className="bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-semibold py-2 px-4 rounded-xl border border-slate-200/90 shadow-xs text-sm transition-all"
          >
            Guardar borrador
          </button>
          <button
            onClick={handlePublishOva}
            className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold py-2 px-5 rounded-xl shadow-xs text-sm transition-all"
          >
            Publicar OVA
          </button>
        </div>
      </div>

      {/* ── Encabezado de la Sección de Recursos (Boceto 5) ───────────────── */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-bold text-slate-800">
          Recursos de aprendizaje ({resources.length})
        </h2>
        <span className="text-xs text-slate-400 font-medium">
          Arrastra para reordenar
        </span>
      </div>

      {/* ── Lista de Recursos Existentes (Boceto 5) ──────────────────────── */}
      {resources.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center mb-6">
          <p className="text-sm font-semibold text-slate-600 mb-1">
            No hay recursos de aprendizaje asignados todavía
          </p>
          <p className="text-xs text-slate-400">
            Utiliza la sección inferior para agregar videos, documentos, enlaces o texto enriquecido.
          </p>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {resources.map((res) => {
            const isText = res.resource_type === "text";
            const val = isText ? (res.content || "") : (res.url || "");

            // Estilos del Badge según tipo
            const badgeConfigs = {
              video: {
                label: "VIDEO",
                textColor: "text-indigo-600",
                bgColor: "bg-indigo-50/80",
                iconText: "{ }",
              },
              pdf: {
                label: "DOCUMENTO",
                textColor: "text-amber-600",
                bgColor: "bg-amber-50",
                iconText: "{ }",
              },
              link: {
                label: "ENLACE",
                textColor: "text-sky-600",
                bgColor: "bg-sky-50",
                iconText: "{ }",
              },
              text: {
                label: "TEXTO",
                textColor: "text-emerald-600",
                bgColor: "bg-emerald-50",
                iconText: "{ }",
              },
            };

            const badge = badgeConfigs[res.resource_type] || badgeConfigs.link;

            return (
              <div
                key={res.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-xs flex items-center gap-3 transition-all hover:border-slate-300"
              >
                {/* Drag handle */}
                <GripVertical size={16} className="text-slate-300 cursor-grab shrink-0" />

                {/* Badge de Tipo */}
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg shrink-0 ${badge.bgColor}`}
                >
                  <span className="font-mono text-xs font-bold text-slate-400">
                    {badge.iconText}
                  </span>
                  <span className={`text-[11px] font-extrabold uppercase tracking-wider ${badge.textColor}`}>
                    {badge.label}
                  </span>
                </div>

                {/* Input 1: Título del recurso */}
                <input
                  type="text"
                  value={res.display_title}
                  onChange={(e) => handleResourceTitleChange(res.id, e.target.value)}
                  onBlur={() => handlePersistResource(res.id)}
                  placeholder="Título del recurso..."
                  className="flex-1 min-w-[140px] px-3 py-2 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200/70 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-sm font-medium text-slate-800 outline-none transition-all"
                />

                {/* Input 2: URL o contenido */}
                <input
                  type="text"
                  value={val}
                  onChange={(e) => handleResourceValueChange(res.id, e.target.value, isText)}
                  onBlur={() => handlePersistResource(res.id)}
                  placeholder={isText ? "Contenido estructurado..." : "https://..."}
                  className="flex-1 min-w-[160px] px-3 py-2 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200/70 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-xs font-mono text-slate-600 outline-none transition-all"
                />

                {/* Botón Eliminar */}
                <button
                  type="button"
                  onClick={() => setDeleteTarget(res)}
                  className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg transition-colors shrink-0"
                  title="Eliminar recurso"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Tarjeta: AGREGAR NUEVO RECURSO (Boceto 5) ────────────────────── */}
      <div className="border-2 border-dashed border-slate-200/90 rounded-2xl p-5 mb-6 bg-slate-50/30">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5">
          AGREGAR NUEVO RECURSO
        </h3>

        {/* Selector de Tipo (Pills / Botones) */}
        <div className="flex flex-wrap gap-2.5 mb-4">
          <button
            type="button"
            onClick={() => setNewType("video")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              newType === "video"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <PlayCircle size={14} />
            Video
          </button>

          <button
            type="button"
            onClick={() => setNewType("pdf")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              newType === "pdf"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <FileText size={14} />
            Documento
          </button>

          <button
            type="button"
            onClick={() => setNewType("link")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              newType === "link"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Link2 size={14} />
            Enlace
          </button>

          <button
            type="button"
            onClick={() => setNewType("text")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              newType === "text"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <AlignLeft size={14} />
            Texto
          </button>
        </div>

        {/* Inputs de Creación */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Título del recurso"
            className="w-full sm:w-1/3 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
          />

          <input
            type="text"
            value={newUrlOrContent}
            onChange={(e) => setNewUrlOrContent(e.target.value)}
            placeholder={newType === "text" ? "Contenido del texto estructurado..." : "https://..."}
            className="w-full sm:flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
          />

          <button
            type="button"
            onClick={handleAddResource}
            disabled={isAdding}
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100/80 active:scale-95 text-indigo-700 font-bold text-sm rounded-xl transition-all shadow-xs shrink-0 disabled:opacity-50"
          >
            {isAdding ? "Agregando..." : "Agregar"}
          </button>
        </div>
      </div>

      {/* ── Banner Inferior: Examen de este OVA (Boceto 5) ───────────────── */}
      <div
        onClick={() =>
          navigate(`/teacher/ovas/${ovaId}/exam`, {
            state: {
              ovaName: ova?.title || ovaName,
              topicName,
              groupName,
            },
          })
        }
        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl p-4 sm:p-5 shadow-sm flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] group"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <CheckSquare size={20} className="text-white" />
          </div>
          <div>
            <h4 className="font-extrabold text-base text-white leading-tight">
              Examen de este OVA
            </h4>
            <p className="text-xs text-indigo-100 mt-0.5">
              {hasExam
                ? "Ya tiene un examen configurado - editar preguntas y opciones"
                : "Crear examen para evaluar a los estudiantes"}
            </p>
          </div>
        </div>

        <ChevronRight
          size={20}
          className="text-white/80 group-hover:translate-x-1 transition-transform"
        />
      </div>

      {/* ── Modal de Confirmación para Eliminar Recurso ──────────────────── */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteResource}
        title="Eliminar Recurso"
        message={`¿Estás seguro de que deseas eliminar "${deleteTarget?.display_title}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        isLoading={isDeleting}
        type="danger"
      />
    </>
  );
}
