import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'qaroo_admin_theme';

const AdminThemeContext = createContext({ theme: 'light', toggle: () => {} });

export function AdminThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch { /* ignore */ }
    return 'light';
  });

  useEffect(() => {
    document.body.classList.toggle('admin-dark', theme === 'dark');
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch { /* ignore */ }
    return () => document.body.classList.remove('admin-dark');
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <AdminThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </AdminThemeContext.Provider>
  );
}

export const useAdminTheme = () => useContext(AdminThemeContext);
