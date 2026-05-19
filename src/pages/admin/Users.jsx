import { useState, useEffect, useCallback, useMemo } from "react";
import { Users as UsersIcon, Plus, UserX, UserCheck, Shield } from "lucide-react";
import api from "../../api/client";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useToast } from "../../components/Toast";

/**
 * AdminUsers — Panel de gestión de usuarios para el administrador.
 */
export default function AdminUsers() {
  const { showToast, ToastContainer } = useToast();
  
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("todos");

  // Modal Crear Usuario
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    document_id: "",
    username: "",
    password: "",
    role_name: "estudiante"
  });

  // Confirm Desactivar/Activar
  const [actionTarget, setActionTarget] = useState(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/api/v1/security/users");
      setUsers(data.data || []);
    } catch (err) {
      showToast("Error al cargar usuarios", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.post("/api/v1/security/admin/register", formData);
      showToast("Usuario creado exitosamente", "success");
      setModalOpen(false);
      setFormData({
        first_name: "",
        last_name: "",
        document_id: "",
        username: "",
        password: "",
        role_name: "estudiante"
      });
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.error || "Error al crear usuario", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!actionTarget) return;
    setIsProcessingAction(true);
    try {
      await api.delete(`/api/v1/security/users/${actionTarget.id}`);
      showToast("Usuario desactivado", "success");
      setActionTarget(null);
      fetchUsers();
    } catch (err) {
      showToast("Error al desactivar usuario", "error");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (roleFilter === "todos") return users;
    return users.filter(u => u.roles.includes(roleFilter));
  }, [users, roleFilter]);

  const columns = [
    { key: "full_name", label: "Nombre Completo", render: (val, row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs uppercase">
          {val.charAt(0)}{row.last_name?.charAt(0) || ""}
        </div>
        <div>
          <p className="font-medium text-gray-800">{val}</p>
          <p className="text-xs text-gray-500">@{row.username}</p>
        </div>
      </div>
    )},
    { key: "document_id", label: "Documento" },
    { key: "roles", label: "Rol(es)", render: (roles) => (
      <div className="flex gap-1 flex-wrap">
        {roles.map(r => (
          <span key={r} className={`px-2 py-0.5 rounded text-xs font-medium border ${
            r === 'administrador' ? 'bg-purple-50 text-purple-700 border-purple-200' :
            r === 'docente' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
            'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {r}
          </span>
        ))}
      </div>
    )},
    { key: "is_active", label: "Estado", render: (active) => (
      <span className={`flex items-center gap-1 text-sm font-medium ${active ? 'text-emerald-600' : 'text-red-500'}`}>
        {active ? <UserCheck size={16} /> : <UserX size={16} />}
        {active ? "Activo" : "Inactivo"}
      </span>
    )},
    {
      key: "actions",
      label: "Acciones",
      render: (_, row) => (
        <button
          onClick={() => setActionTarget(row)}
          disabled={!row.is_active || row.roles.includes('administrador')}
          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500"
          title={row.roles.includes('administrador') ? "No puedes desactivar a un administrador" : "Desactivar usuario"}
        >
          <UserX size={18} />
        </button>
      ),
    },
  ];

  return (
    <>
      <ToastContainer />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="text-amber-500" />
            Gestión de Usuarios
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Administra todos los accesos a la plataforma SÍNTESIS.</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-amber-500/30 outline-none shadow-sm min-w-[160px]"
          >
            <option value="todos">Todos los roles</option>
            <option value="estudiante">Estudiantes</option>
            <option value="docente">Docentes</option>
            <option value="administrador">Administradores</option>
          </select>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors shadow-sm text-sm"
          >
            <Plus size={18} />
            Nuevo Usuario
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredUsers}
        isLoading={isLoading}
        emptyMessage="No hay usuarios registrados con este filtro."
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Registrar Nuevo Usuario" size="md">
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Apellido</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Documento de Identidad</label>
            <input
              type="text"
              value={formData.document_id}
              onChange={(e) => setFormData({ ...formData, document_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Usuario (Login)</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Rol a Asignar</label>
            <select
              value={formData.role_name}
              onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-amber-500 bg-white"
              required
            >
              <option value="estudiante">Estudiante</option>
              <option value="docente">Docente</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border rounded-lg hover:bg-gray-50 font-medium text-sm">Cancelar</button>
            <button type="submit" disabled={isSaving} className="flex-1 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-sm disabled:opacity-50">
              {isSaving ? "Creando..." : "Crear Usuario"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!actionTarget}
        onClose={() => setActionTarget(null)}
        onConfirm={handleDeactivate}
        title="¿Desactivar Usuario?"
        message={`El usuario ${actionTarget?.full_name} perderá acceso al sistema permanentemente. Esta acción es destructiva.`}
        isLoading={isProcessingAction}
      />
    </>
  );
}
