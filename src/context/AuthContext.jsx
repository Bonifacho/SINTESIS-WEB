import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/client";

/**
 * AuthContext — Estado de autenticación global para la aplicación.
 *
 * Provee:
 *   - user:      Objeto con datos del usuario autenticado (o null).
 *   - token:     String del access_token (o null).
 *   - isLoading: Boolean mientras se restaura la sesión al montar.
 *   - login():   Autentica contra el backend y almacena la sesión.
 *   - logout():  Cierra sesión (backend + limpieza local).
 *
 * El login del backend retorna:
 * {
 *   message: "Login exitoso",
 *   access_token: "...",
 *   refresh_token: "...",
 *   user: { user_id, username, full_name, email, roles: ["docente"] }
 * }
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Restaurar sesión desde localStorage al montar ─────────────────────
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("access_token");
      const savedUser = localStorage.getItem("user");
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch {
      localStorage.clear();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────
  const login = useCallback(async (username, password) => {
    const { data } = await api.post("/api/v1/security/login", {
      username,
      password,
    });

    const userData = data.user;
    const accessToken = data.access_token;
    const refreshToken = data.refresh_token;

    // Validar que el usuario tenga un rol permitido para el portal web
    const allowedRoles = ["docente", "administrador"];
    const userRoles = userData.roles || [];
    const hasAccess = userRoles.some((r) => allowedRoles.includes(r));

    if (!hasAccess) {
      throw new Error(
        "Acceso denegado. Este portal es exclusivo para docentes y administradores."
      );
    }

    // Persistir en localStorage
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    localStorage.setItem("user", JSON.stringify(userData));

    // Actualizar estado React
    setToken(accessToken);
    setUser(userData);

    return userData;
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      // Notificar al backend para que revoque el token (blacklist)
      await api.post("/api/v1/security/logout");
    } catch {
      // Si falla (ej: token ya expirado), no pasa nada — limpiamos igual.
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      setToken(null);
      setUser(null);
    }
  }, []);

  const value = { user, token, isLoading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook para consumir el AuthContext en cualquier componente.
 * Uso: const { user, login, logout } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un <AuthProvider>");
  }
  return context;
}
