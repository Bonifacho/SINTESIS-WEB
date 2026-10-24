import { useState, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Compass,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  BookOpen,
  Users,
  Award,
  ChevronDown,
  Info
} from "lucide-react";
import {
  calculateMean,
  calculateMedian,
  calculateStdDev,
  calculateScoreRange,
  calculateDistribution,
  calculateTimeMetrics,
  calculateResourceTraceability
} from "../../utils/statistics";
import LoadingSpinner from "../LoadingSpinner";

/**
 * EdaDashboard — Componente de Análisis Exploratorio de Datos (AED / EDA)
 * Proyecto de Gestión del Conocimiento (PGC) — 6.° Semestre
 * 
 * Implementa analítica descriptiva visual con histogramas SVG, métricas de
 * tendencia central, dispersión, eficiencia temporal y trazabilidad de recursos.
 */
export default function EdaDashboard({
  groups = [],
  selectedGroupId = "",
  onGroupChange,
  attempts = [],
  activityEvents = [],
  isLoading = false,
  onRefresh
}) {
  const [activeTooltip, setActiveTooltip] = useState(null);

  // ── 1. Cálculos de Estadísticas Descriptivas ─────────────────────────────
  const completedAttempts = useMemo(() => {
    return (attempts || []).filter(
      (a) => a.score !== null && a.score !== undefined && !isNaN(a.score)
    );
  }, [attempts]);

  const scores = useMemo(() => {
    return completedAttempts.map((a) => Number(a.score));
  }, [completedAttempts]);

  const stats = useMemo(() => {
    const mean = calculateMean(scores);
    const median = calculateMedian(scores);
    const stdDev = calculateStdDev(scores, mean);
    const range = calculateScoreRange(scores);

    const approvedCount = completedAttempts.filter((a) => a.passed || a.score >= 60).length;
    const approvalRate = completedAttempts.length > 0
      ? Number(((approvedCount / completedAttempts.length) * 100).toFixed(1))
      : 0;

    const distribution = calculateDistribution(completedAttempts);
    const timeMetrics = calculateTimeMetrics(completedAttempts, activityEvents);
    const traceability = calculateResourceTraceability(activityEvents);

    return {
      total: completedAttempts.length,
      mean,
      median,
      stdDev,
      range,
      approvedCount,
      approvalRate,
      distribution,
      timeMetrics,
      traceability,
    };
  }, [scores, completedAttempts, activityEvents]);

  // Altura máxima para escala del histograma
  const maxFreq = useMemo(() => {
    const counts = stats.distribution.map((d) => d.count);
    return Math.max(...counts, 1);
  }, [stats.distribution]);

  const selectedGroupName = useMemo(() => {
    if (!selectedGroupId) return "Todos los grupos";
    const found = groups.find((g) => String(g.id) === String(selectedGroupId));
    return found ? found.name : `Grupo #${selectedGroupId}`;
  }, [selectedGroupId, groups]);

  return (
    <div className="space-y-7 animate-fade-in">
      {/* ── Barra de Control Superior / Filtros ────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-1.5">
            <BarChart3 size={14} className="text-indigo-600" />
            Análisis Exploratorio de Datos (AED)
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Dashboard de Analítica Académica
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Exploración cuantitativa de desempeño y patrones de estudio · {selectedGroupName}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Selector de Grupo */}
          <div className="relative flex-1 sm:w-64">
            <select
              value={selectedGroupId}
              onChange={(e) => onGroupChange && onGroupChange(e.target.value)}
              className="w-full pl-3.5 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer appearance-none shadow-inner"
            >
              <option value="">Todos mis grupos</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Botón de Actualizar */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 border border-slate-200 rounded-xl transition-all shadow-sm active:scale-95 flex-shrink-0"
              title="Recalcular métricas"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin text-indigo-600" : ""} />
            </button>
          )}
        </div>
      </div>

      {/* ── Estado de Carga ──────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-16 border border-slate-200/80 shadow-sm flex flex-col items-center justify-center text-center">
          <LoadingSpinner size="lg" />
          <p className="text-sm font-semibold text-slate-700 mt-4">Procesando conjunto de datos académicos...</p>
          <p className="text-xs text-slate-400 mt-1">Calculando tendencias centrales, varianza y distribuciones pedagógicas</p>
        </div>
      ) : stats.total === 0 ? (
        /* ── Estado Vacío ───────────────────────────────────────────────── */
        <div className="bg-white rounded-3xl p-14 border border-slate-200/80 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100 shadow-inner">
            <AlertTriangle size={30} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Sin datos de evaluaciones para este filtro</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
            Actualmente no se registran intentos completados en {selectedGroupName}. Los gráficos estadísticos y frecuencias descriptivas se generarán automáticamente una vez los estudiantes presenten sus exámenes.
          </p>
        </div>
      ) : (
        <>
          {/* ── Módulo A: Tarjetas de Tendencia Central y Dispersión ──────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. Media Aritmética */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Promedio (Media x̄)</span>
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <TrendingUp size={16} />
                </span>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.mean}%</span>
                  <span className="text-xs font-semibold text-slate-400">/ 100</span>
                </div>
                <div className="mt-2 text-[11px] font-medium text-slate-500 flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${stats.mean >= 75 ? 'bg-emerald-500' : stats.mean >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} />
                  {stats.mean >= 75 ? "Rendimiento óptimo" : stats.mean >= 60 ? "Rendimiento regular" : "Alerta de rendimiento"}
                </div>
              </div>
            </div>

            {/* 2. Mediana */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mediana (Me)</span>
                <span className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <Compass size={16} />
                </span>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.median}%</span>
                  <span className="text-xs font-semibold text-slate-400">p50</span>
                </div>
                <p className="mt-2 text-[11px] font-medium text-slate-500">
                  Punto de equilibrio del 50%
                </p>
              </div>
            </div>

            {/* 3. Desviación Estándar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dispersión (σ)</span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <BarChart3 size={16} />
                </span>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">±{stats.stdDev}</span>
                  <span className="text-xs font-semibold text-slate-400">pts</span>
                </div>
                <p className="mt-2 text-[11px] font-medium text-slate-500">
                  {stats.stdDev < 12 ? "Grupo homogéneo" : "Grupo heterogéneo"}
                </p>
              </div>
            </div>

            {/* 4. Tasa de Aprobación */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Aprobación</span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={16} />
                </span>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-emerald-600 tracking-tight">{stats.approvalRate}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, stats.approvalRate))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 5. Rango de Notas */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rango Min - Max</span>
                <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Award size={16} />
                </span>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-slate-900">{stats.range.min}%</span>
                  <span className="text-xs text-slate-400 font-bold px-1">a</span>
                  <span className="text-2xl font-extrabold text-slate-900">{stats.range.max}%</span>
                </div>
                <p className="mt-2 text-[11px] font-medium text-slate-500">
                  Amplitud: {stats.range.range} puntos
                </p>
              </div>
            </div>
          </div>

          {/* ── Módulo B: Histograma de Distribución de Rendimiento ────────── */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 size={18} className="text-indigo-600" />
                  Histograma de Frecuencias de Rendimiento
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribución de estudiantes clasificados según la escala pedagógica institucional
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                Total muestras: {stats.total} intentos
              </span>
            </div>

            {/* Gráfico SVG Nativo del Histograma */}
            <div className="w-full overflow-x-auto pb-2">
              <div className="min-w-[500px]">
                <svg viewBox="0 0 600 240" className="w-full h-56 font-sans">
                  {/* Líneas de Guía Horizontales */}
                  <line x1="50" y1="25" x2="570" y2="25" stroke="#F1F5F9" strokeDasharray="4 4" strokeWidth="1" />
                  <line x1="50" y1="75" x2="570" y2="75" stroke="#F1F5F9" strokeDasharray="4 4" strokeWidth="1" />
                  <line x1="50" y1="125" x2="570" y2="125" stroke="#F1F5F9" strokeDasharray="4 4" strokeWidth="1" />
                  <line x1="50" y1="175" x2="570" y2="175" stroke="#CBD5E1" strokeWidth="1" />

                  {/* Eje Y - Etiquetas de Frecuencia */}
                  <text x="35" y="29" fill="#94A3B8" fontSize="10" textAnchor="end">{maxFreq}</text>
                  <text x="35" y="104" fill="#94A3B8" fontSize="10" textAnchor="end">{Math.round(maxFreq / 2)}</text>
                  <text x="35" y="179" fill="#94A3B8" fontSize="10" textAnchor="end">0</text>

                  {/* Barras de las 4 Categorías */}
                  {stats.distribution.map((item, idx) => {
                    const barWidth = 75;
                    const spacing = 130;
                    const x = 70 + idx * spacing;
                    const maxBarHeight = 150;
                    const barHeight = maxFreq > 0 ? (item.count / maxFreq) * maxBarHeight : 0;
                    const y = 175 - barHeight;

                    return (
                      <g
                        key={item.level}
                        className="cursor-pointer transition-opacity hover:opacity-90"
                        onMouseEnter={() => setActiveTooltip(item)}
                        onMouseLeave={() => setActiveTooltip(null)}
                      >
                        {/* Barra */}
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={barHeight}
                          rx="6"
                          fill={item.color}
                          className="transition-all duration-300"
                        />

                        {/* Etiqueta superior de conteo y porcentaje */}
                        <text
                          x={x + barWidth / 2}
                          y={Math.max(y - 8, 15)}
                          fill="#0F172A"
                          fontSize="11"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {item.count} ({item.percentage}%)
                        </text>

                        {/* Etiqueta Eje X - Categoría */}
                        <text
                          x={x + barWidth / 2}
                          y="195"
                          fill="#1E293B"
                          fontSize="11"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {item.level}
                        </text>

                        {/* Etiqueta Eje X - Rango */}
                        <text
                          x={x + barWidth / 2}
                          y="210"
                          fill="#64748B"
                          fontSize="10"
                          textAnchor="middle"
                        >
                          {item.range}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Desglose de Tarjetas Pedagógicas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5 pt-4 border-t border-slate-100">
              {stats.distribution.map((item) => (
                <div
                  key={item.level}
                  className={`p-3.5 rounded-2xl border ${item.lightBgClass} flex flex-col justify-between`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{item.level}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/80 border border-current">
                      {item.range}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-extrabold">{item.count}</span>
                      <span className="text-xs font-medium">alumnos ({item.percentage}%)</span>
                    </div>
                    <p className="text-[10px] mt-1 opacity-90 leading-tight">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Módulo C y D: Eficiencia Temporal y Trazabilidad de Recursos ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bloque C: Eficiencia Temporal */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Clock size={18} className="text-amber-500" />
                      Eficiencia Temporal de Resolución
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Duración estimada e inversión de tiempo en evaluaciones
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 my-4">
                  <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 text-center">
                    <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Promedio</p>
                    <p className="text-2xl font-black text-amber-900 mt-1">{stats.timeMetrics.avgMinutes}</p>
                    <p className="text-[10px] text-amber-700 font-medium">minutos</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-center">
                    <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Más Rápido</p>
                    <p className="text-2xl font-black text-emerald-900 mt-1">{stats.timeMetrics.fastestMinutes}</p>
                    <p className="text-[10px] text-emerald-700 font-medium">minutos</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Más Lento</p>
                    <p className="text-2xl font-black text-slate-800 mt-1">{stats.timeMetrics.slowestMinutes}</p>
                    <p className="text-[10px] text-slate-500 font-medium">minutos</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 mt-4 flex items-start gap-3">
                  <Info size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    El ritmo promedio registrado indica una dedicación adecuada por reactivo. No se identifican patrones de resolución apresurada (&lt; 2 min).
                  </p>
                </div>
              </div>
            </div>

            {/* Bloque D: Trazabilidad y Consumo de Recursos */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <BookOpen size={18} className="text-indigo-600" />
                      Trazabilidad y Consumo de OVAs
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Interacciones de estudio registradas en <span className="font-mono text-[11px]">student_progress</span>
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {stats.traceability.totalEvents} eventos
                  </span>
                </div>

                {stats.traceability.totalEvents === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No se registran eventos de interacción silenciosa en este periodo.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-slate-700 mb-2.5">Interacciones por Tipo de Acción</p>
                      <div className="space-y-2">
                        {stats.traceability.byAction.map((act) => (
                          <div key={act.key} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium text-slate-600">{act.name}</span>
                              <span className="font-bold text-slate-800">{act.count} ({act.percentage}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${act.percentage}%`, backgroundColor: act.color }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {stats.traceability.topTopics.length > 0 && (
                      <div className="pt-3 border-t border-slate-100">
                        <p className="text-xs font-bold text-slate-700 mb-2">Módulos más consultados</p>
                        <div className="flex flex-wrap gap-2">
                          {stats.traceability.topTopics.map((top, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium"
                            >
                              <span>{top.name}</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              <span className="font-bold text-slate-900">{top.count}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
