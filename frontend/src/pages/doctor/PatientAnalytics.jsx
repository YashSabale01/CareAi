import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPatient } from '../../api/patient.api';
import { getVitalsByPatient } from '../../api/vitals.api';
import { getPatientAnalytics, getRecoveryProgress } from '../../api/analytics.api';
import { getCarePlanByPatient, updateCarePlan, approveCarePlan } from '../../api/careplan.api';
import { getAlertsByPatient, acknowledgeAlert, resolveAlert } from '../../api/alert.api';
import { getObservationsByPatient } from '../../api/observation.api';
import VitalTrendChart from '../../components/charts/VitalTrendChart';
import { RiskHistoryChart, AlertTimelineChart } from '../../components/charts/PatientAnalyticsCharts';
import { Spinner } from '../../components/ui/index.jsx';
import { formatDateTime } from '../../utils/formatters';
import { DISCLAIMER } from '../../utils/constants';
import toast from 'react-hot-toast';

const RISK_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e', Unknown: '#94a3b8' };

function Section({ title, children }) {
  return (
    <div className="card">
      <h2 className="text-sm font-semibold text-[#94a3b8] mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function PatientAnalytics() {
  const { patientId } = useParams();
  const qc = useQueryClient();
  const [carePlanForm, setCarePlanForm] = useState(null);
  const [editingCarePlan, setEditingCarePlan] = useState(false);

  const { data: pd, isLoading } = useQuery({ queryKey: ['patient', patientId], queryFn: () => getPatient(patientId).then(r => r.data) });
  const { data: vd }  = useQuery({ queryKey: ['vitals', patientId],      queryFn: () => getVitalsByPatient(patientId, { limit: 30 }).then(r => r.data) });
  const { data: ad }  = useQuery({ queryKey: ['analytics', patientId],   queryFn: () => getPatientAnalytics(patientId).then(r => r.data) });
  const { data: rp }  = useQuery({ queryKey: ['recovery', patientId],    queryFn: () => getRecoveryProgress(patientId).then(r => r.data) });
  const { data: cpd, refetch: refetchCP } = useQuery({ queryKey: ['careplan', patientId], queryFn: () => getCarePlanByPatient(patientId).then(r => r.data).catch(() => null) });
  const { data: ald, refetch: refetchAlerts } = useQuery({ queryKey: ['patient-alerts', patientId], queryFn: () => getAlertsByPatient(patientId).then(r => r.data) });
  const { data: obsd } = useQuery({ queryKey: ['observations', patientId], queryFn: () => getObservationsByPatient(patientId).then(r => r.data) });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateCarePlan(id, data),
    onSuccess: () => { toast.success('Care plan saved'); setEditingCarePlan(false); refetchCP(); },
    onError: (e) => toast.error(e.response?.data?.error || 'Save failed'),
  });

  const approveMutation = useMutation({
    mutationFn: (id) => approveCarePlan(id),
    onSuccess: () => { toast.success('Care plan approved! Patient and caretaker notified.'); refetchCP(); },
    onError: (e) => toast.error(e.response?.data?.error || 'Approval failed'),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size={40} /></div>;

  const p = pd?.patient;
  const cp = cpd?.carePlan;
  const latestPred = ad?.latestPrediction;

  const startEdit = () => {
    if (!cp) return;
    setCarePlanForm({
      dietaryGuidelines:       cp.dietaryGuidelines?.join('\n') || '',
      activityRecommendations: cp.activityRecommendations?.join('\n') || '',
      restrictions:            cp.restrictions?.join('\n') || '',
      followUpSchedule:        cp.followUpSchedule || '',
      doctorNotes:             cp.doctorNotes || '',
    });
    setEditingCarePlan(true);
  };

  const saveCarePlan = () => {
    const data = {
      dietaryGuidelines:       carePlanForm.dietaryGuidelines.split('\n').filter(Boolean),
      activityRecommendations: carePlanForm.activityRecommendations.split('\n').filter(Boolean),
      restrictions:            carePlanForm.restrictions.split('\n').filter(Boolean),
      followUpSchedule:        carePlanForm.followUpSchedule,
      doctorNotes:             carePlanForm.doctorNotes,
    };
    updateMutation.mutate({ id: cp._id, data });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Patient header */}
      <div className="card flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#f1f5f9]">{p?.userId?.name}</h1>
          <p className="text-sm text-[#94a3b8] mt-1">{p?.patientId} · Age {p?.age} · {p?.gender} · {p?.bloodGroup}</p>
          <p className="text-xs text-[#94a3b8] mt-0.5">Caretaker: {p?.assignedCaretakerId?.name || '—'}</p>
        </div>
        {latestPred && (
          <div className="text-right">
            <p className="text-xs text-[#94a3b8]">CURRENT RISK</p>
            <p className="text-2xl font-bold" style={{ color: RISK_COLORS[p?.currentRiskLevel] }}>{p?.currentRiskLevel}</p>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[['Vitals Recorded', ad?.vitalsCount], ['Predictions', ad?.predictionsCount], ['Alerts', ad?.alertsCount]].map(([l, v]) => (
          <div key={l} className="card text-center"><p className="text-2xl font-bold text-[#00d4ff]">{v ?? '—'}</p><p className="text-xs text-[#94a3b8]">{l}</p></div>
        ))}
      </div>

      {/* Latest prediction */}
      {latestPred && (
        <Section title="LATEST AI PREDICTION">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xl font-bold" style={{ color: latestPred.predictedDisease === 'Normal' ? '#22c55e' : '#f1f5f9' }}>
                {latestPred.predictedDisease === 'Normal' ? '✓ No Condition Detected' : latestPred.predictedDisease}
              </p>
              <p className="text-xs text-[#94a3b8] mt-0.5">Confidence: {Math.round((latestPred.confidence || 0) * 100)}% · Model: {latestPred.modelUsed}</p>
            </div>
            <span className="text-lg font-bold px-3 py-1 rounded" style={{ color: RISK_COLORS[latestPred.riskLevel], background: RISK_COLORS[latestPred.riskLevel] + '22' }}>
              {latestPred.riskLevel} Risk
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#2d3748] mb-3">
            <div className="h-2 rounded-full" style={{ width: `${Math.round((latestPred.confidence || 0) * 100)}%`, background: RISK_COLORS[latestPred.riskLevel] }} />
          </div>
          <p className="text-xs text-[#94a3b8] italic">{DISCLAIMER}</p>
        </Section>
      )}

      {/* Vital averages */}
      {ad?.vitalAvg && (
        <Section title="VITAL AVERAGES (LAST 30 RECORDS)">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Heart Rate', value: `${ad.vitalAvg.heartRate} bpm`,  normal: ad.vitalAvg.heartRate >= 60 && ad.vitalAvg.heartRate <= 100 },
              { label: 'SpO2',       value: `${ad.vitalAvg.spo2}%`,          normal: ad.vitalAvg.spo2 >= 90 },
              { label: 'Systolic',   value: `${ad.vitalAvg.systolicBP} mmHg`,normal: ad.vitalAvg.systolicBP <= 140 },
              { label: 'Diastolic',  value: `${ad.vitalAvg.diastolicBP} mmHg`,normal: ad.vitalAvg.diastolicBP <= 90 },
              { label: 'Temp',       value: `${ad.vitalAvg.temperature}°C`,  normal: ad.vitalAvg.temperature >= 36.1 && ad.vitalAvg.temperature <= 37.9 },
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

      {/* Care plan */}
      <Section title={`CARE PLAN — ${cp?.status || 'NOT CREATED'}`}>
        {!cp ? (
          <p className="text-[#94a3b8] text-sm">No care plan yet. Submit vitals to auto-generate a draft.</p>
        ) : editingCarePlan ? (
          <div className="flex flex-col gap-4">
            {[
              { key: 'dietaryGuidelines',       label: 'Dietary Guidelines (one per line)' },
              { key: 'activityRecommendations', label: 'Activity Recommendations (one per line)' },
              { key: 'restrictions',            label: 'Restrictions (one per line)' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs text-[#94a3b8] block mb-1">{label}</label>
                <textarea value={carePlanForm[key]} onChange={e => setCarePlanForm(f => ({ ...f, [key]: e.target.value }))}
                  className="input-field resize-none text-sm" rows={3} />
              </div>
            ))}
            <div>
              <label className="text-xs text-[#94a3b8] block mb-1">Follow-up Schedule</label>
              <input value={carePlanForm.followUpSchedule} onChange={e => setCarePlanForm(f => ({ ...f, followUpSchedule: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="text-xs text-[#94a3b8] block mb-1">Doctor Notes</label>
              <textarea value={carePlanForm.doctorNotes} onChange={e => setCarePlanForm(f => ({ ...f, doctorNotes: e.target.value }))}
                className="input-field resize-none" rows={2} />
            </div>
            <div className="flex gap-3">
              <button onClick={saveCarePlan} disabled={updateMutation.isPending} className="btn-primary flex-1">
                {updateMutation.isPending ? 'Saving...' : 'Save Draft'}
              </button>
              <button onClick={() => approveMutation.mutate(cp._id)} disabled={approveMutation.isPending}
                className="flex-1 px-4 py-2 rounded-lg bg-[#22c55e] text-white font-semibold text-sm hover:bg-[#16a34a]">
                {approveMutation.isPending ? 'Approving...' : '✓ Approve Care Plan'}
              </button>
              <button onClick={() => setEditingCarePlan(false)} className="px-4 py-2 rounded-lg border border-[#2d3748] text-[#94a3b8] text-sm">Cancel</button>
            </div>
            <p className="text-xs text-[#94a3b8] italic">{DISCLAIMER}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-semibold px-2 py-0.5 rounded ${cp.status === 'Approved' ? 'bg-[#22c55e22] text-[#22c55e]' : 'bg-[#f59e0b22] text-[#f59e0b]'}`}>
                {cp.status === 'Approved' ? '✓ Approved' : '⏳ Draft — Awaiting Approval'}
              </span>
              <button onClick={startEdit} className="text-xs text-[#00d4ff] hover:underline">
                {cp.status === 'Approved' ? 'Edit & Re-Approve' : 'Edit Care Plan'}
              </button>
            </div>
            {cp.status === 'Draft' && (
              <button onClick={() => approveMutation.mutate(cp._id)} disabled={approveMutation.isPending}
                className="w-full px-4 py-2 rounded-lg bg-[#22c55e] text-white font-semibold text-sm hover:bg-[#16a34a]">
                {approveMutation.isPending ? 'Approving...' : '✓ Approve This Care Plan'}
              </button>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-[#94a3b8] mb-1">Dietary Guidelines</p>{cp.dietaryGuidelines?.map((g, i) => <p key={i} className="text-[#f1f5f9]">• {g}</p>)}</div>
              <div><p className="text-xs text-[#94a3b8] mb-1">Activity</p>{cp.activityRecommendations?.map((a, i) => <p key={i} className="text-[#f1f5f9]">• {a}</p>)}</div>
            </div>
            <p className="text-xs text-[#94a3b8]">Follow-up: {cp.followUpSchedule}</p>
            {cp.doctorNotes && <p className="text-xs text-[#94a3b8]">Notes: {cp.doctorNotes}</p>}
          </div>
        )}
      </Section>

      {/* Alerts */}
      {ald?.alerts?.length > 0 && (
        <Section title="ALERT HISTORY">
          <div className="flex flex-col gap-2">
            {ald.alerts.map(a => (
              <div key={a._id} className="flex items-center justify-between p-2 rounded border border-[#2d3748]">
                <div>
                  <p className="text-xs font-semibold text-[#ef4444]">{a.alertType} — {a.predictedDisease || a.riskLevel}</p>
                  <p className="text-xs text-[#94a3b8]">{formatDateTime(a.createdAt)} · {a.status}</p>
                </div>
                {a.status === 'Active' && (
                  <div className="flex gap-2">
                    <button onClick={() => acknowledgeAlert(a._id).then(() => refetchAlerts())} className="text-xs text-[#f59e0b] hover:underline">Acknowledge</button>
                    <button onClick={() => resolveAlert(a._id).then(() => refetchAlerts())} className="text-xs text-[#22c55e] hover:underline">Resolve</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Caretaker observations */}
      {obsd?.observations?.length > 0 && (
        <Section title="CARETAKER OBSERVATIONS">
          <div className="flex flex-col gap-2">
            {obsd.observations.map(o => (
              <div key={o._id} className="p-2 rounded border border-[#2d3748]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-[#f59e0b]">{o.mood}</span>
                  <span className="text-xs text-[#94a3b8]">{formatDateTime(o.observedAt)} · {o.caretakerId?.name}</span>
                </div>
                <p className="text-sm text-[#f1f5f9]">{o.note}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
