import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";

// ── Páginas públicas ─────────────────────────────────────────────────────────
import Login from "../pages/Login";
import Unauthorized from "../pages/Unauthorized";

// ── Páginas del Docente ──────────────────────────────────────────────────────
import TeacherDashboard from "../pages/teacher/Dashboard";

// ── Páginas del Administrador ────────────────────────────────────────────────
import AdminDashboard from "../pages/admin/Dashboard";

/**
 * AppRouter — Enrutador principal de la aplicación.
 *
 * Estructura de rutas:
 *   /login            → Pública (punto de entrada)
 *   /unauthorized     → Pública (acceso denegado)
 *   /teacher/*        → Protegida (solo rol "docente" o "administrador")
 *   /admin/*          → Protegida (solo rol "administrador")
 *   /*                → Redirige a /login
 */
export default function AppRouter() {
  return (
    <Router>
      <Routes>
        {/* ── Rutas Públicas ──────────────────────────────────────────── */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* ── Rutas del Docente ────────────────────────────────────────── */}
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRoles={["docente", "administrador"]}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />

        {/* ── Rutas del Administrador ─────────────────────────────────── */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["administrador"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* ── Fallback ────────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
