/**
 * SÍNTESIS — Utilidades Estadísticas para Análisis Exploratorio de Datos (AED / EDA)
 * Proyecto de Gestión del Conocimiento (PGC) — 6.° Semestre
 * 
 * Funciones puras de cálculo matemático descriptivo y agregación de métricas
 * académicas a partir de las respuestas JSON del backend.
 */

/**
 * Calcula la media aritmética (promedio) de un arreglo de números.
 * @param {number[]} values
 * @returns {number}
 */
export function calculateMean(values) {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  return Number((sum / values.length).toFixed(1));
}

/**
 * Calcula la mediana (valor central de un arreglo ordenado).
 * @param {number[]} values
 * @returns {number}
 */
export function calculateMedian(values) {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].map(Number).filter((v) => !isNaN(v)).sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(1));
}

/**
 * Calcula la desviación estándar muestral o poblacional (σ).
 * @param {number[]} values
 * @param {number} [precalculatedMean]
 * @returns {number}
 */
export function calculateStdDev(values, precalculatedMean) {
  if (!values || values.length <= 1) return 0;
  const mean = precalculatedMean !== undefined ? precalculatedMean : calculateMean(values);
  const variance =
    values.reduce((acc, curr) => acc + Math.pow((Number(curr) || 0) - mean, 2), 0) /
    values.length;
  return Number(Math.sqrt(variance).toFixed(1));
}

/**
 * Obtiene el rango de calificaciones (mínimo, máximo y amplitud).
 * @param {number[]} values
 * @returns {{ min: number, max: number, range: number }}
 */
export function calculateScoreRange(values) {
  if (!values || values.length === 0) return { min: 0, max: 0, range: 0 };
  const valid = values.map(Number).filter((v) => !isNaN(v));
  if (valid.length === 0) return { min: 0, max: 0, range: 0 };
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  return { min, max, range: max - min };
}

/**
 * Agrupa los intentos en los 4 niveles pedagógicos institucionales (Histograma).
 * - Bajo: 0% - 59% (#EF4444)
 * - Básico: 60% - 74% (#FBBF24)
 * - Alto: 75% - 89% (#0EA5E9)
 * - Superior: 90% - 100% (#10B981)
 * 
 * @param {Array<{ score: number }>} attempts
 * @returns {Array<{ level: string, range: string, count: number, percentage: number, color: string, bgClass: string, textClass: string }>}
 */
export function calculateDistribution(attempts) {
  const completed = (attempts || []).filter(
    (a) => a.score !== null && a.score !== undefined && !isNaN(a.score)
  );
  const total = completed.length;

  const buckets = [
    {
      level: "Bajo",
      range: "0% - 59%",
      description: "Requiere refuerzo pedagógico",
      min: 0,
      max: 59,
      color: "#EF4444",
      bgClass: "bg-red-500",
      lightBgClass: "bg-red-50 border-red-200 text-red-700",
      textClass: "text-red-600",
      count: 0,
      percentage: 0,
    },
    {
      level: "Básico",
      range: "60% - 74%",
      description: "Alcanza los objetivos mínimos",
      min: 60,
      max: 74,
      color: "#FBBF24",
      bgClass: "bg-amber-400",
      lightBgClass: "bg-amber-50 border-amber-200 text-amber-800",
      textClass: "text-amber-600",
      count: 0,
      percentage: 0,
    },
    {
      level: "Alto",
      range: "75% - 89%",
      description: "Comprensión sólida del tema",
      min: 75,
      max: 89,
      color: "#0EA5E9",
      bgClass: "bg-sky-500",
      lightBgClass: "bg-sky-50 border-sky-200 text-sky-800",
      textClass: "text-sky-600",
      count: 0,
      percentage: 0,
    },
    {
      level: "Superior",
      range: "90% - 100%",
      description: "Dominio excelente y autónomo",
      min: 90,
      max: 100,
      color: "#10B981",
      bgClass: "bg-emerald-500",
      lightBgClass: "bg-emerald-50 border-emerald-200 text-emerald-800",
      textClass: "text-emerald-600",
      count: 0,
      percentage: 0,
    },
  ];

  completed.forEach((att) => {
    const s = Math.round(Number(att.score));
    if (s < 60) buckets[0].count++;
    else if (s < 75) buckets[1].count++;
    else if (s < 90) buckets[2].count++;
    else buckets[3].count++;
  });

  buckets.forEach((b) => {
    b.percentage = total > 0 ? Number(((b.count / total) * 100).toFixed(1)) : 0;
  });

  return buckets;
}

