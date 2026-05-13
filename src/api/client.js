import axios from "axios";

/**
 * Instancia centralizada de Axios para toda la aplicación.
 * - Base URL configurable via .env (VITE_API_BASE_URL)
 * - Interceptor de request: inyecta el JWT en cada petición automáticamente.
 * - Interceptor de response: detecta tokens expirados (401) e intenta
 *   renovar con el refresh_token antes de fallar definitivamente.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// ── REQUEST INTERCEPTOR ──────────────────────────────────────────────────────
// Antes de cada petición, inyecta el access_token si existe en localStorage.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── RESPONSE INTERCEPTOR ─────────────────────────────────────────────────────
// Si el backend responde 401 (token expirado), intenta renovar el token
// usando el refresh_token almacenado. Si la renovación también falla,
// limpia la sesión y redirige al login.
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Solo intentar refresh si es 401 y NO es la propia petición de refresh/login
    const isAuthEndpoint =
      originalRequest.url?.includes("/security/login") ||
      originalRequest.url?.includes("/security/refresh");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      const refreshToken = localStorage.getItem("refresh_token");

      if (!refreshToken) {
        // No hay refresh token, limpiar sesión
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Si ya estamos refrescando, encolar esta petición
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${api.defaults.baseURL}/api/v1/security/refresh`,
          {},
          { headers: { Authorization: `Bearer ${refreshToken}` } }
        );

        const newToken = data.access_token;
        localStorage.setItem("access_token", newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
