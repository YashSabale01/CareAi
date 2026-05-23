import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axiosInstance';
import { getPatients } from '../../api/patient.api';
import PredictionCard from '../../components/prediction/PredictionCard';
import { VITAL_RANGES, DISCLAIMER } from '../../utils/constants';
import toast from 'react-hot-toast';

const FIELDS = [
  { key: 'heartRate', label: 'Heart Rate (bpm)', type: 'number', ...VITAL_RANGES.heartRate },
  { key: 'spo2', label: 'SpO2 (%)', type: 'number', ...VITAL_RANGES.spo2 },
  { key: 'systolicBP', label: 'Systolic BP (mmHg)', type: 'number', ...VITAL_RANGES.systolicBP },
  { key: 'diastolicBP', label: 'Diastolic BP (mmHg)', type: 'number', ...VITAL_RANGES.diastolicBP },
  { key: 'temperature', label: 'Temperature (°C)', type: 'number', step: '0.1', ...VITAL_RANGES.temperature },
];

export default function AddVitals() {
  const [form, setForm] = useState({ patientId: '', heartRate: '', spo2: '', systolicBP: '', diastolicBP: '', temperature: '', fallDetection: false, notes: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { data: patientsData } = useQuery({ queryKey: ['patients'], queryFn: () => getPatients().then(r => r.data) });

  const getWarning = (key, val) => {
    const r = VITAL_RANGES[key];
    if (!r || !val) return null;
    const v = parseFloat(val);
    if (v < r.min || v > r.max) return `Out of range (${r.min}–${r.max} ${r.unit})`;
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientId) return toast.error('Select a patient');
    setLoading(true);
    setResult(null);
    try {
      const payload = { ...form, heartRate: +form.heartRate, spo2: +form.spo2, systolicBP: +form.systolicBP, diastolicBP: +form.diastolicBP, temperature: +form.temperature };
      const { data } = await api.post('/api/predictions/predict', payload);
      setResult(data);
      toast.success('Prediction complete!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Prediction failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-[#f1f5f9]">Add Vitals & Get Prediction</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="card flex flex-col gap-4">
          <div>
            <label className="text-sm text-[#94a3b8] block mb-1">Patient</label>
            <select value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))} className="input-field" required>
              <option value="">Select patient...</option>
              {patientsData?.patients?.map(p => <option key={p._id} value={p._id} className="bg-[#1a2234]">{p.userId?.name} ({p.patientId})</option>)}
            </select>
          </div>

          {FIELDS.map(({ key, label, type, step, min, max, unit }) => {
            const warn = getWarning(key, form[key]);
            return (
              <div key={key}>
                <label className="text-sm text-[#94a3b8] block mb-1">{label}</label>
                <input type={type} step={step || '1'} value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className={`input-field ${warn ? 'border-[#f59e0b]' : ''}`}
                  placeholder={`${min}–${max} ${unit}`} required />
                {warn && <p className="text-xs text-[#f59e0b] mt-0.5">⚠ {warn}</p>}
              </div>
            );
          })}

          <label className="flex items-center gap-2 text-sm text-[#94a3b8] cursor-pointer">
            <input type="checkbox" checked={form.fallDetection} onChange={e => setForm(f => ({ ...f, fallDetection: e.target.checked }))} className="w-4 h-4" />
            Fall Detection
          </label>

          <div>
            <label className="text-sm text-[#94a3b8] block mb-1">Notes (optional)</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="input-field resize-none" rows={2} placeholder="Clinical notes..." />
          </div>

          <button type="submit" disabled={loading} className="btn-primary py-2.5">
            {loading ? '🤖 Analyzing...' : '🤖 Predict Disease'}
          </button>
          <p className="text-xs text-[#94a3b8] italic">{DISCLAIMER}</p>
        </form>

        <div>
          {result ? (
            <div className="flex flex-col gap-4">
              <PredictionCard prediction={{ ...result.prediction, ...result.mlResult, classProbabilities: result.mlResult?.class_probabilities, shapValues: result.mlResult?.shap_values, modelUsed: result.mlResult?.model_used }} />
              {result.alertTriggered && (
                <div className="card border-[#ef4444] border">
                  <p className="text-sm font-semibold text-[#ef4444]">🚨 Alert Dispatched</p>
                  <p className="text-xs text-[#94a3b8] mt-1">Doctor and caretaker have been notified.</p>
                </div>
              )}
              {result.carePlan && (
                <div className="card">
                  <p className="text-sm font-semibold text-[#f1f5f9] mb-2">📋 Generated Care Plan</p>
                  <p className="text-xs text-[#94a3b8]">Follow-up: {result.carePlan.followUpSchedule}</p>
                  <p className="text-xs text-[#94a3b8] mt-1">Dietary: {result.carePlan.dietaryGuidelines?.slice(0, 2).join(', ')}...</p>
                  <p className="text-xs text-[#94a3b8] italic mt-2">{DISCLAIMER}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center h-64 text-center">
              <div className="text-5xl mb-4">🤖</div>
              <p className="text-[#94a3b8]">Fill in vitals and submit to get AI prediction</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
