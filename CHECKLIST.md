# ✅ CHECKLIST — Portal Web SÍNTESIS

> Última actualización: 13 de mayo de 2026  
> Cada tarea se marca con ✅ al completarse.

---

## 🔵 DÍA 1 — Infraestructura Base (P1)
- [x] Capa API: `src/api/client.js` (Axios + interceptor JWT + refresh automático)
- [x] Auth Context: `src/context/AuthContext.jsx` (login, logout, persistencia localStorage)
- [x] Login funcional conectado al backend (`POST /security/login`)
- [x] ProtectedRoute: guardia de rutas por token + rol
- [x] Router completo con rutas protegidas (docente vs admin)
- [x] Página de acceso denegado (`Unauthorized.jsx`)
- [x] Dashboard Docente con datos reales del usuario
- [x] Dashboard Admin con estilo diferenciado (amber)
- [x] SEO: index.html con meta tags, lang="es", fuente Inter
- [x] CORS habilitado en el backend (`flask-cors`)
- [x] Subido a GitHub: `Bonifacho/SINTESIS-WEB`

## 🔵 DÍA 2 — Layout Reutilizable y Componentes UI (P1)
- [x] `DashboardLayout.jsx` — Layout compartido con Sidebar + Header + Outlet
- [x] `DataTable.jsx` — Tabla reutilizable con sorting, skeleton loading, empty state
- [x] `Modal.jsx` — Modal genérico con ESC, click-outside, scroll lock
- [x] `Toast.jsx` — Notificaciones con hook `useToast()` (success/error/warning/info)
- [x] `ConfirmDialog.jsx` — Diálogo de confirmación para acciones destructivas
- [x] `LoadingSpinner.jsx` — Spinner con 3 tamaños y modo fullscreen
- [x] Migrar dashboards para usar DashboardLayout con rutas anidadas (Outlet)
- [x] Animaciones CSS personalizadas (modal-in, slide-in)
- [x] Router refactorizado con rutas anidadas y menús por rol

## 🔵 DÍAS 3–4 — Gestión de Grupos y Matrículas (P1)
- [x] Página "Mis Grupos" (listar, crear, editar nombre, eliminar)
- [x] Página "Matrículas" (ver estudiantes de un grupo)
- [x] Buscador de estudiantes registrados (filtrado por rol)
- [x] Botón "Matricular" → `POST /enrollments`
- [x] Botón "Desmatricular" → `DELETE /enrollments/<id>`

## 🔵 DÍAS 5–7 — Creador de Contenido Académico (P2)
- [ ] Página "Temas" (CRUD dentro de un grupo)
- [ ] Página "OVAs" (CRUD dentro de un tema)
- [ ] Formulario de Recursos (tipo, título, URL/contenido)
- [ ] CRUD completo sobre `/ovas/<id>/resources`

## 🟢 DÍAS 8–10 — Constructor de Exámenes (P2)
- [ ] Página "Examen del OVA" (crear examen vinculado a un OVA)
- [ ] Editor de Preguntas (N preguntas dinámicas)
- [ ] 4 opciones de texto por pregunta
- [ ] Marcar opción correcta → `POST /answer-key`
- [ ] Vista previa del examen (solo lectura)

## 🟢 DÍA 11 — Panel Administrador (P2)
- [ ] Página "Gestión de Usuarios" (tabla con todos los usuarios)
- [ ] Filtros por rol (estudiante, docente, administrador)
- [ ] Crear usuario con rol → `POST /security/admin/register`
- [ ] Desactivar usuario → `DELETE /security/users/<id>`

## 🟢 DÍA 12 — Vista de Resultados Docente (P2)
- [ ] Página "Resultados" (seleccionar grupo → tabla de intentos)
- [ ] Columnas: estudiante, examen, puntaje, estado, fecha
- [ ] Consume `GET /groups/<id>/attempts`

## 🟡 DÍA 13 — Pulido Visual y UX (P3)
- [ ] Responsive: sidebar colapsable en pantallas pequeñas
- [ ] Micro-animaciones en modales y hover effects
- [ ] Estados vacíos con mensajes ilustrativos
- [ ] Manejo de errores con toasts claros

## 🟡 DÍA 14 — Testing Manual (P3)
- [ ] Flujo completo Docente: Login → Grupo → Tema → OVA → Recurso → Examen
- [ ] Flujo completo Admin: Login → Crear docente → Verificar login
- [ ] Auth Guard: estudiante no accede al portal, docente no accede a admin
- [ ] Corrección de bugs

## 🟡 DÍA 15 — Despliegue y Documentación (P3)
- [ ] Deploy del portal web (Vercel/Netlify)
- [ ] Conectar a backend de Railway (URL producción)
- [ ] Capturas de pantalla para documentación
- [ ] Verificación cruzada: app móvil consume datos creados desde el portal
