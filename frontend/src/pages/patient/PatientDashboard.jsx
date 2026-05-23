import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { getPatientAnalytics, getRecoveryProgress } from '../../api/analytics.api';
import { getVitalsByPatient } from '../../api/vitals.api';
import VitalTrendChart from '../../components/charts/VitalTrendChart';
import { DISCLAIMER } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatters';

const RISK_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e', Unknown: '#94a3b8' };

export default function PatientDashboard() {
  const { data: profileData } = useQuery({
    queryKey: ['my-patient-profile'],
    queryFn: () => api.get('/api/patients/me').then(r => r.data),
  });

  const patientId = profileData?.patient?._id;

  const { data: analytics } = useQuery({ queryKey: ['analytics', patientId], queryFn: () => getPatientAnalytics(patientId).then(r => r.data), enabled: !!patientId });
  const { data: vitalsData } = useQuery({ queryKey: ['vitals', patientId],   queryFn: () => getVitalsByPatient(patientId, { limit: 30 }).then(r => r.data), enabled: !!patientId });
  const { data: recovery }   = useQuery({ queryKey: ['recovery', patientId], queryFn: () => getRecoveryProgress(patientId).then(r => r.data), enabled: !!patientId });

  const latest  = analytics?.latestPrediction;
  const patient = profileData?.patient;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[#f1f5f9]">My Health Dashboard</h1>

      {/* Profile summary */}
      {patient && (
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-sm text-[#94a3b8]">{patient.patientId} · Age {patient.age} · {patient.gender}</p>
            <p className="text-xs text-[#94a3b8] mt-0.5">Doctor: Dr. {patient.assignedDoctorId?.name || '—'}</p>
            <p className="text-xs text-[#94a3b8]">Caretaker: {patient.assignedCaretakerId?.name || '—'}</p>
          </div>
          {latest && (
            <div className="text-right">
              <p className="text-xs text-[#94a3b8]">CURRENT STATUS</p>
              <p className="text-xl font-bold" style={{ color: RISK_COLORS[patient.currentRiskLevel] }}>{patient.currentRiskLevel} Risk</p>
            </div>
          )}
        </div>
      )}

      {/* Latest prediction */}
      {latest && (
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-xs text-[#94a3b8] mb-1">{latest.predictedDisease === 'Normal' ? 'Health Status' : 'Predicted Condition'}</p>
            <p className="text-xl font-bold" style={{ color: latest.predictedDisease === 'Normal' ? '#22c55e' : '#f1f5f9' }}>
              {latest.predictedDisease === 'Normal' ? '✓ No Condition Detected' : latest.predictedDisease}
            </p>
            <p className="text-xs text-[#94a3b8] mt-1">Last updated: {formatDateTime(latest.createdAt)}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: RISK_COLORS[latest.riskLevel] }}>{latest.riskLevel}</p>
            <p className="text-xs text-[#94a3b8]">{Math.round((latest.confidence || 0) * 100)}% confidence</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[['Vitals Recorded', analytics?.vitalsCount, '#00d4ff'], ['Predictions', analytics?.predictionsCount, '#6366f1'], ['Alerts', analytics?.alertsCount, '#ef4444']].map(([l, v, c]) => (
          <div key={l} className="card text-center"><p className="text-2xl font-bold" style={{ color: c }}>{v ?? '—'}</p><p className="text-xs text-[#94a3b8]">{l}</p></div>
        ))}
      </div>

      {/* Recovery */}
      {recovery && recovery.status !== 'Insufficient data' && (
        <div className="card flex items-center gap-4">
          <p className="text-lg font-bold" style={{ color: recovery.status === 'Improving' ? '#22c55e' : recovery.status === 'Declining' ? '#ef4444' : '#f59e0b' }}>
            {recovery.status === 'Improving' ? '📈' : recovery.status === 'Declining' ? '📉' : '➡️'} {recovery.status}
          </p>
          <p className="text-sm text-[#94a3b8]">{recovery.firstRisk} → {recovery.latestRisk}</p>
        </div>
      )}

      {/* Vitals trend */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#94a3b8]">VITAL TRENDS</h2>
          <Link to="/patient/vitals" className="text-xs text-[#00d4ff] hover:underline">View all →</Link>
        </div>
        <VitalTrendChart records={vitalsData?.vitals || []} />
      </div>

      {/* Care plan link */}
      <Link to="/patient/careplan" className="card flex items-center justify-between hover:border-[#00d4ff] border border-[#2d3748] transition-colors">
        <div>
          <p className="text-sm font-semibold text-[#f1f5f9]">📋 My Care Plan</p>
          <p className="text-xs text-[#94a3b8] mt-0.5">View your doctor-approved care plan</p>
        </div>
        <span className="text-[#00d4ff]">→</span>
      </Link>

      <p className="text-xs text-[#94a3b8] italic text-center">{DISCLAIMER}</p>
    </div>
  );
}
