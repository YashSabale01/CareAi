import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axiosInstance';
import { getPatients } from '../../api/patient.api';
import { VITAL_RANGES, VITAL_NORMAL, DISCLAIMER } from '../../utils/constants';
import toast from 'react-hot-toast';

const FIELDS = [
  { key: 'age',          label: 'Age (years)',          step: '1'   },
  { key: 'heartRate',    label: 'Heart Rate (bpm)',      step: '1'   },
  { key: 'systolicBP',   label: 'Systolic BP (mmHg)',    step: '1'   },
  { key: 'diastolicBP',  label: 'Diastolic BP (mmHg)',   step: '1'   },
  { key: 'spo2',         label: 'SpO2 (%)',              step: '0.1' },
  { key: 'glucoseLevel', label: 'Glucose Level (mg/dL)', step: '1'   },
  { key: 'temperature',  label: 'Temperature (°F)',      step: '0.1' },
  { key: 'cholesterol',  label: 'Cholesterol (mg/dL)',   step: '1'   },
  { key: 'bmi',          label: 'BMI (kg/m²)',           step: '0.1' },
];

const RISK_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e' };

const ALERT_LABELS = {
  heart_rate: 'Heart Rate', spo2: 'SpO2', blood_pressure: 'Blood Pressure',
  temperature: 'Temperature', glucose: 'Glucose', cholesterol: 'Cholesterol', bmi: 'BMI',
};

const INIT_FORM = {
  patientId: '', age: '', heartRate: '', systolicBP: '', diastolicBP: '',
  spo2: '', glucoseLevel: '', temperature: '', cholesterol: '', bmi: '', notes: '',
};

function getWarning(key, val) {
  const r = VITAL_RANGES[key];
  if (!r || !val) return null;
  const v = parseFloat(val);
  if (v < r.min || v > r.max) return `Out of range (${r.min}–${r.max} ${r.unit})`;
  const n = VITAL_NORMAL[key];
  if (n && (v < n[0] || v > n[1])) return `Outside normal (${n[0]}–${n[1]} ${r.unit})`;
  return null;
}

export default function AddVitals() {
  const [form, setForm] = useState(INIT_FORM);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { data: patientsData } = useQuery({ queryKey: ['patients'], queryFn: () => getPatients().then(r => r.data) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientId) return toast.error('Select a patient');
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
        temperature:  +form.temperature,
        cholesterol:  +form.cholesterol,
        bmi:          +form.bmi,
      };
      const { data } = await api.post('/api/predictions/predict', payload);
      setResult(data);
      toast.success('Risk assessment complete!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Prediction failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-[#f1f5f9]">Add Vitals & Get Risk Assessment</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="card flex flex-col gap-4">
          <div>
            <label className="text-sm text-[#94a3b8] block mb-1">Patient</label>
            <select value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))} className="input-field" required>
              <option value="">Select patient...</option>
              {patientsData?.patients?.map(p => <option key={p._id} value={p._id} className="bg-[#1a2234]">{p.userId?.name} ({p.patientId})</option>)}
            </select>
          </div>

          {FIELDS.map(({ key, label, step }) => {
            const { min, max, unit } = VITAL_RANGES[key];
            const warn = getWarning(key, form[key]);
            return (
              <div key={key}>
                <label className="text-sm text-[#94a3b8] block mb-1">{label}</label>
                <input type="number" step={step} value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className={`input-field ${warn ? 'border-[#f59e0b]' : ''}`}
                  placeholder={`${min}–${max} ${unit}`} required />
                {warn && <p className="text-xs text-[#f59e0b] mt-0.5">⚠ {warn}</p>}
              </div>
            );
          })}

          <div>
            <label className="text-sm text-[#94a3b8] block mb-1">Notes (optional)</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="input-field resize-none" rows={2} placeholder="Clinical notes..." />
          </div>

          <button type="submit" disabled={loading} className="btn-primary py-2.5">
            {loading ? '🤖 Analyzing...' : '🤖 Assess Clinical Risk'}
          </button>
          <p className="text-xs text-[#94a3b8] italic">{DISCLAIMER}</p>
        </form>

        <div>
          {result ? (
            <div className="flex flex-col gap-4">
              <div className="card flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#94a3b8]">CLINICAL RISK LEVEL</p>
                    <p className="text-3xl font-bold" style={{ color: RISK_COLORS[result.risk_level] }}>{result.risk_level}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#94a3b8]">CONFIDENCE</p>
                    <p className="text-2xl font-bold text-[#f1f5f9]">{Math.round((result.confidence || 0) * 100)}%</p>
                    <p className="text-xs text-[#94a3b8]">{result.confidence_label}</p>
                  </div>
                </div>

                <div className="h-2 rounded-full bg-[#2d3748]">
                  <div className="h-2 rounded-full" style={{ width: `${Math.round((result.confidence || 0) * 100)}%`, background: RISK_COLORS[result.risk_level] }} />
                </div>

                {result.alerts && (
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(ALERT_LABELS).map(([key, label]) => {
                      const val = result.alerts[key] || 'Normal';
                      const isNormal = val === 'Normal';
                      return (
                        <div key={key} className={`p-2 rounded text-center text-xs ${!isNormal ? 'bg-[#ef444422] text-[#ef4444]' : 'bg-[#22c55e22] text-[#22c55e]'}`}>
                          <p className="font-semibold">{val}</p>
                          <p className="text-[10px] mt-0.5 opacity-70">{label}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                <p className="text-xs text-[#94a3b8] italic border-t border-[#2d3748] pt-3">{DISCLAIMER}</p>
              </div>

              {result.alertTriggered && (
                <div className="card border-[#ef4444] border">
                  <p className="text-sm font-semibold text-[#ef4444]">🚨 Alert Dispatched</p>
                  <p className="text-xs text-[#94a3b8] mt-1">Doctor and caretaker have been notified.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center h-64 text-center">
              <div className="text-5xl mb-4">🤖</div>
              <p className="text-[#94a3b8]">Fill in vitals and submit to get AI risk assessment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
