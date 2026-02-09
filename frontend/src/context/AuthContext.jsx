import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'pg-auth';

function loadInitialAuth() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (err) {
    // ignore
  }
  return { token: '', profile: null, role: '' };
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

  const login = (role, payload) => {
    setAuth({
      token: payload.token || '',
      profile: payload.profile || null,
      role,
    });
  };

  const logout = () => {
    setAuth({ token: '', profile: null, role: '' });
  };

  const value = useMemo(() => ({ ...auth, login, logout }), [auth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
