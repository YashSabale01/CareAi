import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../auth/AuthContext';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const dashboardPath = {
    doctor: '/doctor', patient: '/patient', caretaker: '/caretaker', admin: '/admin',
  }[user?.role] || '/';

  return (
    <nav className="h-14 flex items-center justify-between px-6 border-b border-[#2d3748]" style={{ background: 'var(--color-bg-secondary)' }}>
      <Link to={dashboardPath} className="text-lg font-bold" style={{ color: 'var(--color-accent-primary)' }}>
        ⚕ CareAI
      </Link>
      <div className="flex items-center gap-4">
        <span className="text-sm text-[#94a3b8]">{user?.name}</span>
        <span className="px-2 py-0.5 rounded text-xs font-semibold capitalize" style={{ background: '#6366f122', color: '#6366f1' }}>{user?.role}</span>
        <button onClick={handleLogout} className="text-sm text-[#94a3b8] hover:text-[#ef4444] transition-colors">Logout</button>
      </div>
    </nav>
  );
}
