import { createContext, useState, useEffect, useCallback } from 'react';
import { getMe } from '../api/auth.api';

export const AuthContext = createContext(null);

const ROLE_HOME = {
  doctor:    '/doctor',
  caretaker: '/caretaker',
  patient:   '/patient',
  admin:     '/admin',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('careai_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('careai_token');
    if (token) {
      getMe().then(r => setUser(r.data.user)).catch(() => {
        localStorage.removeItem('careai_token');
        localStorage.removeItem('careai_user');
        setUser(null);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback((token, userData) => {
    localStorage.setItem('careai_token', token);
    localStorage.setItem('careai_user', JSON.stringify(userData));
    setUser(userData);
    return ROLE_HOME[userData.role] || '/login';
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('careai_token');
    localStorage.removeItem('careai_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, roleHome: ROLE_HOME }}>
      {children}
    </AuthContext.Provider>
  );
}
