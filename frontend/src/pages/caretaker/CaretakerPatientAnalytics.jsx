import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPatient } from '../../api/patient.api';
import { getVitalsByPatient } from '../../api/vitals.api';
import { getPatientAnalytics, getRecoveryProgress } from '../../api/analytics.api';
import VitalTrendChart from '../../components/charts/VitalTrendChart';
import { RiskHistoryChart, AlertTimelineChart } from '../../components/charts/PatientAnalyticsCharts';
import { Spinner } from '../../components/ui/index.jsx';
import { formatDateTime } from '../../utils/formatters';

const RISK_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e', Unknown: '#94a3b8' };

function Section({ title, children }) {
  return (
    <div className="card">
      <h2 className="text-sm font-semibold text-[#94a3b8] mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function CaretakerPatientAnalytics() {
  const { patientId } = useParams();

  const { data: pd, isLoading } = useQuery({ queryKey: ['patient', patientId], queryFn: () => getPatient(patientId).then(r => r.data) });
  const { data: vd }  = useQuery({ queryKey: ['vitals', patientId],    queryFn: () => getVitalsByPatient(patientId, { limit: 30 }).then(r => r.data) });
  const { data: ad }  = useQuery({ queryKey: ['analytics', patientId], queryFn: () => getPatientAnalytics(patientId).then(r => r.data) });
  const { data: rp }  = useQuery({ queryKey: ['recovery', patientId],  queryFn: () => getRecoveryProgress(patientId).then(r => r.data) });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size={40} /></div>;

  const p = pd?.patient;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="card flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#f1f5f9]">{p?.userId?.name}</h1>
          <p className="text-sm text-[#94a3b8] mt-1">{p?.patientId} · Age {p?.age} · {p?.gender} · {p?.bloodGroup}</p>
          <p className="text-xs text-[#94a3b8] mt-0.5">Dr. {p?.assignedDoctorId?.name || '—'}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#94a3b8]">CURRENT RISK</p>
          <p className="text-2xl font-bold" style={{ color: RISK_COLORS[p?.currentRiskLevel] }}>{p?.currentRiskLevel}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[['Vitals Recorded', ad?.vitalsCount], ['Predictions', ad?.predictionsCount], ['Alerts', ad?.alertsCount]].map(([l, v]) => (
          <div key={l} className="card text-center">
            <p className="text-2xl font-bold text-[#00d4ff]">{v ?? '—'}</p>
            <p className="text-xs text-[#94a3b8]">{l}</p>
          </div>
        ))}
      </div>

      {/* Vital averages */}
      {ad?.vitalAvg && (
        <Section title="VITAL AVERAGES (LAST 30 RECORDS)">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Heart Rate', value: `${ad.vitalAvg.heartRate} bpm`,   normal: ad.vitalAvg.heartRate >= 60 && ad.vitalAvg.heartRate <= 100 },
              { label: 'SpO2',       value: `${ad.vitalAvg.spo2}%`,           normal: ad.vitalAvg.spo2 >= 90 },
              { label: 'Systolic',   value: `${ad.vitalAvg.systolicBP} mmHg`, normal: ad.vitalAvg.systolicBP <= 140 },
              { label: 'Diastolic',  value: `${ad.vitalAvg.diastolicBP} mmHg`,normal: ad.vitalAvg.diastolicBP <= 90 },
              { label: 'Temp',       value: `${ad.vitalAvg.temperature}°C`,   normal: ad.vitalAvg.temperature >= 36.1 && ad.vitalAvg.temperature <= 37.9 },
            ].map(({ label, value, normal }) => (
              <div key={label} className="text-center p-3 rounded-lg border border-[#2d3748]">
                <p className="text-sm font-bold" style={{ color: normal ? '#22c55e' : '#ef4444' }}>{value}</p>
                <p className="text-xs text-[#94a3b8] mt-0.5">{label}</p>
                <p className="text-xs mt-0.5" style={{ color: normal ? '#22c55e' : '#ef4444' }}>{normal ? '✓ Normal' : '⚠ Abnormal'}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Vitals trend */}
      <Section title="VITALS TREND (LAST 30 RECORDS)">
        <VitalTrendChart records={vd?.vitals || []} />
      </Section>

      {/* Risk & alert charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskHistoryChart riskHistory={ad?.riskHistory || []} />
        <AlertTimelineChart alertHistory={ad?.alertHistory || []} />
      </div>

      {/* Recovery progress */}
      {rp && rp.status !== 'Insufficient data' && (
        <Section title="RECOVERY PROGRESS">
          <div className="flex items-center gap-4">
            <p className="text-lg font-bold" style={{ color: rp.status === 'Improving' ? '#22c55e' : rp.status === 'Declining' ? '#ef4444' : '#f59e0b' }}>
              {rp.status === 'Improving' ? '📈' : rp.status === 'Declining' ? '📉' : '➡️'} {rp.status}
            </p>
            <p className="text-sm text-[#94a3b8]">{rp.firstRisk} → {rp.latestRisk}</p>
            {rp.score !== 0 && <p className="text-sm text-[#94a3b8]">({Math.abs(rp.score)}% change)</p>}
          </div>
        </Section>
      )}

      {/* Recent vitals table */}
      {vd?.vitals?.length > 0 && (
        <Section title="RECENT VITALS">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-[#94a3b8] border-b border-[#2d3748]">
                {['Time', 'HR', 'SpO2', 'Sys BP', 'Dia BP', 'Temp', 'Fall', 'By'].map(h => (
                  <th key={h} className="text-left pb-2 pr-3">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {vd.vitals.slice(0, 10).map(v => (
                  <tr key={v._id} className="border-b border-[#2d3748] hover:bg-[#1f2d3d]">
                    <td className="py-1.5 pr-3 text-[#94a3b8]">{formatDateTime(v.recordedAt)}</td>
                    <td className="py-1.5 pr-3" style={{ color: v.heartRate > 100 || v.heartRate < 60 ? '#ef4444' : '#f1f5f9' }}>{v.heartRate}</td>
                    <td className="py-1.5 pr-3" style={{ color: v.spo2 < 90 ? '#ef4444' : '#f1f5f9' }}>{v.spo2}%</td>
                    <td className="py-1.5 pr-3" style={{ color: v.systolicBP > 140 ? '#ef4444' : '#f1f5f9' }}>{v.systolicBP}</td>
                    <td className="py-1.5 pr-3" style={{ color: v.diastolicBP > 90 ? '#ef4444' : '#f1f5f9' }}>{v.diastolicBP}</td>
                    <td className="py-1.5 pr-3" style={{ color: v.temperature > 37.9 || v.temperature < 36.1 ? '#ef4444' : '#f1f5f9' }}>{v.temperature?.toFixed(1)}</td>
                    <td className="py-1.5 pr-3" style={{ color: v.fallDetection ? '#ef4444' : '#22c55e' }}>{v.fallDetection ? 'Yes' : 'No'}</td>
                    <td className="py-1.5 text-[#94a3b8]">{v.submittedBy?.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </div>
  );
}
