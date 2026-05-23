import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getPatients } from '../../api/patient.api';
import { submitVitals } from '../../api/vitals.api';
import { VITAL_RANGES, DISCLAIMER } from '../../utils/constants';
import toast from 'react-hot-toast';

const FIELDS = [
  { key: 'heartRate',   label: 'Heart Rate (bpm)',          step: '1',   ...VITAL_RANGES.heartRate },
  { key: 'spo2',        label: 'SpO2 (%)',                  step: '1',   ...VITAL_RANGES.spo2 },
  { key: 'systolicBP',  label: 'Systolic BP (mmHg)',        step: '1',   ...VITAL_RANGES.systolicBP },
  { key: 'diastolicBP', label: 'Diastolic BP (mmHg)',       step: '1',   ...VITAL_RANGES.diastolicBP },
  { key: 'temperature', label: 'Body Temperature (°C)',     step: '0.1', ...VITAL_RANGES.temperature },
];

const RISK_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e' };

function fieldStatus(key, val) {
  const r = VITAL_RANGES[key];
  if (!r || val === '') return 'empty';
  const v = parseFloat(val);
  if (v < r.min || v > r.max) return 'error';
  const warn = { heartRate: [60, 100], spo2: [95, 100], systolicBP: [90, 140], diastolicBP: [60, 90], temperature: [36.1, 37.5] };
  const [lo, hi] = warn[key] || [r.min, r.max];
  if (v < lo || v > hi) return 'warning';
  return 'ok';
}

