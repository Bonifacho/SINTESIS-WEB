import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Plus, Settings, Trash2, CheckCircle2, Circle, Pencil } from "lucide-react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../../api/client";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useToast } from "../../components/Toast";

/**
 * ExamBuilder — Constructor dinámico de Exámenes
 */
export default function ExamBuilder() {
  const { ovaId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast, ToastContainer } = useToast();
  
  const ovaName = location.state?.ovaName || `OVA #${ovaId}`;

  const [exam, setExam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Examen
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [examForm, setExamForm] = useState({ title: "Examen Final", passing_score: 60, max_attempts: 3 });
  const [isSavingExam, setIsSavingExam] = useState(false);

  // Modal Pregunta
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionForm, setQuestionForm] = useState({ statement: "", points: 1 });
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);

  // Modal Opción
  const [optionModalOpen, setOptionModalOpen] = useState(false);
  const [targetQuestionId, setTargetQuestionId] = useState(null);
  const [optionForm, setOptionForm] = useState({ text: "" });
  const [isSavingOption, setIsSavingOption] = useState(false);

  // ConfirmDialogs
  const [deleteQuestionTarget, setDeleteQuestionTarget] = useState(null);
  const [deleteOptionTarget, setDeleteOptionTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchExam = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get(`/api/v1/academic/exams/by-ova/${ovaId}/teacher`);
      // Sort questions and options by order_index
      const sortedExam = { ...data.data };
      if (sortedExam.questions) {
        sortedExam.questions.sort((a, b) => a.order_index - b.order_index);
        sortedExam.questions.forEach(q => {
          q.options.sort((a, b) => a.order_index - b.order_index);
        });
      }
      setExam(sortedExam);
    } catch (err) {
      if (err.response?.status === 404) {
        setExam(null); // No hay examen aún
      } else {
        showToast("Error al cargar el examen", "error");
      }
    } finally {
      setIsLoading(false);
    }
  }, [ovaId, showToast]);

  useEffect(() => {
    fetchExam();
  }, [fetchExam]);

  // ── EXAMEN ─────────────────────────────────────────────────────────────────
  const handleSaveExam = async (e) => {
    e.preventDefault();
    setIsSavingExam(true);
    try {
      if (exam) {
        await api.put(`/api/v1/academic/exams/${exam.id}`, examForm);
        showToast("Configuración del examen actualizada", "success");
      } else {
        await api.post("/api/v1/academic/exams", {
          ...examForm,
          ova_id: parseInt(ovaId),
        });
        showToast("Examen creado", "success");
      }
      setExamModalOpen(false);
      fetchExam();
    } catch (err) {
      showToast(err.response?.data?.error || "Error al guardar el examen", "error");
    } finally {
      setIsSavingExam(false);
    }
  };

  const openExamModal = () => {
    if (exam) {
      setExamForm({ title: exam.title, passing_score: exam.passing_score, max_attempts: exam.max_attempts });
    } else {
      setExamForm({ title: "Examen de " + ovaName, passing_score: 60, max_attempts: 3 });
    }
    setExamModalOpen(true);
  };

  // ── PREGUNTAS ──────────────────────────────────────────────────────────────
  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!questionForm.statement.trim()) return;
    setIsSavingQuestion(true);
    try {
      if (editingQuestion) {
        await api.put(`/api/v1/academic/questions/${editingQuestion.id}`, questionForm);
        showToast("Pregunta actualizada", "success");
      } else {
        await api.post("/api/v1/academic/questions", {
          ...questionForm,
          exam_id: exam.id,
          order_index: exam.questions.length,
        });
        showToast("Pregunta añadida", "success");
      }
      setQuestionModalOpen(false);
      fetchExam();
    } catch (err) {
      showToast(err.response?.data?.error || "Error al guardar la pregunta", "error");
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!deleteQuestionTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/v1/academic/questions/${deleteQuestionTarget.id}`);
      showToast("Pregunta eliminada", "success");
      setDeleteQuestionTarget(null);
      fetchExam();
    } catch (err) {
      showToast("Error al eliminar la pregunta", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // ── OPCIONES ───────────────────────────────────────────────────────────────
  const handleSaveOption = async (e) => {
    e.preventDefault();
    if (!optionForm.text.trim()) return;
    setIsSavingOption(true);
    try {
      await api.post("/api/v1/academic/options", {
        text: optionForm.text,
        question_id: targetQuestionId,
        order_index: exam.questions.find(q => q.id === targetQuestionId).options.length,
      });
      showToast("Opción añadida", "success");
      setOptionModalOpen(false);
      fetchExam();
    } catch (err) {
      showToast(err.response?.data?.error || "Error al añadir la opción", "error");
    } finally {
      setIsSavingOption(false);
    }
  };

  const handleDeleteOption = async () => {
    if (!deleteOptionTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/v1/academic/options/${deleteOptionTarget.id}`);
      showToast("Opción eliminada", "success");
      setDeleteOptionTarget(null);
      fetchExam();
    } catch (err) {
      showToast("Error al eliminar la opción", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetCorrectOption = async (questionId, optionId) => {
    try {
      await api.post("/api/v1/academic/answer-key", {
        question_id: questionId,
        correct_option_id: optionId
      });
      
      // Update local state optmisticly
      const updatedExam = { ...exam };
      const q = updatedExam.questions.find(q => q.id === questionId);
      if (q) q.correct_option_id = optionId;
      setExam(updatedExam);
      
      showToast("Respuesta correcta guardada", "success");
    } catch (err) {
      showToast(err.response?.data?.error || "Error al fijar respuesta", "error");
      fetchExam(); // revert local state on error
    }
  };

  return (
    <>
      <ToastContainer />
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">Constructor de Examen</h1>
          <p className="text-gray-500 text-sm mt-0.5">Asociado a: {ovaName}</p>
        </div>
        {exam && (
          <button onClick={openExamModal} className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition-colors shadow-sm text-sm">
            <Settings size={18} />
            Configuración
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : !exam ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center mt-6">
          <CheckCircle2 size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">Este OVA no tiene examen</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
            Crea un examen para evaluar los conocimientos adquiridos en este Objeto Virtual de Aprendizaje.
          </p>
          <button onClick={openExamModal} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-sm">
            <Plus size={18} />
            Comenzar a Crear Examen
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Cabecera del Examen */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl shadow-md p-6 text-white flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-1">{exam.title}</h2>
              <div className="flex gap-4 text-indigo-100 text-sm">
                <span>Puntaje mínimo: {exam.passing_score}%</span>
                <span>Intentos permitidos: {exam.max_attempts}</span>
                <span>Preguntas: {exam.questions?.length || 0}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingQuestion(null);
                setQuestionForm({ statement: "", points: 1 });
                setQuestionModalOpen(true);
              }}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              <Plus size={18} />
              Añadir Pregunta
            </button>
          </div>

          {/* Lista de Preguntas */}
          {exam.questions?.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-10 text-center">
              <p className="text-gray-500">Aún no hay preguntas en este examen.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {exam.questions.map((q, index) => (
                <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Cabecera de la Pregunta */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-start gap-4">
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="font-medium text-gray-800 text-lg">{q.statement}</h3>
                        <span className="text-xs text-gray-500">Valor: {q.points} {q.points === 1 ? 'punto' : 'puntos'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingQuestion(q);
                          setQuestionForm({ statement: q.statement, points: q.points });
                          setQuestionModalOpen(true);
                        }}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Editar Pregunta"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => setDeleteQuestionTarget(q)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar Pregunta"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Opciones */}
                  <div className="p-6">
                    <div className="space-y-2 mb-4">
                      {q.options.map((opt) => {
                        const isCorrect = q.correct_option_id === opt.id;
                        return (
                          <div 
                            key={opt.id}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                              isCorrect ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <label className="flex items-center gap-3 cursor-pointer flex-1">
                              <input
                                type="radio"
                                name={`correct_option_${q.id}`}
                                checked={isCorrect}
                                onChange={() => handleSetCorrectOption(q.id, opt.id)}
                                className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                              />
                              <span className={`text-sm ${isCorrect ? "text-emerald-800 font-medium" : "text-gray-700"}`}>
                                {opt.text}
                              </span>
                            </label>
                            <button
                              onClick={() => setDeleteOptionTarget(opt)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors ml-4"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      {!q.correct_option_id && q.options.length > 0 && (
                        <p className="text-amber-600 text-xs flex items-center gap-1 font-medium">
                          ⚠ Selecciona la respuesta correcta marcando el círculo.
                        </p>
                      )}
                      
                      {q.options.length < 4 ? (
                        <button
                          onClick={() => {
                            setTargetQuestionId(q.id);
                            setOptionForm({ text: "" });
                            setOptionModalOpen(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1 ml-auto"
                        >
                          <Plus size={16} /> Añadir Opción ({q.options.length}/4)
                        </button>
                      ) : (
                        <p className="text-gray-400 text-xs ml-auto">Límite de 4 opciones alcanzado.</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL CONFIGURACIÓN EXAMEN */}
      <Modal isOpen={examModalOpen} onClose={() => setExamModalOpen(false)} title="Configuración del Examen" size="sm">
        <form onSubmit={handleSaveExam} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Título del Examen</label>
            <input
              type="text"
              value={examForm.title}
              onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-indigo-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Aprobación (%)</label>
              <input
                type="number"
                min="1" max="100"
                value={examForm.passing_score}
                onChange={(e) => setExamForm({ ...examForm, passing_score: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Intentos Máx.</label>
              <input
                type="number"
                min="1" max="999"
                value={examForm.max_attempts}
                onChange={(e) => setExamForm({ ...examForm, max_attempts: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setExamModalOpen(false)} className="flex-1 py-2.5 border rounded-lg hover:bg-gray-50 font-medium text-sm">Cancelar</button>
            <button type="submit" disabled={isSavingExam} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm disabled:opacity-50">
              {isSavingExam ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL PREGUNTA */}
      <Modal isOpen={questionModalOpen} onClose={() => setQuestionModalOpen(false)} title={editingQuestion ? "Editar Pregunta" : "Nueva Pregunta"} size="md">
        <form onSubmit={handleSaveQuestion} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Enunciado</label>
            <textarea
              value={questionForm.statement}
              onChange={(e) => setQuestionForm({ ...questionForm, statement: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-indigo-500 min-h-[100px] resize-y"
              placeholder="Escribe la pregunta..."
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Puntos (Valor de la pregunta)</label>
            <input
              type="number"
              min="1"
              value={questionForm.points}
              onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-indigo-500"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setQuestionModalOpen(false)} className="flex-1 py-2.5 border rounded-lg hover:bg-gray-50 font-medium text-sm">Cancelar</button>
            <button type="submit" disabled={isSavingQuestion} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm disabled:opacity-50">
              {isSavingQuestion ? "Guardando..." : "Guardar Pregunta"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL OPCIÓN */}
      <Modal isOpen={optionModalOpen} onClose={() => setOptionModalOpen(false)} title="Añadir Opción" size="sm">
        <form onSubmit={handleSaveOption} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Texto de la Opción</label>
            <input
              type="text"
              value={optionForm.text}
              onChange={(e) => setOptionForm({ text: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-indigo-500"
              placeholder="Ej: Todas las anteriores"
              required
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setOptionModalOpen(false)} className="flex-1 py-2.5 border rounded-lg hover:bg-gray-50 font-medium text-sm">Cancelar</button>
            <button type="submit" disabled={isSavingOption} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm disabled:opacity-50">
              {isSavingOption ? "Guardando..." : "Añadir Opción"}
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRMS */}
      <ConfirmDialog
        isOpen={!!deleteQuestionTarget}
        onClose={() => setDeleteQuestionTarget(null)}
        onConfirm={handleDeleteQuestion}
        title="¿Eliminar Pregunta?"
        message="Se eliminará la pregunta y todas sus opciones. Esta acción no se puede deshacer."
        isLoading={isDeleting}
      />

      <ConfirmDialog
        isOpen={!!deleteOptionTarget}
        onClose={() => setDeleteOptionTarget(null)}
        onConfirm={handleDeleteOption}
        title="¿Eliminar Opción?"
        message="¿Estás seguro de eliminar esta opción de respuesta?"
        isLoading={isDeleting}
      />
    </>
  );
}
