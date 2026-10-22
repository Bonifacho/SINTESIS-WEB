import { useState, useEffect, useCallback } from "react";
import {
  GripVertical,
  Trash2,
  Check,
  Plus,
  X,
  Eye,
  ArrowLeft,
} from "lucide-react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../../api/client";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useToast } from "../../components/Toast";

/**
 * ExamBuilder — Constructor dinámico de Exámenes (Boceto 4)
 * Edición inline directa de preguntas, opciones y claves correctas.
 */
export default function ExamBuilder() {
  const { ovaId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast, ToastContainer } = useToast();

  const ovaName = location.state?.ovaName || `OVA ${ovaId}`;

  const [exam, setExam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Configuración del examen
  const [examConfig, setExamConfig] = useState({
    title: `Evaluación: ${ovaName}`,
    passing_score: 60,
    max_attempts: 3,
  });

  // Preguntas con opciones y clave de respuesta correcta
  const [questions, setQuestions] = useState([]);

  // Modal de Vista Previa
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAnswers, setPreviewAnswers] = useState({});

  // ConfirmDialog para eliminar pregunta
  const [deleteQTarget, setDeleteQTarget] = useState(null);

  // Cargar examen existente
  const fetchExam = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get(`/api/v1/academic/exams/by-ova/${ovaId}/teacher`);
      const examData = data.data;
      setExam(examData);
      setExamConfig({
        title: examData.title || `Evaluación: ${ovaName}`,
        passing_score: examData.passing_score ?? 60,
        max_attempts: examData.max_attempts ?? 3,
      });

      if (examData.questions) {
        const sortedQuestions = [...examData.questions].sort(
          (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
        );
        sortedQuestions.forEach((q) => {
          if (q.options) {
            q.options.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
          } else {
            q.options = [];
          }
        });
        setQuestions(sortedQuestions);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        // No hay examen aún: listo para crear uno
        setExam(null);
        setQuestions([]);
      } else {
        showToast("Error al cargar el examen", "error");
      }
    } finally {
      setIsLoading(false);
    }
  }, [ovaId, ovaName, showToast]);

  useEffect(() => {
    fetchExam();
  }, [fetchExam]);

  // Asegurar que existe el examen en backend antes de añadir preguntas
  const ensureExamExists = async () => {
    if (exam) return exam;
    const res = await api.post("/api/v1/academic/exams", {
      ...examConfig,
      ova_id: parseInt(ovaId),
    });
    const createdExam = res.data.data;
    setExam(createdExam);
    return createdExam;
  };

  // ── GUARDAR EXAMEN (Botón Header) ──────────────────────────────────────────
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const currentExam = await ensureExamExists();
      await api.put(`/api/v1/academic/exams/${currentExam.id}`, examConfig);
      showToast("Examen guardado exitosamente", "success");
      fetchExam();
    } catch (err) {
      showToast(err.response?.data?.error || "Error al guardar el examen", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // ── PREGUNTAS ──────────────────────────────────────────────────────────────
  const handleAddQuestion = async () => {
    try {
      const currentExam = await ensureExamExists();
      const nextIndex = questions.length;
      const res = await api.post("/api/v1/academic/questions", {
        exam_id: currentExam.id,
        statement: "",
        points: 1,
        order_index: nextIndex,
      });
      const newQ = { ...res.data.data, options: [] };
      setQuestions((prev) => [...prev, newQ]);
      showToast("Pregunta agregada", "success");
    } catch (err) {
      showToast("Error al agregar la pregunta", "error");
    }
  };

  const handleStatementChange = (qId, value) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, statement: value } : q))
    );
  };

  const handlePersistQuestionStatement = async (qId, statement) => {
    const q = questions.find((item) => item.id === qId);
    if (!q) return;
    try {
      await api.put(`/api/v1/academic/questions/${qId}`, {
        statement,
        points: q.points || 1,
      });
    } catch {
      showToast("No se pudo guardar el cambio del enunciado", "error");
    }
  };

  const handleUpdateQuestionPoints = async (qId, points) => {
    const validPoints = Math.max(1, points || 1);
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, points: validPoints } : q))
    );
    const q = questions.find((item) => item.id === qId);
    try {
      await api.put(`/api/v1/academic/questions/${qId}`, {
        statement: q?.statement || "",
        points: validPoints,
      });
    } catch {
      showToast("Error al actualizar puntos", "error");
    }
  };

  const handleDeleteQuestion = async () => {
    if (!deleteQTarget) return;
    try {
      await api.delete(`/api/v1/academic/questions/${deleteQTarget.id}`);
      setQuestions((prev) => prev.filter((q) => q.id !== deleteQTarget.id));
      setDeleteQTarget(null);
      showToast("Pregunta eliminada", "success");
    } catch {
      showToast("Error al eliminar la pregunta", "error");
    }
  };

  // ── OPCIONES ───────────────────────────────────────────────────────────────
  const handleAddOption = async (qId) => {
    const q = questions.find((item) => item.id === qId);
    if (!q) return;
    try {
      const nextIndex = q.options.length;
      const res = await api.post("/api/v1/academic/options", {
        question_id: qId,
        text: "",
        order_index: nextIndex,
      });
      const newOpt = res.data.data;
      setQuestions((prev) =>
        prev.map((item) =>
          item.id === qId
            ? { ...item, options: [...item.options, newOpt] }
            : item
        )
      );
    } catch {
      showToast("Error al agregar la opción", "error");
    }
  };

  const handleOptionTextChange = (qId, optId, value) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? {
              ...q,
              options: q.options.map((opt) =>
                opt.id === optId ? { ...opt, text: value } : opt
              ),
            }
          : q
      )
    );
  };

  const handlePersistOptionText = async (optId, text) => {
    try {
      await api.put(`/api/v1/academic/options/${optId}`, { text });
    } catch {
      showToast("Error al guardar texto de opción", "error");
    }
  };

  const handleDeleteOption = async (qId, optId) => {
    try {
      await api.delete(`/api/v1/academic/options/${optId}`);
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === qId
            ? {
                ...q,
                options: q.options.filter((opt) => opt.id !== optId),
                correct_option_id:
                  q.correct_option_id === optId ? null : q.correct_option_id,
              }
            : q
        )
      );
    } catch {
      showToast("Error al eliminar la opción", "error");
    }
  };

  const handleSetCorrectOption = async (qId, optId) => {
    try {
      await api.post("/api/v1/academic/answer-key", {
        question_id: qId,
        correct_option_id: optId,
      });
      setQuestions((prev) =>
        prev.map((q) => (q.id === qId ? { ...q, correct_option_id: optId } : q))
      );
      showToast("Respuesta correcta actualizada", "success");
    } catch (err) {
      showToast("Error al fijar respuesta correcta", "error");
    }
  };

  const breadcrumbText = `${ovaName.toUpperCase()} - OVA ${ovaId}`;
  const cleanTitle = (examConfig.title || ovaName).replace(/^Evaluaci[oó]n:\s*/i, "");

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

      {/* ── Breadcrumb Superior (Boceto 4) ──────────────────────────────── */}
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

      {/* ── Encabezado Principal y Acciones (Boceto 4) ──────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Evaluación: {cleanTitle}
        </h1>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreviewOpen(true)}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-semibold py-2 px-4 rounded-xl border border-slate-200/90 shadow-xs text-sm transition-all"
          >
            <Eye size={16} className="text-slate-500" />
            Vista previa
          </button>
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold py-2 px-5 rounded-xl shadow-xs text-sm transition-all"
          >
            {isSaving ? "Guardando..." : "Guardar examen"}
          </button>
        </div>
      </div>

      {/* ── Tarjeta de Configuración de Evaluación (Boceto 4) ───────────── */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 mb-8">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Puntaje mínimo para aprobar
            </label>
            <div className="relative w-28">
              <input
                type="number"
                min="0"
                max="100"
                value={examConfig.passing_score}
                onChange={(e) =>
                  setExamConfig((c) => ({
                    ...c,
                    passing_score: Number(e.target.value),
                  }))
                }
                className="w-full pl-3.5 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                %
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Intentos máximos
            </label>
            <div className="w-28">
              <input
                type="number"
                min="1"
                max="20"
                value={examConfig.max_attempts}
                onChange={(e) =>
                  setExamConfig((c) => ({
                    ...c,
                    max_attempts: Number(e.target.value),
                  }))
                }
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Encabezado de la Sección de Preguntas (Boceto 4) ─────────────── */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-bold text-slate-800">
          Preguntas ({questions.length})
        </h2>
        <button
          onClick={handleAddQuestion}
          className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/70 py-1.5 px-3 rounded-lg transition-all"
        >
          <Plus size={15} />
          Agregar pregunta
        </button>
      </div>

      {/* ── Lista de Preguntas Inline (Boceto 4) ─────────────────────────── */}
      {questions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <p className="text-slate-600 font-semibold mb-1">
            No hay preguntas en esta evaluación
          </p>
          <p className="text-xs text-slate-400 mb-4">
            Comienza haciendo clic en el botón "+ Agregar pregunta".
          </p>
          <button
            onClick={handleAddQuestion}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 py-2 px-4 rounded-xl shadow-xs"
          >
            <Plus size={16} />
            Agregar primera pregunta
          </button>
        </div>
      ) : (
        questions.map((q, qIndex) => (
          <div
            key={q.id}
            className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 mb-5 transition-all"
          >
            {/* Barra superior de la pregunta */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <GripVertical size={16} className="text-slate-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  PREGUNTA {qIndex + 1}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <input
                    type="number"
                    min="1"
                    value={q.points || 1}
                    onChange={(e) =>
                      handleUpdateQuestionPoints(q.id, Number(e.target.value))
                    }
                    className="w-10 px-1 py-0.5 text-center bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-700"
                  />
                  <span className="font-semibold text-slate-500">pt</span>
                </div>
                <button
                  onClick={() => setDeleteQTarget(q)}
                  className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                  title="Eliminar pregunta"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Enunciado de la pregunta */}
            <div className="mb-4">
              <input
                type="text"
                value={q.statement}
                onChange={(e) => handleStatementChange(q.id, e.target.value)}
                onBlur={(e) => handlePersistQuestionStatement(q.id, e.target.value)}
                placeholder="¿Escribe el enunciado de la pregunta...?"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>

            {/* Opciones de respuesta */}
            <div className="space-y-2.5 mb-3">
              {q.options?.map((opt) => {
                const isCorrect = q.correct_option_id === opt.id;
                return (
                  <div key={opt.id} className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleSetCorrectOption(q.id, opt.id)}
                      className="flex-shrink-0"
                      title={
                        isCorrect
                          ? "Respuesta correcta"
                          : "Marcar como respuesta correcta"
                      }
                    >
                      {isCorrect ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-xs">
                          <Check size={13} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 hover:border-slate-400 bg-white" />
                      )}
                    </button>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) =>
                        handleOptionTextChange(q.id, opt.id, e.target.value)
                      }
                      onBlur={(e) => handlePersistOptionText(opt.id, e.target.value)}
                      placeholder="Texto de la opción..."
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteOption(q.id, opt.id)}
                      className="p-1.5 text-slate-300 hover:text-slate-500 transition-colors"
                      title="Eliminar opción"
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Botón: + Agregar opción */}
            <button
              type="button"
              onClick={() => handleAddOption(q.id)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 pt-1 transition-colors"
            >
              <Plus size={14} />
              Agregar opción
            </button>
          </div>
        ))
      )}

      {/* ── Modal de Confirmación para Eliminar Pregunta ─────────────────── */}
      <ConfirmDialog
        isOpen={Boolean(deleteQTarget)}
        onClose={() => setDeleteQTarget(null)}
        onConfirm={handleDeleteQuestion}
        title="Eliminar Pregunta"
        message="¿Estás seguro de que deseas eliminar esta pregunta y sus opciones asociadas? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        type="danger"
      />

      {/* ── Modal: Vista Previa del Examen (Simulación Estudiante) ──────── */}
      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`Vista previa: ${cleanTitle}`}
        size="lg"
      >
        <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-wrap gap-4 text-xs font-medium text-slate-600">
            <span>
              <strong>Puntaje mínimo:</strong> {examConfig.passing_score}%
            </span>
            <span>
              <strong>Intentos permitidos:</strong> {examConfig.max_attempts}
            </span>
            <span>
              <strong>Total preguntas:</strong> {questions.length}
            </span>
          </div>

          {questions.length === 0 ? (
            <p className="text-center text-slate-400 py-6 text-sm">
              No hay preguntas configuradas para previsualizar.
            </p>
          ) : (
            questions.map((q, idx) => (
              <div
                key={q.id}
                className="border border-slate-200/80 rounded-xl p-5 bg-white shadow-xs"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-sm font-bold text-slate-800">
                    {idx + 1}. {q.statement || "Sin enunciado"}
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {q.points || 1} pt
                  </span>
                </div>

                <div className="space-y-2 mt-3">
                  {q.options?.map((opt) => {
                    const isSelected = previewAnswers[q.id] === opt.id;
                    return (
                      <label
                        key={opt.id}
                        onClick={() =>
                          setPreviewAnswers((prev) => ({
                            ...prev,
                            [q.id]: opt.id,
                          }))
                        }
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer text-sm transition-all ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-50/50 text-indigo-900 font-medium"
                            : "border-slate-200 hover:border-slate-300 text-slate-700"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-600"
                              : "border-slate-300"
                          }`}
                        >
                          {isSelected && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <span>{opt.text || "Opción sin texto"}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setPreviewOpen(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-5 rounded-xl text-sm transition-all"
            >
              Cerrar vista previa
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