export default function EnterVitals() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    patientId: searchParams.get('patientId') || '',
    heartRate: '', spo2: '', systolicBP: '', diastolicBP: '',
    temperature: '', fallDetection: false, notes: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: patientsData } = useQuery({
    queryKey: ['my-patients'],
    queryFn: () => getPatients().then(r => r.data),
  });

  const selectedPatient = patientsData?.patients?.find(p => p._id === form.patientId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientId) return toast.error('Select a patient first');
    setLoading(true);
    setResult(null);
    try {
      const payload = {
        ...form,
        heartRate:   +form.heartRate,
        spo2:        +form.spo2,
        systolicBP:  +form.systolicBP,
        diastolicBP: +form.diastolicBP,
        temperature: +form.temperature,
      };
      const { data } = await submitVitals(payload);
      setResult(data);
      toast.success('Vitals submitted and AI analysis complete!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally { setLoading(false); }
  };

  if (result) {
    const { prediction, carePlan, alertTriggered } = result;
    const riskColor = RISK_COLORS[prediction.riskLevel] || '#94a3b8';
    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-[#f1f5f9]">AI Analysis Result</h1>

        {alertTriggered && (
          <div className="card border-2 border-[#ef4444] bg-[#ef444411]">
            <p className="text-lg font-bold text-[#ef4444]">🚨 HIGH RISK — EMERGENCY ALERT SENT</p>
            <p className="text-sm text-[#94a3b8] mt-1">
              Dr. {selectedPatient?.assignedDoctorId?.name || 'assigned doctor'} has been notified via email and in-app alert.
            </p>
          </div>
        )}

        <div className="card flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#94a3b8]">PREDICTED DISEASE</p>
              <p className="text-2xl font-bold text-[#f1f5f9]">{prediction.predictedDisease}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#94a3b8]">RISK LEVEL</p>
              <p className="text-2xl font-bold" style={{ color: riskColor }}>{prediction.riskLevel}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-[#94a3b8] mb-1">CONFIDENCE — {Math.round((prediction.confidence || 0) * 100)}%</p>
            <div className="h-2 rounded-full bg-[#2d3748]">
              <div className="h-2 rounded-full transition-all" style={{ width: `${Math.round((prediction.confidence || 0) * 100)}%`, background: riskColor }} />
            </div>
          </div>

          {prediction.alerts && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Heart Rate', val: prediction.alerts.heart_rate || prediction.alerts.heartRate },
                { label: 'SpO2',       val: prediction.alerts.spo2 },
                { label: 'Blood Pressure', val: prediction.alerts.blood_pressure || prediction.alerts.bloodPressure },
                { label: 'Temperature',    val: prediction.alerts.temperature },
              ].map(({ label, val }) => (
                <div key={label} className={`p-2 rounded text-center text-xs ${val && val !== 'Normal' ? 'bg-[#ef444422] text-[#ef4444]' : 'bg-[#22c55e22] text-[#22c55e]'}`}>
                  <p className="font-semibold">{val || 'Normal'}</p>
                  <p className="text-[10px] mt-0.5 opacity-70">{label}</p>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-[#94a3b8] italic border-t border-[#2d3748] pt-3">{DISCLAIMER}</p>
        </div>

        {carePlan && (
          <div className="card">
            <p className="text-sm font-semibold text-[#f1f5f9] mb-1">📋 Care Plan Draft Created</p>
            <p className="text-xs text-[#94a3b8]">Status: <span className="text-[#f59e0b]">Pending Doctor Approval</span></p>
            <p className="text-xs text-[#94a3b8] mt-1">Follow-up: {carePlan.riskLevel === 'High' ? 'Every 1–2 weeks' : 'Every 4–8 weeks'}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => { setResult(null); setForm(f => ({ ...f, heartRate: '', spo2: '', systolicBP: '', diastolicBP: '', temperature: '', fallDetection: false, notes: '' })); }}
            className="btn-primary flex-1">Enter More Vitals</button>
          <button onClick={() => navigate('/caretaker')} className="flex-1 px-4 py-2 rounded-lg border border-[#2d3748] text-[#94a3b8] hover:text-[#f1f5f9] text-sm">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-[#f1f5f9]">Enter Patient Vitals</h1>

      <form onSubmit={handleSubmit} className="card flex flex-col gap-5">
        {/* Patient selection */}
        <div>
          <label className="text-sm text-[#94a3b8] block mb-1">Patient *</label>
          <select value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))}
            className="input-field" required>
            <option value="">Select assigned patient...</option>
            {patientsData?.patients?.map(p => (
              <option key={p._id} value={p._id} className="bg-[#1a2234]">
                {p.userId?.name} ({p.patientId}) — Risk: {p.currentRiskLevel}
              </option>
            ))}
          </select>
          {selectedPatient && (
            <p className="text-xs text-[#94a3b8] mt-1">
              Age {selectedPatient.age} · {selectedPatient.gender} · Dr. {selectedPatient.assignedDoctorId?.name || '—'}
            </p>
          )}
        </div>

        {/* Vital fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FIELDS.map(({ key, label, step, min, max, unit }) => {
            const status = fieldStatus(key, form[key]);
            return (
              <div key={key}>
                <label className="text-sm text-[#94a3b8] block mb-1">{label}</label>
                <input
                  type="number" step={step} value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className={`input-field ${status === 'error' ? 'border-[#ef4444]' : status === 'warning' ? 'border-[#f59e0b]' : status === 'ok' ? 'border-[#22c55e]' : ''}`}
                  placeholder={`${min}–${max} ${unit}`} required
                />
                {status === 'error'   && <p className="text-xs text-[#ef4444] mt-0.5">⛔ Out of range ({min}–{max} {unit})</p>}
                {status === 'warning' && <p className="text-xs text-[#f59e0b] mt-0.5">⚠ Approaching threshold</p>}
                {status === 'ok'      && <p className="text-xs text-[#22c55e] mt-0.5">✓ Normal range</p>}
              </div>
            );
          })}
        </div>

        {/* Fall detection */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div className={`w-10 h-5 rounded-full transition-colors ${form.fallDetection ? 'bg-[#ef4444]' : 'bg-[#2d3748]'}`}
            onClick={() => setForm(f => ({ ...f, fallDetection: !f.fallDetection }))}>
            <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${form.fallDetection ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
          <span className="text-sm text-[#94a3b8]">Fall Detection {form.fallDetection ? <span className="text-[#ef4444]">— DETECTED</span> : '— None'}</span>
        </label>

        {/* Notes */}
        <div>
          <label className="text-sm text-[#94a3b8] block mb-1">Clinical Notes (optional)</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            className="input-field resize-none" rows={2} placeholder="Any observations..." />
        </div>

        <button type="submit" disabled={loading} className="btn-primary py-3 text-base font-semibold">
          {loading ? '🤖 Analyzing vitals with AI...' : '🤖 Submit Vitals & Get AI Prediction'}
        </button>
        <p className="text-xs text-[#94a3b8] italic">{DISCLAIMER}</p>
      </form>
    </div>
  );
}
