import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../../api/authApi.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    try {
      const res = await authApi.me();
      setAdmin(res.data.admin);
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    setAdmin(res.data.admin);
    return res;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore logout errors; clear local state regardless
    }
    setAdmin(null);
  };

  const refreshMe = async () => {
    const res = await authApi.me();
    setAdmin(res.data.admin);
    return res.data.admin;
  };

  const hasPermission = useCallback(
    (permission) => {
      if (!admin) return false;
      if (admin.role === 'superadmin') return true;
      return admin.permissions?.includes(permission) || false;
    },
    [admin]
  );

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, refreshMe, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
