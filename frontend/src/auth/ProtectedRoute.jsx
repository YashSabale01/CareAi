import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="flex items-center justify-center h-screen" style={{ background: 'var(--color-bg-primary)' }}><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-accent-primary" style={{ borderColor: 'var(--color-accent-primary)' }} /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
}
