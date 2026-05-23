import { NavLink } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const NAV = {
  caretaker: [
    { to: '/caretaker',              label: '📊 Dashboard' },
    { to: '/caretaker/vitals',       label: '➕ Enter Vitals' },   // PRIMARY ACTION
    { to: '/caretaker/patients',     label: '👥 Assigned Patients' },
    { to: '/caretaker/alerts',       label: '🔔 Alerts' },
    { to: '/caretaker/observations', label: '📝 Observations' },
  ],
  doctor: [
    { to: '/doctor',           label: '📊 Dashboard' },
    { to: '/doctor/patients',  label: '👥 My Patients' },
    { to: '/doctor/alerts',    label: '🚨 Alerts' },
    { to: '/doctor/careplans', label: '📋 Care Plans' },
    { to: '/doctor/reports',   label: '📈 Reports' },
  ],
  patient: [
    { to: '/patient',          label: '❤️ My Health' },
    { to: '/patient/vitals',   label: '💓 Vitals History' },
    { to: '/patient/careplan', label: '📋 My Care Plan' },
  ],
  admin: [
    { to: '/admin',             label: '📊 Dashboard' },
    { to: '/admin/users',       label: '👤 Users' },
    { to: '/admin/assignments', label: '🔗 Assignments' },
    { to: '/admin/analytics',   label: '📈 Analytics' },
  ],
};

export default function Sidebar() {
  const { user } = useAuth();
  const links = NAV[user?.role] || [];

  return (
    <aside className="w-56 min-h-full border-r border-[#2d3748] py-6 px-3 flex flex-col gap-1" style={{ background: 'var(--color-bg-secondary)' }}>
      {links.map(({ to, label }) => (
        <NavLink key={to} to={to} end={to.split('/').length === 2}
          className={({ isActive }) =>
            `px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-[#00d4ff22] text-[#00d4ff] font-semibold' : 'text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#1f2d3d]'}`
          }>
          {label}
        </NavLink>
      ))}
    </aside>
  );
}
