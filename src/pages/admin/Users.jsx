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
  const [editingUser, setEditingUser] = useState(null);

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

  // ── Guardar usuario (Crear / Editar) ─────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");

    // Validación local básica
    if (formData.document_id.length < 5) {
      setFormError("El documento de identidad debe tener al menos 5 dígitos.");
      return;
    }
    if (!editingUser && formData.password.length < 6) {
      setFormError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setIsSaving(true);
    try {
      if (editingUser) {
        await api.put(`/api/v1/security/users/${editingUser.id}`, {
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          document_id: formData.document_id.trim(),
          role_name: formData.role_name // Enviamos el rol al backend
        });
        showToast(`Usuario "${formData.username}" actualizado exitosamente`, "success");
      } else {
        await api.post("/api/v1/security/admin/register", formData);
        showToast(`Usuario "${formData.username}" creado exitosamente`, "success");
      }
      setModalOpen(false);
      setFormData(INITIAL_FORM);
      setShowPassword(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.response?.data?.msg ||
        "Error al guardar usuario. Verifica que los datos sean correctos.";
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      const parts = (user.full_name || "").split(" ");
      const first_name = parts[0] || "";
      const last_name = parts.slice(1).join(" ") || "";
      setFormData({
        first_name,
        last_name,
        document_id: user.document_id || "",
        username: user.username || "",
        password: "", // no soportado en update básico
        role_name: user.roles?.[0] || "docente"
      });
    } else {
      setEditingUser(null);
      setFormData(INITIAL_FORM);
    }
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
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-xs">
            {(val || row.username || "?").charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-800 leading-tight text-sm">{val || "—"}</p>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">@{row.username}</p>
          </div>
        </div>
      )
    },
    { 
      key: "document_id", 
      label: "Documento",
      render: (val) => <span className="font-mono text-xs text-slate-600">{val || "—"}</span>
    },
    {
      key: "roles",
      label: "Rol Asignado",
      render: (roles) => (
        <div className="flex gap-1.5 flex-wrap">
          {(roles || []).map(r => (
            <span key={r} className={`px-2.5 py-0.5 rounded-xl text-xs font-semibold border ${
              r === 'administrador' ? 'bg-purple-50 text-purple-700 border-purple-200/80 shadow-xs' :
              r === 'practicante'   ? 'bg-cyan-50 text-cyan-700 border-cyan-200/80 shadow-xs' :
              r === 'docente'       ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80 shadow-xs' :
                                      'bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-xs'
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
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl border ${
          active 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-xs' 
            : 'bg-rose-50 text-rose-600 border-rose-200/80 shadow-xs'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-rose-400'}`} />
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
            onClick={() => handleOpenModal(row)}
            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
            title="Editar datos del usuario"
          >
            <UserCog size={16} />
          </button>
          <button
            onClick={() => setViewTarget(row)}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
            title="Ver detalle"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => setActionTarget(row)}
            disabled={!row.is_active || row.roles?.includes('administrador')}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
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
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <Shield className="text-amber-600" size={26} />
            Gestión de Usuarios
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Administra credenciales, roles y accesos a la plataforma SÍNTESIS.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={fetchUsers}
            className="p-2.5 rounded-xl border border-slate-200/80 text-slate-500 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50 active:scale-[0.98] transition-all shadow-xs"
            title="Recargar lista"
          >
            <RefreshCw size={17} className={isLoading ? "animate-spin text-amber-600" : ""} />
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-medium py-2.5 px-4 rounded-xl transition-all shadow-sm shadow-amber-200 text-sm"
          >
            <Plus size={18} />
            Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Stats rápidas */}
      {!isLoading && users.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5 animate-fade-in">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs text-center">
            <p className="text-xl font-extrabold text-indigo-600 tracking-tight">{counts.docentes}</p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Docentes</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs text-center">
            <p className="text-xl font-extrabold text-emerald-600 tracking-tight">{counts.estudiantes}</p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Estudiantes</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs text-center">
            <p className="text-xl font-extrabold text-purple-600 tracking-tight">{counts.admins}</p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Admins</p>
          </div>
        </div>
      )}

      {/* Controles de filtro y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, usuario o documento..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none text-slate-700 shadow-xs transition-all"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-700 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none shadow-xs transition-all"
        >
          <option value="todos">Todos los roles</option>
          <option value="estudiante">Estudiantes</option>
          <option value="docente">Docentes</option>
          <option value="administrador">Administradores</option>
          <option value="practicante">Practicantes</option>
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

      {/* ── Modal Crear/Editar Usuario ──────────────────────────────────────────── */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingUser ? "Editar Usuario" : "Registrar Nuevo Usuario"} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          {/* Error global del formulario */}
          {formError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3 flex items-start gap-2.5">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span className="leading-snug">{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Nombre *</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all text-sm text-slate-800"
                placeholder="ej: María"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Apellido *</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all text-sm text-slate-800"
                placeholder="ej: González"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Documento de Identidad *</label>
            <input
              type="text"
              value={formData.document_id}
              onChange={(e) => setFormData({ ...formData, document_id: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all text-sm text-slate-800 font-mono"
              placeholder="ej: 1234567890"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Usuario (Login) *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, "") })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 font-mono"
                placeholder="ej: profemaria"
                required
                disabled={!!editingUser}
              />
            </div>
            {!editingUser && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Contraseña *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 pr-10 border border-slate-200 rounded-xl outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all text-sm text-slate-800"
                    placeholder="mín. 6 caracteres"
                    required={!editingUser}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {(!editingUser || !editingUser.roles?.includes("administrador")) && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Rol a Asignar *</label>
              <div className="grid grid-cols-3 gap-2.5">
                {["docente", "estudiante", "practicante"].map(role => {
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setFormData({ ...formData, role_name: role })}
                      className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all capitalize ${
                        formData.role_name === role
                          ? role === "practicante"
                            ? "bg-cyan-50 border-cyan-400 text-cyan-700 shadow-xs"
                            : role === "docente"
                              ? "bg-indigo-50 border-indigo-400 text-indigo-700 shadow-xs"
                              : "bg-emerald-50 border-emerald-400 text-emerald-700 shadow-xs"
                          : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 font-medium text-sm disabled:opacity-60 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm shadow-amber-200"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  {editingUser ? <UserCog size={16} /> : <Plus size={16} />}
                  {editingUser ? "Guardar Cambios" : "Crear Usuario"}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal Ver Detalle Usuario ────────────────────────────────────── */}
      <Modal isOpen={!!viewTarget} onClose={() => setViewTarget(null)} title="Detalle del Usuario" size="sm">
        {viewTarget && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl font-bold shadow-xs">
                {(viewTarget.full_name || viewTarget.username || "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-slate-800 text-base leading-snug">{viewTarget.full_name || "—"}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">@{viewTarget.username}</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Documento</span>
                <span className="font-mono text-sm font-semibold text-slate-700">{viewTarget.document_id || "—"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 items-center">
                <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Roles</span>
                <div className="flex gap-1.5">
                  {(viewTarget.roles || []).map(r => (
                    <span key={r} className={`px-2.5 py-0.5 rounded-xl text-xs font-semibold border ${
                      r === 'administrador' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      r === 'practicante'   ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                      r === 'docente'       ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                              'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>{r}</span>
                  ))}
                </div>
              </div>
              <div className="flex justify-between py-2 items-center">
                <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Estado de Cuenta</span>
                <span className={`inline-flex items-center gap-1.5 font-semibold text-xs px-2.5 py-1 rounded-xl border ${
                  viewTarget.is_active 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-rose-50 text-rose-600 border-rose-200'
                }`}>
                  {viewTarget.is_active ? <UserCheck size={12} /> : <UserX size={12} />}
                  {viewTarget.is_active ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
            {viewTarget.is_active && !viewTarget.roles?.includes('administrador') && (
              <button
                onClick={() => { setViewTarget(null); setActionTarget(viewTarget); }}
                className="w-full py-2.5 border border-rose-200 text-rose-600 hover:bg-rose-50 active:scale-[0.98] rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-xs"
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
