import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users as UsersIcon, Plus, UserX, UserCheck, Shield,
  Search, RefreshCw, Eye, EyeOff, UserCog
} from "lucide-react";
import api from "../../api/client";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useToast } from "../../components/Toast";

const INITIAL_FORM = {
  first_name: "",
  last_name: "",
  document_id: "",
  username: "",
  password: "",
  role_name: "docente"   // default: docente (el admin normalmente crea docentes)
};

/**
 * AdminUsers — Panel de gestión de usuarios para el administrador.
 * Mejoras: búsqueda en tiempo real, toggle contraseña, feedback de errores mejorado,
 * animaciones de entrada, y conteo de usuarios por rol en la cabecera.
 */
export default function AdminUsers() {
  const { showToast, ToastContainer } = useToast();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("todos");
  const [search, setSearch] = useState("");

  // Modal Crear Usuario
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");

  // Modal Ver Usuario
  const [viewTarget, setViewTarget] = useState(null);

  // Confirm Desactivar
  const [actionTarget, setActionTarget] = useState(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/api/v1/security/users");
      // El backend retorna { data: [...] } o directamente [...]
      setUsers(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || "Error al cargar usuarios";
      showToast(msg, "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Crear usuario ────────────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setFormError("");

    // Validación local básica
    if (formData.password.length < 6) {
      setFormError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (formData.document_id.length < 5) {
      setFormError("El documento de identidad debe tener al menos 5 dígitos.");
      return;
    }

    setIsSaving(true);
    try {
      await api.post("/api/v1/security/admin/register", formData);
      showToast(`Usuario "${formData.username}" creado exitosamente`, "success");
      setModalOpen(false);
      setFormData(INITIAL_FORM);
      setShowPassword(false);
      fetchUsers();
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.response?.data?.msg ||
        "Error al crear usuario. Verifica que el nombre de usuario no exista.";
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenModal = () => {
    setFormData(INITIAL_FORM);
    setFormError("");
    setShowPassword(false);
    setModalOpen(true);
  };

  // ── Desactivar usuario ───────────────────────────────────────────────────
  const handleDeactivate = async () => {
    if (!actionTarget) return;
    setIsProcessingAction(true);
    try {
      await api.delete(`/api/v1/security/users/${actionTarget.id}`);
      showToast(`Usuario "${actionTarget.username}" desactivado`, "success");
      setActionTarget(null);
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.error || "Error al desactivar usuario";
      showToast(msg, "error");
    } finally {
      setIsProcessingAction(false);
    }
  };

  // ── Filtros ──────────────────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    let result = users;
    if (roleFilter !== "todos") {
      result = result.filter(u => u.roles?.includes(roleFilter));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        u.full_name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.document_id?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [users, roleFilter, search]);

  // Conteos por rol
  const counts = useMemo(() => ({
    docentes: users.filter(u => u.roles?.includes("docente")).length,
    estudiantes: users.filter(u => u.roles?.includes("estudiante")).length,
    admins: users.filter(u => u.roles?.includes("administrador")).length,
  }), [users]);

  // ── Columnas ─────────────────────────────────────────────────────────────
  const columns = [
    {
      key: "full_name",
      label: "Usuario",
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm uppercase shrink-0">
            {(val || row.username || "?").charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-800 leading-tight">{val || "—"}</p>
            <p className="text-xs text-gray-400 mt-0.5">@{row.username}</p>
          </div>
        </div>
      )
    },
    { key: "document_id", label: "Documento" },
    {
      key: "roles",
      label: "Rol",
      render: (roles) => (
        <div className="flex gap-1 flex-wrap">
          {(roles || []).map(r => (
            <span key={r} className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              r === 'administrador' ? 'bg-purple-50 text-purple-700 border-purple-200' :
              r === 'docente'       ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                      'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {r}
            </span>
          ))}
        </div>
      )
    },
    {
      key: "is_active",
      label: "Estado",
      render: (active) => (
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
          active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-red-400'}`} />
          {active ? "Activo" : "Inactivo"}
        </span>
      )
    },
    {
      key: "actions",
      label: "Acciones",
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewTarget(row)}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Ver detalle"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => setActionTarget(row)}
            disabled={!row.is_active || row.roles?.includes('administrador')}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
            title={
              row.roles?.includes('administrador')
                ? "No puedes desactivar a un administrador"
                : row.is_active
                  ? "Desactivar usuario"
                  : "Usuario ya inactivo"
            }
          >
            <UserX size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <ToastContainer />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="text-amber-500" />
            Gestión de Usuarios
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Administra todos los accesos a la plataforma SÍNTESIS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50 transition-colors"
            title="Recargar lista"
          >
            <RefreshCw size={17} className={isLoading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-medium py-2.5 px-4 rounded-lg transition-all shadow-sm text-sm"
          >
            <Plus size={18} />
            Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Stats rápidas */}
      {!isLoading && users.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5 animate-fade-in">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
            <p className="text-xl font-bold text-indigo-600">{counts.docentes}</p>
            <p className="text-xs text-gray-400 mt-1">Docentes</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
            <p className="text-xl font-bold text-emerald-600">{counts.estudiantes}</p>
            <p className="text-xs text-gray-400 mt-1">Estudiantes</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
            <p className="text-xl font-bold text-purple-600">{counts.admins}</p>
            <p className="text-xs text-gray-400 mt-1">Admins</p>
          </div>
        </div>
      )}

      {/* Controles de filtro y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, usuario o documento..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/30 outline-none shadow-sm"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-amber-500/30 outline-none shadow-sm"
        >
          <option value="todos">Todos los roles</option>
          <option value="estudiante">Estudiantes</option>
          <option value="docente">Docentes</option>
          <option value="administrador">Administradores</option>
        </select>
      </div>

      {/* Tabla */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        isLoading={isLoading}
        emptyMessage={
          search || roleFilter !== "todos"
            ? "No hay usuarios con ese criterio de búsqueda."
            : "No hay usuarios registrados. ¡Crea el primero!"
        }
      />

      {/* ── Modal Crear Usuario ──────────────────────────────────────────── */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Registrar Nuevo Usuario" size="md">
        <form onSubmit={handleRegister} className="space-y-4">
          {/* Error global del formulario */}
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre *</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3.5 py-2 border border-gray-200 rounded-lg outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm"
                placeholder="ej: María"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Apellido *</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3.5 py-2 border border-gray-200 rounded-lg outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm"
                placeholder="ej: González"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Documento de Identidad *</label>
            <input
              type="text"
              value={formData.document_id}
              onChange={(e) => setFormData({ ...formData, document_id: e.target.value })}
              className="w-full px-3.5 py-2 border border-gray-200 rounded-lg outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm"
              placeholder="ej: 1234567890"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Usuario (Login) *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, "") })}
                className="w-full px-3.5 py-2 border border-gray-200 rounded-lg outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm"
                placeholder="ej: profemaria"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña *</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2 pr-10 border border-gray-200 rounded-lg outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm"
                  placeholder="mín. 6 caracteres"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Rol a Asignar *</label>
            <div className="grid grid-cols-3 gap-2">
              {["docente", "estudiante", "administrador"].map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setFormData({ ...formData, role_name: role })}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all capitalize ${
                    formData.role_name === role
                      ? role === "administrador"
                        ? "bg-purple-50 border-purple-400 text-purple-700"
                        : role === "docente"
                          ? "bg-indigo-50 border-indigo-400 text-indigo-700"
                          : "bg-emerald-50 border-emerald-400 text-emerald-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-sm disabled:opacity-60 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Crear Usuario
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal Ver Detalle Usuario ────────────────────────────────────── */}
      <Modal isOpen={!!viewTarget} onClose={() => setViewTarget(null)} title="Detalle del Usuario" size="sm">
        {viewTarget && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-2xl font-bold">
                {(viewTarget.full_name || viewTarget.username || "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-800 text-lg">{viewTarget.full_name || "—"}</p>
                <p className="text-sm text-gray-400">@{viewTarget.username}</p>
              </div>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-400">Documento</span>
                <span className="font-medium text-gray-700">{viewTarget.document_id || "—"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-400">Roles</span>
                <div className="flex gap-1">
                  {(viewTarget.roles || []).map(r => (
                    <span key={r} className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      r === 'administrador' ? 'bg-purple-100 text-purple-700' :
                      r === 'docente'       ? 'bg-indigo-100 text-indigo-700' :
                                              'bg-emerald-100 text-emerald-700'
                    }`}>{r}</span>
                  ))}
                </div>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Estado</span>
                <span className={`flex items-center gap-1.5 font-semibold text-xs px-2.5 py-1 rounded-full ${
                  viewTarget.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                }`}>
                  {viewTarget.is_active ? <UserCheck size={12} /> : <UserX size={12} />}
                  {viewTarget.is_active ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
            {viewTarget.is_active && !viewTarget.roles?.includes('administrador') && (
              <button
                onClick={() => { setViewTarget(null); setActionTarget(viewTarget); }}
                className="w-full py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <UserX size={15} />
                Desactivar este usuario
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* ── Confirm Desactivar ───────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!actionTarget}
        onClose={() => setActionTarget(null)}
        onConfirm={handleDeactivate}
        title="¿Desactivar Usuario?"
        message={`El usuario "${actionTarget?.full_name || actionTarget?.username}" perderá acceso al sistema. Esta acción es destructiva.`}
        confirmText="Desactivar"
        isLoading={isProcessingAction}
      />
    </>
  );
}
