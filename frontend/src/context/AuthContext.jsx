import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'pg-auth';

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
  } catch (err) {
    // ignore
  }
  return { token: '', profile: null, role: '', roles: [] };
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(loadInitialAuth);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    } catch (err) {
      // ignore storage errors
    }
  }, [auth]);

  /**
   * @param {string|string[]} roleOrRoles - single role string (backward compat) or roles array
   * @param {{ token: string, profile: object }} payload
   */
  const login = (roleOrRoles, payload) => {
    const roles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
    // backward compat: pick highest-priority role as `role`
    const role = roles.includes('admin') ? 'admin' : roles.includes('owner') ? 'owner' : roles[0] || 'user';
    setAuth({
      token: payload.token || '',
      profile: payload.profile || null,
      role,
      roles,
    });
  };

  const logout = () => {
    setAuth({ token: '', profile: null, role: '', roles: [] });
  };

  const setProfile = (profile) => {
    setAuth((prev) => ({ ...prev, profile }));
  };

  /** Check if current user has a specific role */
  const hasRole = (r) => (auth.roles || []).includes(r);

  const value = useMemo(() => ({ ...auth, login, logout, setProfile, hasRole }), [auth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
