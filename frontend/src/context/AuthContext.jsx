import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

const STORAGE_KEY = 'pg-auth';

/** Decode roles from a JWT */
function decodeRoles(token) {
  try {
    const decoded = jwtDecode(token);
    if (Array.isArray(decoded.roles) && decoded.roles.length) return decoded.roles;
    if (decoded.role) return [decoded.role];
    return ['user'];
  } catch {
    return [];
  }
}

function loadInitialAuth() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migrate old single-role to array
      if (parsed.role && !parsed.roles) {
        parsed.roles = [parsed.role];
      }
      if (!parsed.roles) parsed.roles = [];
      return parsed;
    }
  } catch {
    // ignore
  }
  return { token: '', profile: null, role: '', roles: [] };
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(loadInitialAuth);

  // ── On mount: check URL for ?token= (from Passport OAuth redirect) ──
  useEffect(() => {
    const url = new URL(window.location.href);
    const tokenParam = url.searchParams.get('token');
    if (tokenParam) {
      const roles = decodeRoles(tokenParam);
      if (roles.length) {
        const role = roles.includes('admin') ? 'admin' : roles.includes('owner') ? 'owner' : roles[0];
        setAuth({ token: tokenParam, profile: null, role, roles });
      }
      // Clean URL (remove ?token=)
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url.pathname);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    } catch {
      // ignore storage errors
    }
  }, [auth]);

  /**
   * @param {string|string[]} roleOrRoles - single role string (backward compat) or roles array
   * @param {{ token: string, profile: object }} payload
   */
  const login = useCallback((roleOrRoles, payload) => {
    const roles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
    const role = roles.includes('admin') ? 'admin' : roles.includes('owner') ? 'owner' : roles[0] || 'user';
    setAuth({
      token: payload.token || '',
      profile: payload.profile || null,
      role,
      roles,
    });
  }, []);

  const logout = useCallback(() => {
    setAuth({ token: '', profile: null, role: '', roles: [] });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const setProfile = useCallback((profile) => {
    setAuth((prev) => ({ ...prev, profile }));
  }, []);

  /** Check if current user has a specific role */
  const hasRole = useCallback((r) => (auth.roles || []).includes(r), [auth.roles]);

  const value = useMemo(
    () => ({ ...auth, login, logout, setProfile, hasRole }),
    [auth, login, logout, setProfile, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
