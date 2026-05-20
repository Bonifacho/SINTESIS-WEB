# SÍNTESIS — Portal Web Administrativo y Docente 🚀

![SÍNTESIS Portal](https://raw.githubusercontent.com/Bonifacho/SINTESIS-WEB/main/public/vite.svg)

> Plataforma web centralizada para la gestión académica del sistema SÍNTESIS. Diseñada exclusivamente para **Administradores** y **Docentes**.

## 📖 Descripción del Proyecto
El **Portal Web SÍNTESIS** es la interfaz de gestión administrativa y creación de contenido de la plataforma. Mientras que los estudiantes acceden al sistema a través de la aplicación móvil (React Native), los docentes y administradores utilizan este portal web responsivo, rápido y seguro.

### 🌟 Características Principales
*   **Gestión Administrativa:** Control total sobre usuarios (estudiantes, docentes, administradores), creación de cuentas y monitoreo de las actividades del sistema (grupos, temas y OVAs).
*   **Dashboard Docente:** Herramientas avanzadas para la creación de grupos, matriculación de estudiantes, y gestión de contenido interactivo.
*   **Constructor de OVAs y Exámenes:** Una interfaz intuitiva que permite a los docentes crear Objetivos Virtuales de Aprendizaje (OVAs) con recursos multimedia y armar exámenes dinámicos con múltiples preguntas y opciones.
*   **Seguridad:** Autenticación por JWT (JSON Web Tokens), protección de rutas por roles y manejo automático de *Refresh Tokens*.
*   **UI/UX Premium:** Interfaz limpia y profesional con animaciones sutiles, estados de carga, feedback visual (Toasts) y protección de modales, asegurando una experiencia de uso excelente.

## 🛠️ Stack Tecnológico
*   **Framework:** React 18 (con Vite)
*   **Enrutamiento:** React Router DOM v6
*   **Estilos:** Tailwind CSS v3
*   **Iconografía:** Lucide React
*   **Cliente HTTP:** Axios (con interceptores personalizados)

## 🗂️ Estructura del Proyecto
```
FRONT_WEB/
├── src/
│   ├── api/          # Configuración de Axios e interceptores (client.js)
│   ├── components/   # Componentes UI reutilizables (DataTable, Modal, Toast, LoadingSpinner)
│   ├── context/      # Contexto global (AuthContext para manejo de sesión y roles)
│   ├── layouts/      # Layout principal con Sidebar dinámica según el rol (DashboardLayout)
│   ├── pages/        # Vistas de la aplicación
│   │   ├── admin/    # Páginas exclusivas del administrador
│   │   ├── teacher/  # Páginas exclusivas del docente
│   │   ├── Login.jsx # Vista pública de autenticación
│   │   └── Unauthorized.jsx # Vista de acceso denegado
│   └── router/       # Configuración de rutas (AppRouter) y guardias (ProtectedRoute)
```

## 🚀 Flujos de Usuario
### Flujo del Administrador
1.  **Inicio de sesión** (`/login`)
2.  Acceso al **Dashboard Administrativo** para revisar métricas clave.
3.  **Gestión de Usuarios** (`/admin/users`): Creación y desactivación de cuentas para docentes y estudiantes.
4.  **Actividades del Sistema** (`/admin/activities`): Monitoreo global de todos los grupos, temas y OVAs generados por los docentes.

### Flujo del Docente
1.  **Inicio de sesión** (`/login`)
2.  Acceso al **Dashboard Docente** (`/teacher/dashboard`)
3.  **Mis Grupos** (`/teacher/groups`): Creación de grupos y gestión de matrículas.
4.  **Temas y OVAs** (`/teacher/ovas`): Creación de temas de estudio y construcción de OVAs con recursos asociados.
5.  **Exámenes** (`/teacher/ovas/:id/exam`): Constructor dinámico para armar pruebas para los estudiantes.
6.  **Resultados** (`/teacher/results`): Monitoreo y filtrado de calificaciones por grupo.

## ⚙️ Instalación y Ejecución Local
1.  **Clonar el repositorio**
    ```bash
    git clone https://github.com/Bonifacho/SINTESIS-WEB.git
    cd FRONT_WEB
    ```
2.  **Instalar dependencias**
    ```bash
    npm install
    ```
3.  **Configurar variables de entorno**
    Crea un archivo `.env` en la raíz basado en el siguiente ejemplo:
    ```env
    VITE_API_BASE_URL=http://localhost:5000  # O la URL de tu backend en producción
    ```
4.  **Ejecutar el servidor de desarrollo**
    ```bash
    npm run dev
    ```

## 🚀 Despliegue
Este portal web está optimizado para su despliegue en plataformas estáticas como **Vercel** o **Netlify**. Asegúrate de agregar la variable de entorno `VITE_API_BASE_URL` apuntando a tu API en producción (por ejemplo, en Render) antes de compilar.
```bash
npm run build
```

---
*Desarrollado para el proyecto académico SÍNTESIS (2026).*
