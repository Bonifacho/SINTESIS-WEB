import { ChevronUp, ChevronDown, Inbox } from "lucide-react";
import { useState } from "react";

/**
 * DataTable — Tabla de datos reutilizable con estilos premium.
 *
 * Props:
 *   - columns:   Array de objetos { key, label, render? }
 *                - key:    Nombre del campo en los datos.
 *                - label:  Texto visible en el encabezado.
 *                - render: Función opcional (value, row) => JSX para renderizado personalizado.
 *   - data:      Array de objetos con los datos a mostrar.
 *   - onRowClick: Callback opcional (row) => void al hacer clic en una fila.
 *   - emptyMessage: Mensaje cuando no hay datos.
 *   - isLoading: Muestra skeleton placeholder mientras carga.
 *
 * Ejemplo:
 *   <DataTable
 *     columns={[
 *       { key: "name", label: "Nombre" },
 *       { key: "is_active", label: "Estado", render: (val) => val ? "Activo" : "Inactivo" },
 *     ]}
 *     data={groups}
 *   />
 */
export default function DataTable({
  columns = [],
  data = [],
  onRowClick,
  emptyMessage = "No hay datos para mostrar.",
  isLoading = false,
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey] ?? "";
    const bVal = b[sortKey] ?? "";
    if (typeof aVal === "string") {
      return sortDir === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    return sortDir === "asc" ? aVal - bVal : bVal - aVal;
  });

  // Skeleton loading rows
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {columns.map((col) => (
                <th key={col.key} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(4)].map((_, i) => (
              <tr key={i} className="border-b border-gray-50">
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-4">
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-50 mb-4">
          <Inbox size={24} className="text-gray-400" />
        </div>
        <p className="text-gray-400 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {sortKey === col.key && (
                      sortDir === "asc"
                        ? <ChevronUp size={14} />
                        : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sortedData.map((row, idx) => (
              <tr
                key={row.id ?? idx}
                onClick={() => onRowClick?.(row)}
                className={`transition-colors ${
                  onRowClick
                    ? "cursor-pointer hover:bg-indigo-50/50"
                    : "hover:bg-gray-50/50"
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-3.5 text-sm text-gray-700">
                    {col.render
                      ? col.render(row[col.key], row)
                      : (row[col.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
