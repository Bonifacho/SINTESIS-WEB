import { BookOpen, Users, ClipboardList, LayoutDashboard } from "lucide-react";

/**
 * Contenido de la página Dashboard del Docente.
 * El sidebar y el layout los provee DashboardLayout via Outlet.
 */
export default function TeacherDashboard() {
  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Gestiona tus cursos, contenidos y evaluaciones desde aquí.
        </p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="bg-indigo-50 p-3.5 rounded-lg text-indigo-600">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Mis Grupos</p>
            <h3 className="text-xl font-bold text-gray-800 mt-0.5">—</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="bg-emerald-50 p-3.5 rounded-lg text-emerald-600">
            <BookOpen size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">OVAs Creados</p>
            <h3 className="text-xl font-bold text-gray-800 mt-0.5">—</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="bg-amber-50 p-3.5 rounded-lg text-amber-600">
            <ClipboardList size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Exámenes</p>
            <h3 className="text-xl font-bold text-gray-800 mt-0.5">—</h3>
          </div>
        </div>
      </div>

      {/* Placeholder */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-50 mb-4">
          <LayoutDashboard size={24} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Panel Principal</h3>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Selecciona una opción del menú lateral para comenzar a gestionar tus grupos,
          crear contenido académico o revisar los resultados de tus estudiantes.
        </p>
      </div>
    </>
  );
}
