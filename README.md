# 🌐 SÍNTESIS — Portal Web Administrativo y Docente

<div align="center">
  <img src="https://img.shields.io/badge/Estado-PRODUCCI%C3%93N_STABLE-success" alt="Estado" />
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/React_Router-v7-CA4245?logo=react-router" alt="React Router" />
  <img src="https://img.shields.io/badge/Axios-1.16-5A29E4?logo=axios" alt="Axios" />
</div>

> **Sistema INtegral Tecnológico para la Enseñanza y el Seguimiento Interactivo Secuencial.**

Plataforma web centralizada y de alto rendimiento diseñada para la gestión académica, administración de usuarios y creación de contenidos pedagógicos multimedia e interactivos del ecosistema **SÍNTESIS**.

---

## 📑 Tabla de Contenidos

1. [Descripción del Proyecto](#-descripción-del-proyecto)
2. [Funcionalidades por Rol](#-funcionalidades-por-rol)
3. [Stack Tecnológico](#-stack-tecnológico)
4. [Estructura del Proyecto](#-estructura-del-proyecto)
5. [Instalación y Uso Local](#-instalación-y-uso-local)
6. [Compilación y Despliegue](#-compilación-y-despliegue)

---

## 📖 Descripción del Proyecto

El **Portal Web SÍNTESIS** constituye la interfaz administrativa y docente del sistema. Mientras los estudiantes interactúan a través de la aplicación móvil nativa (Android), los docentes y administradores cuentan con un entorno de escritorio ágil, responsivo y seguro para coordinar todo el ciclo formativo:

* **Para Administradores:** Supervisión de cuentas de usuario, control de accesos y auditoría de la actividad institucional.
* **Para Docentes:** Gestión integral de grupos de clase, estructuración de temas y Objetos Virtuales de Aprendizaje (OVAs), diseño directo de exámenes interactivos y analítica de resultados con exportación de datos.

---

## 👥 Funcionalidades por Rol

### 👨‍🏫 Módulo Docente

1. **Dashboard Integral (`/teacher/dashboard`):**
   * Vista de métricas clave (grupos activos, estudiantes matriculados, temas creados).
   * Tarjetas de acceso directo a cada grupo para matriculación o gestión de contenidos con un solo clic.

2. **Gestión de Grupos y Matrículas (`/teacher/groups` y `/teacher/groups/:id`):**
   * Creación, edición y desactivación de cursos académicos.
   * Asignación y desmatriculación de estudiantes por grupo.

3. **Gestión de Temas y OVAs (`/teacher/ovas`):**
   * Selector dinámico de grupo con sincronización fluida de estado de navegación.
   * Creación de temas curriculares (unidades pedagógicas).
   * Listado y gestión de OVAs por tema (`/teacher/ovas/topic/:id`).

4. **Detalle de OVA y Recursos Multimedia (`/teacher/ovas/:id`):**
   * Adición y administración de recursos de estudio: videos (YouTube, Vimeo, MP4), PDFs, enlaces web y texto enriquecido.

5. **Constructor de Exámenes Inline (`/teacher/ovas/:id/exam`):**
   * Configuración de umbral de aprobación (`%`) e intentos máximos permitidos.
   * Edición inline de enunciados de pregunta y puntaje por ítem.
   * Opciones dinámicas de respuesta con selector de opción correcta inmediata.
   * **Vista Previa Interactiva:** Modal de simulación para verificar la experiencia del estudiante antes de publicar.

6. **Resultados de Evaluaciones (`/teacher/results`):**
   * Filtros combinados por **Grupo** (*Todos los grupos* o individual), **Estado** (*Todos*, *Aprobado*, *Reprobado*) y búsqueda en tiempo real por **Estudiante**.
   * Tabla paginada con notas, estados y fechas.
   * **Exportación CSV:** Descarga directa de reportes de notas para análisis externo o entrega a secretaría académica.

---

### 🛡️ Módulo Administrador

1. **Dashboard General (`/admin/dashboard`):**
   * Métricas globales de la plataforma: volumen total de usuarios, grupos y contenidos.

2. **Gestión de Usuarios (`/admin/users`):**
   * Creación, listado y desactivación de cuentas para docentes, estudiantes, practicantes y administradores.
   * Búsqueda instantánea y filtros por rol.

3. **Auditoría de Actividades (`/admin/activities`):**
   * Monitoreo centralizado de los contenidos creados en el sistema.

---

## 🛠️ Stack Tecnológico

* **Core:** React 19.2 + Vite 8
* **Enrutamiento:** React Router DOM v7
* **Estilos:** Tailwind CSS v3 con diseño responsivo y paleta accesible
* **Iconos:** Lucide React
* **Cliente HTTP:** Axios 1.16 con interceptores automáticos de autenticación JWT y refresh token transparente

---

## 📂 Estructura del Proyecto

```text
FRONT_WEB/
├── src/
│   ├── api/                  # Configuración de Axios e interceptores (client.js)
│   ├── components/           # Componentes UI reutilizables (DataTable, Modal, ConfirmDialog, Toast)
│   ├── context/              # Contexto global de sesión y permisos (AuthContext.jsx)
│   ├── layouts/              # Plantilla base con Sidebar responsivo (DashboardLayout.jsx)
│   ├── pages/                # Vistas principales del portal
│   │   ├── admin/            # Dashboard, Usuarios y Actividades del Administrador
│   │   ├── teacher/          # Dashboard, Grupos, Temas, OVAs, ExamBuilder, Resultados
│   │   ├── Login.jsx         # Autenticación con credenciales y JWT
│   │   └── Unauthorized.jsx  # Control de acceso por rol
│   └── router/               # Enrutamiento protegido por roles (AppRouter.jsx, ProtectedRoute.jsx)
│
├── public/                   # Recursos estáticos
├── package.json              # Scripts y dependencias declaradas
└── vite.config.js            # Configuración de empaquetado Vite
```

---

## ⚙️ Instalación y Uso Local

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/Bonifacho/SINTESIS-WEB.git
   cd FRONT_WEB
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   Crear un archivo `.env` en la raíz:
   ```env
   VITE_API_BASE_URL=http://localhost:5000
   ```

4. **Ejecutar el servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   El portal estará accesible en `http://localhost:5173`.

---

## 🚀 Compilación y Despliegue

Para generar el bundle optimizado de producción:

```bash
npm run build
```

El directorio `dist/` resultante puede desplegarse en plataformas como **Vercel**, **Netlify** o servirse mediante Nginx.

---
*Desarrollado para el proyecto académico SÍNTESIS (2026).*
