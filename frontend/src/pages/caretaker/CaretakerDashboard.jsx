import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { getPatients } from '../../api/patient.api';
import { getAlerts } from '../../api/alert.api';
import { getCaretakerAnalytics } from '../../api/analytics.api';
import useAuth from '../../hooks/useAuth';
import { formatDateTime } from '../../utils/formatters';

const RISK_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e', Unknown: '#94a3b8' };

export default function CaretakerDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: patientsData } = useQuery({ queryKey: ['my-patients'], queryFn: () => getPatients().then(r => r.data) });
  const { data: alertsData }   = useQuery({ queryKey: ['my-alerts'],   queryFn: () => getAlerts({ status: 'Active' }).then(r => r.data) });
  const { data: ctStats }      = useQuery({ queryKey: ['caretaker-analytics'], queryFn: () => getCaretakerAnalytics('me').then(r => r.data) });

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    socket.emit('join_room', user?._id);
    socket.on('new_alert', (data) => {
      toast.error(`🚨 Alert: ${data.disease || data.predictedDisease} — ${data.riskLevel} Risk`, { duration: 6000 });
      qc.invalidateQueries({ queryKey: ['my-alerts'] });
    });
    socket.on('vitals_processed', (data) => {
      toast.success(data.message || 'Vitals processed successfully');
      qc.invalidateQueries({ queryKey: ['my-patients'] });
    });
    socket.on('careplan_approved', () => toast.success('Care plan approved by doctor!'));
    return () => socket.disconnect();
  }, [user, qc]);

  const patients  = patientsData?.patients || [];
  const alerts    = alertsData?.alerts || [];
  const highRisk  = ctStats?.riskBreakdown?.High || patients.filter(p => p.currentRiskLevel === 'High').length;
  const vitalsToday = ctStats?.recentVitals?.filter(v => new Date(v.recordedAt) > new Date(new Date().setHours(0,0,0,0))).length || 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#f1f5f9]">Caretaker Dashboard</h1>
        <Link to="/caretaker/vitals" className="btn-primary">➕ Enter Vitals</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Assigned Patients', value: patients.length,  color: '#00d4ff', icon: '👥' },
          { label: 'Active Alerts',     value: alerts.length,    color: '#ef4444', icon: '🚨' },
          { label: 'High Risk',         value: highRisk,         color: '#ef4444', icon: '⚠️' },
          { label: 'Vitals Today',      value: vitalsToday,      color: '#22c55e', icon: '💓' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="card flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <div><p className="text-xl font-bold" style={{ color }}>{value}</p><p className="text-xs text-[#94a3b8]">{label}</p></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assigned patients grid */}
        <div className="lg:col-span-2 card">
          <h2 className="text-sm font-semibold text-[#94a3b8] mb-4">ASSIGNED PATIENTS</h2>
          {patients.length === 0 ? (
            <p className="text-[#94a3b8] text-sm text-center py-8">No patients assigned yet. Contact admin.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {patients.map(p => (
                <div key={p._id} className="p-3 rounded-lg border border-[#2d3748] flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#f1f5f9]">{p.userId?.name}</p>
                      <p className="text-xs text-[#94a3b8]">{p.patientId} · Age {p.age || '—'}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color: RISK_COLORS[p.currentRiskLevel], background: RISK_COLORS[p.currentRiskLevel] + '22' }}>
                      {p.currentRiskLevel}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/caretaker/vitals?patientId=${p._id}`} className="btn-primary text-center text-xs py-1.5 flex-1">
                      ➕ Vitals
                    </Link>
                    <Link to={`/caretaker/patients/${p._id}/analytics`} className="flex-1 text-center text-xs py-1.5 rounded-lg border border-[#2d3748] text-[#00d4ff] hover:bg-[#1f2d3d]">
                      📊 Analytics
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alert feed */}
        <div className="card">
          <h2 className="text-sm font-semibold text-[#94a3b8] mb-4">ACTIVE ALERTS</h2>
          {alerts.length === 0 ? (
            <p className="text-[#94a3b8] text-sm text-center py-8">No active alerts</p>
          ) : (
            <div className="flex flex-col gap-2">
              {alerts.slice(0, 8).map(a => (
                <div key={a._id} className="p-2 rounded border border-[#ef444433] bg-[#ef444411]">
                  <p className="text-xs font-semibold text-[#ef4444]">{a.predictedDisease || a.message?.split(':')[0]}</p>
                  <p className="text-xs text-[#94a3b8] mt-0.5">{formatDateTime(a.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
