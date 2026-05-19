import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { LayoutDashboard, Users, BookOpen, BarChart3 } from "lucide-react";
import ProtectedRoute from "../components/ProtectedRoute";
import DashboardLayout from "../layouts/DashboardLayout";

// ── Páginas públicas ─────────────────────────────────────────────────────────
import Login from "../pages/Login";
import Unauthorized from "../pages/Unauthorized";

// ── Páginas del Docente ──────────────────────────────────────────────────────
import TeacherDashboard from "../pages/teacher/Dashboard";
import TeacherGroups from "../pages/teacher/Groups";
import Enrollments from "../pages/teacher/Enrollments";
import TeacherTopics from "../pages/teacher/Topics";
import TeacherOvas from "../pages/teacher/Ovas";
import TeacherOvaDetail from "../pages/teacher/OvaDetail";
import ExamBuilder from "../pages/teacher/ExamBuilder";

// ── Páginas del Administrador ────────────────────────────────────────────────
import AdminDashboard from "../pages/admin/Dashboard";
import AdminUsers from "../pages/admin/Users";

// ── Menús de navegación por rol ──────────────────────────────────────────────
const TEACHER_MENU = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/teacher/dashboard" },
  { label: "Mis Grupos", icon: Users, path: "/teacher/groups" },
  { label: "Gestión OVAs", icon: BookOpen, path: "/teacher/ovas" },
  { label: "Resultados", icon: BarChart3, path: "/teacher/results" },
];

const ADMIN_MENU = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "Gestión de Usuarios", icon: Users, path: "/admin/users" },
  { label: "Todos los Grupos", icon: BookOpen, path: "/admin/groups" },
];

function TeacherLayout() {
  return (
    <DashboardLayout
      menuItems={TEACHER_MENU}
      panelTitle="Panel Docente"
      accentColor="indigo"
    />
  );
}

function AdminLayout() {
  return (
    <DashboardLayout
      menuItems={ADMIN_MENU}
      panelTitle="Administrador"
      accentColor="amber"
    />
  );
}

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* ── Rutas del Docente ────────────────────────────────────────── */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={["docente", "administrador"]}>
              <TeacherLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="groups" element={<TeacherGroups />} />
          <Route path="groups/:groupId" element={<Enrollments />} />
          
          <Route path="ovas" element={<TeacherTopics />} />
          <Route path="ovas/topic/:topicId" element={<TeacherOvas />} />
          <Route path="ovas/:ovaId" element={<TeacherOvaDetail />} />
          <Route path="ovas/:ovaId/exam" element={<ExamBuilder />} />
          
          {/* <Route path="results" element={<TeacherResults />} /> */}
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* ── Rutas del Administrador ──────────────────────────────────── */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["administrador"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          {/* <Route path="groups" element={<AdminGroups />} /> */}
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
