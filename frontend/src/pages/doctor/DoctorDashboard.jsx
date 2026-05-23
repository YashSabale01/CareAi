import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { getDoctorAnalytics, getRiskDistribution, getDiseaseTrends } from '../../api/analytics.api';
import { getAlerts, acknowledgeAlert, resolveAlert } from '../../api/alert.api';
import { getPatients } from '../../api/patient.api';
import RiskDistributionChart from '../../components/charts/RiskDistributionChart';
import DiseaseBreakdownChart from '../../components/charts/DiseaseBreakdownChart';
import useAuth from '../../hooks/useAuth';
import { formatDateTime } from '../../utils/formatters';

const RISK_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e', Unknown: '#94a3b8' };

export default function DoctorDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: docStats } = useQuery({ queryKey: ['doctor-analytics'], queryFn: () => getDoctorAnalytics('me').then(r => r.data) });
  const { data: riskData }  = useQuery({ queryKey: ['risk-dist'],       queryFn: () => getRiskDistribution().then(r => r.data) });
  const { data: diseaseData } = useQuery({ queryKey: ['disease-trends'], queryFn: () => getDiseaseTrends().then(r => r.data) });
  const { data: alertsData, refetch: refetchAlerts } = useQuery({ queryKey: ['alerts'], queryFn: () => getAlerts({ status: 'Active' }).then(r => r.data) });
  const { data: patientsData } = useQuery({ queryKey: ['my-patients'], queryFn: () => getPatients().then(r => r.data) });

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    socket.emit('join_room', user?._id);
    socket.on('new_alert', (data) => {
      toast.error(`🚨 Alert: ${data.predictedDisease || data.disease} — ${data.riskLevel} Risk`, { duration: 6000 });
      refetchAlerts();
      qc.invalidateQueries({ queryKey: ['doctor-analytics'] });
    });
    socket.on('new_prediction', () => {
      qc.invalidateQueries({ queryKey: ['my-patients'] });
      qc.invalidateQueries({ queryKey: ['doctor-analytics'] });
    });
    return () => socket.disconnect();
  }, [user, qc]);

  const handleAck     = (id) => acknowledgeAlert(id).then(() => refetchAlerts());
  const handleResolve = (id) => resolveAlert(id).then(() => refetchAlerts());

  // Sort patients by risk (High first)
  const riskOrder = { High: 0, Medium: 1, Low: 2, Unknown: 3 };
  const sortedPatients = [...(patientsData?.patients || [])].sort((a, b) => (riskOrder[a.currentRiskLevel] ?? 3) - (riskOrder[b.currentRiskLevel] ?? 3));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[#f1f5f9]">Doctor Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Assigned Patients',       value: docStats?.totalPatients,    color: '#00d4ff', icon: '👥' },
          { label: 'Pending Care Plans',       value: docStats?.pendingCarePlans, color: '#f59e0b', icon: '📋' },
          { label: 'Active Alerts',            value: docStats?.activeAlerts,     color: '#ef4444', icon: '🚨' },
          { label: 'High Risk Patients',       value: docStats?.riskBreakdown?.High || 0, color: '#ef4444', icon: '⚠️' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="card flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <div><p className="text-xl font-bold" style={{ color }}>{value ?? '—'}</p><p className="text-xs text-[#94a3b8]">{label}</p></div>
          </div>
        ))}
      </div>

      {/* Pending care plan banner */}
      {docStats?.pendingCarePlans > 0 && (
        <div className="card border border-[#f59e0b] bg-[#f59e0b11] flex items-center justify-between">
          <p className="text-sm text-[#f59e0b] font-semibold">⏳ {docStats.pendingCarePlans} care plan(s) awaiting your approval</p>
          <Link to="/doctor/careplans" className="text-xs text-[#00d4ff] hover:underline">Review →</Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patients at risk table */}
        <div className="lg:col-span-2 card">
          <h2 className="text-sm font-semibold text-[#94a3b8] mb-4">PATIENTS AT RISK</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-[#94a3b8] border-b border-[#2d3748]">
                <th className="text-left pb-2">Patient</th>
                <th className="text-left pb-2">Disease</th>
                <th className="text-left pb-2">Risk</th>
                <th className="text-left pb-2">Action</th>
              </tr></thead>
              <tbody>
                {sortedPatients.slice(0, 8).map(p => (
                  <tr key={p._id} className="border-b border-[#2d3748] hover:bg-[#1f2d3d]">
                    <td className="py-2">
                      <p className="text-[#f1f5f9] font-medium">{p.userId?.name}</p>
                      <p className="text-xs text-[#94a3b8]">{p.patientId}</p>
                    </td>
                    <td className="py-2 text-[#94a3b8]">{p.chronicConditions?.[0] || '—'}</td>
                    <td className="py-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color: RISK_COLORS[p.currentRiskLevel], background: RISK_COLORS[p.currentRiskLevel] + '22' }}>
                        {p.currentRiskLevel}
                      </span>
                    </td>
                    <td className="py-2">
                      <Link to={`/doctor/patients/${p._id}/analytics`} className="text-xs text-[#00d4ff] hover:underline">Review →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alert feed */}
        <div className="card">
          <h2 className="text-sm font-semibold text-[#94a3b8] mb-4">ACTIVE ALERTS</h2>
          {alertsData?.alerts?.length === 0 ? (
            <p className="text-[#94a3b8] text-sm text-center py-8">No active alerts</p>
          ) : (
            <div className="flex flex-col gap-2">
              {alertsData?.alerts?.slice(0, 6).map(a => (
                <div key={a._id} className="p-2 rounded border border-[#ef444433] bg-[#ef444411]">
                  <p className="text-xs font-semibold text-[#ef4444]">{a.predictedDisease || a.alertType}</p>
                  <p className="text-xs text-[#94a3b8]">{formatDateTime(a.createdAt)}</p>
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => handleAck(a._id)} className="text-xs text-[#f59e0b] hover:underline">Acknowledge</button>
                    <button onClick={() => handleResolve(a._id)} className="text-xs text-[#22c55e] hover:underline">Resolve</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card"><h2 className="text-sm font-semibold text-[#94a3b8] mb-4">DISEASE BREAKDOWN</h2><DiseaseBreakdownChart data={diseaseData?.trends || []} /></div>
        <div className="card"><h2 className="text-sm font-semibold text-[#94a3b8] mb-4">RISK DISTRIBUTION</h2><RiskDistributionChart data={riskData?.distribution || []} /></div>
      </div>
    </div>
  );
}
