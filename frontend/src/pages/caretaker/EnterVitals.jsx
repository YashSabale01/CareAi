import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getPatients } from '../../api/patient.api';
import { submitVitals } from '../../api/vitals.api';
import { VITAL_RANGES, VITAL_NORMAL, DISCLAIMER } from '../../utils/constants';
import toast from 'react-hot-toast';

const FIELDS = [
  { key: 'age',          label: 'Age (years)',              step: '1',   },
  { key: 'heartRate',    label: 'Heart Rate (bpm)',          step: '1',   },
  { key: 'systolicBP',   label: 'Systolic BP (mmHg)',        step: '1',   },
  { key: 'diastolicBP',  label: 'Diastolic BP (mmHg)',       step: '1',   },
  { key: 'spo2',         label: 'SpO2 (%)',                  step: '0.1', },
  { key: 'glucoseLevel', label: 'Glucose Level (mg/dL)',     step: '1',   },
  { key: 'temperature',  label: 'Body Temperature (°C)',     step: '0.1', },
  { key: 'cholesterol',  label: 'Cholesterol (mg/dL)',       step: '1',   },
  { key: 'bmi',          label: 'BMI (kg/m²)',               step: '0.1', },
];

const RISK_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e' };

const ALERT_LABELS = {
  heart_rate: 'Heart Rate', spo2: 'SpO2', blood_pressure: 'Blood Pressure',
  temperature: 'Temperature', glucose: 'Glucose', cholesterol: 'Cholesterol', bmi: 'BMI',
};

function fieldStatus(key, val) {
  const r = VITAL_RANGES[key];
  const n = VITAL_NORMAL[key];
  if (!r || val === '') return 'empty';
  const v = parseFloat(val);
  if (v < r.min || v > r.max) return 'error';
  if (!n) return 'ok';
  if (v < n[0] || v > n[1]) return 'warning';
  return 'ok';
}

const INIT_FORM = {
  patientId: '', age: '', heartRate: '', systolicBP: '', diastolicBP: '',
  spo2: '', glucoseLevel: '', temperature: '', cholesterol: '', bmi: '', notes: '',
};

export default function EnterVitals() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...INIT_FORM, patientId: searchParams.get('patientId') || '' });
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
        age:          +form.age,
        heartRate:    +form.heartRate,
        systolicBP:   +form.systolicBP,
        diastolicBP:  +form.diastolicBP,
        spo2:         +form.spo2,
        glucoseLevel: +form.glucoseLevel,
        temperature:  +(+form.temperature * 9/5 + 32).toFixed(1),
        cholesterol:  +form.cholesterol,
        bmi:          +form.bmi,
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
    const alerts = prediction.alerts || {};

    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-[#f1f5f9]">AI Risk Analysis Result</h1>

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
              <p className="text-xs text-[#94a3b8]">CLINICAL RISK LEVEL</p>
              <p className="text-3xl font-bold" style={{ color: riskColor }}>{prediction.riskLevel}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#94a3b8]">CONFIDENCE</p>
              <p className="text-2xl font-bold text-[#f1f5f9]">{Math.round((prediction.confidence || 0) * 100)}%</p>
              <p className="text-xs text-[#94a3b8]">{prediction.confidenceLabel}</p>
            </div>
          </div>

          <div>
            <div className="h-2 rounded-full bg-[#2d3748]">
              <div className="h-2 rounded-full transition-all" style={{ width: `${Math.round((prediction.confidence || 0) * 100)}%`, background: riskColor }} />
            </div>
          </div>

          {/* Vital alerts grid */}
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(ALERT_LABELS).map(([key, label]) => {
              const val = alerts[key] || alerts[key.replace('_', '')] || 'Normal';
              const isNormal = val === 'Normal';
              return (
                <div key={key} className={`p-2 rounded text-center text-xs ${!isNormal ? 'bg-[#ef444422] text-[#ef4444]' : 'bg-[#22c55e22] text-[#22c55e]'}`}>
                  <p className="font-semibold">{val}</p>
                  <p className="text-[10px] mt-0.5 opacity-70">{label}</p>
                </div>
              );
            })}
          </div>

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
          <button onClick={() => { setResult(null); setForm(f => ({ ...INIT_FORM, patientId: f.patientId })); }}
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
              {selectedPatient.gender} · Dr. {selectedPatient.assignedDoctorId?.name || '—'}
            </p>
          )}
        </div>

        {/* Vital fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FIELDS.map(({ key, label, step }) => {
            const { min, max, unit } = VITAL_RANGES[key];
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

        {/* Notes */}
        <div>
          <label className="text-sm text-[#94a3b8] block mb-1">Clinical Notes (optional)</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            className="input-field resize-none" rows={2} placeholder="Any observations..." />
        </div>

        <button type="submit" disabled={loading} className="btn-primary py-3 text-base font-semibold">
          {loading ? '🤖 Analyzing vitals with AI...' : '🤖 Submit Vitals & Get AI Risk Assessment'}
        </button>
        <p className="text-xs text-[#94a3b8] italic">{DISCLAIMER}</p>
      </form>
    </div>
  );
}