/**
 * Analiza la eficiencia temporal (tiempo de resolución de exámenes).
 * Calcula duración a partir de submitted_at y started_at o eventos de progreso.
 * 
 * @param {Array} attempts
 * @param {Array} [activityEvents=[]]
 * @returns {{ avgMinutes: number, fastestMinutes: number, slowestMinutes: number, totalTimed: number, durations: number[] }}
 */
export function calculateTimeMetrics(attempts, activityEvents = []) {
  const durations = [];

  (attempts || []).forEach((att) => {
    if (!att.submitted_at) return;
    const subDate = new Date(att.submitted_at);

    let startDate = att.started_at ? new Date(att.started_at) : null;

    // Si started_at no viene en el intento, buscar el evento exam_started en student_progress
    if (!startDate && activityEvents && activityEvents.length > 0) {
      const matchEvent = activityEvents.find(
        (ev) =>
          (ev.user_id === att.student_id || ev.student_id === att.student_id) &&
          (ev.ova_id === att.ova_id || String(ev.ova_id) === String(att.ova_id)) &&
          ev.action === "exam_started" &&
          new Date(ev.timestamp) <= subDate
      );
      if (matchEvent && matchEvent.timestamp) {
        startDate = new Date(matchEvent.timestamp);
      }
    }

    if (startDate && !isNaN(startDate.getTime()) && !isNaN(subDate.getTime())) {
      const diffMs = subDate.getTime() - startDate.getTime();
      const diffMin = diffMs / (1000 * 60);
      // Filtrar tiempos realistas de sesión (entre 1 y 120 minutos)
      if (diffMin >= 0.5 && diffMin <= 120) {
        durations.push(Number(diffMin.toFixed(1)));
      }
    } else {
      // Estimación basada en cantidad de preguntas si no hay timestamp de inicio
      const qCount = att.total_questions || (att.question_results ? att.question_results.length : 5);
      const estimatedMin = Number((qCount * 2.2).toFixed(1));
      durations.push(estimatedMin);
    }
  });

  if (durations.length === 0) {
    return {
      avgMinutes: 0,
      fastestMinutes: 0,
      slowestMinutes: 0,
      totalTimed: 0,
      durations: [],
    };
  }

  const avgMinutes = Number(
    (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1)
  );
  const fastestMinutes = Math.min(...durations);
  const slowestMinutes = Math.max(...durations);

  return {
    avgMinutes,
    fastestMinutes,
    slowestMinutes,
    totalTimed: durations.length,
    durations,
  };
}

/**
 * Agrega y clasifica las interacciones de los estudiantes (student_progress).
 * 
 * @param {Array} activityEvents
 * @returns {{ totalEvents: number, byAction: Array, topTopics: Array, topResources: Array }}
 */
export function calculateResourceTraceability(activityEvents) {
  const events = activityEvents || [];
  const totalEvents = events.length;

  const actionMap = {
    resource_opened: { name: "Consulta de Material (OVA)", count: 0, color: "#4F46E5" },
    exam_opened: { name: "Apertura de Examen", count: 0, color: "#0EA5E9" },
    exam_started: { name: "Inicio de Evaluación", count: 0, color: "#10B981" },
  };

  const topicCount = {};
  const resourceCount = {};

  events.forEach((ev) => {
    // Conteo por acción
    if (actionMap[ev.action]) {
      actionMap[ev.action].count++;
    }

    // Conteo por tema
    const topic = ev.topic_name || ev.ova_title || "General";
    topicCount[topic] = (topicCount[topic] || 0) + 1;

    // Conteo por recurso
    const resName = ev.resource_name || ev.ova_title || "Recurso de estudio";
    resourceCount[resName] = (resourceCount[resName] || 0) + 1;
  });

  const byAction = Object.keys(actionMap).map((key) => ({
    key,
    name: actionMap[key].name,
    count: actionMap[key].count,
    color: actionMap[key].color,
    percentage:
      totalEvents > 0
        ? Number(((actionMap[key].count / totalEvents) * 100).toFixed(1))
        : 0,
  }));

  const topTopics = Object.entries(topicCount)
    .map(([name, count]) => ({
      name,
      count,
      percentage: totalEvents > 0 ? Number(((count / totalEvents) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topResources = Object.entries(resourceCount)
    .map(([name, count]) => ({
      name,
      count,
      percentage: totalEvents > 0 ? Number(((count / totalEvents) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalEvents,
    byAction,
    topTopics,
    topResources,
  };
}
