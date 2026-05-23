import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getOverview, getRiskDistribution, getDiseaseTrends, getAlertStats } from '../../api/analytics.api';
import RiskDistributionChart from '../../components/charts/RiskDistributionChart';
import DiseaseBreakdownChart from '../../components/charts/DiseaseBreakdownChart';
import AlertTimelineChart from '../../components/charts/AlertTimelineChart';

function KPI({ label, value, color, icon, to }) {
  const content = (
    <div className="card flex items-center gap-4 hover:border-[#00d4ff44] transition-colors">
      <span className="text-3xl">{icon}</span>
      <div><p className="text-2xl font-bold" style={{ color }}>{value ?? '—'}</p><p className="text-xs text-[#94a3b8]">{label}</p></div>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

export default function AdminDashboard() {
  const { data: ov } = useQuery({ queryKey: ['overview'],       queryFn: () => getOverview().then(r => r.data) });
  const { data: rd } = useQuery({ queryKey: ['risk-dist'],      queryFn: () => getRiskDistribution().then(r => r.data) });
  const { data: dt } = useQuery({ queryKey: ['disease-trends'], queryFn: () => getDiseaseTrends().then(r => r.data) });
  const { data: as } = useQuery({ queryKey: ['alert-stats'],    queryFn: () => getAlertStats().then(r => r.data) });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[#f1f5f9]">Admin Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Total Users"        value={ov?.totalUsers}       color="#00d4ff" icon="👤" to="/admin/users" />
        <KPI label="Total Patients"     value={ov?.totalPatients}    color="#6366f1" icon="👥" to="/admin/assignments" />
        <KPI label="Active Alerts"      value={ov?.activeAlerts}     color="#ef4444" icon="🚨" />
        <KPI label="Predictions Today"  value={ov?.todayPredictions} color="#22c55e" icon="🤖" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card"><h2 className="text-sm font-semibold text-[#94a3b8] mb-4">DISEASE BREAKDOWN</h2><DiseaseBreakdownChart data={dt?.trends || []} /></div>
        <div className="card"><h2 className="text-sm font-semibold text-[#94a3b8] mb-4">RISK DISTRIBUTION</h2><RiskDistributionChart data={rd?.distribution || []} /></div>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-[#94a3b8] mb-4">ALERT STATISTICS</h2>
        <AlertTimelineChart byType={as?.byType || []} byStatus={as?.byStatus || []} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Manage Users',       to: '/admin/users',       icon: '👤', desc: 'Create, update, deactivate users' },
          { label: 'Patient Assignments',to: '/admin/assignments', icon: '🔗', desc: 'Assign doctors & caretakers to patients' },
          { label: 'System Analytics',   to: '/admin/analytics',   icon: '📈', desc: 'View system-wide statistics' },
        ].map(({ label, to, icon, desc }) => (
          <Link key={to} to={to} className="card hover:border-[#00d4ff] border border-[#2d3748] transition-colors">
            <p className="text-2xl mb-2">{icon}</p>
            <p className="text-sm font-semibold text-[#f1f5f9]">{label}</p>
            <p className="text-xs text-[#94a3b8] mt-1">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
