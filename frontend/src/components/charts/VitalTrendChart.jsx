import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from 'recharts';
import { formatDateTime } from '../../utils/formatters';

const VITALS_CONFIG = [
  { key: 'heartRate',   label: 'Heart Rate (bpm)',   color: '#00d4ff', refLow: 60,   refHigh: 100  },
  { key: 'spo2',        label: 'SpO2 (%)',            color: '#22c55e', refLow: 90,   refHigh: null },
  { key: 'systolicBP',  label: 'Systolic BP (mmHg)', color: '#ef4444', refLow: null, refHigh: 140  },
  { key: 'diastolicBP', label: 'Diastolic BP (mmHg)',color: '#f97316', refLow: null, refHigh: 90   },
  { key: 'temperature', label: 'Temperature (°C)',   color: '#f59e0b', refLow: 36.1, refHigh: 37.9 },
];

function SingleVitalChart({ records, config }) {
  const data = [...records].reverse().map(r => ({
    time: formatDateTime(r.recordedAt),
    value: r[config.key],
  }));

  return (
    <div className="card">
      <p className="text-xs font-semibold text-[#94a3b8] mb-3">{config.label}</p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
          <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 9 }} interval="preserveStartEnd" />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} />
          <Tooltip
            contentStyle={{ background: '#1a2234', border: '1px solid #2d3748', borderRadius: 8, fontSize: 11 }}
            labelStyle={{ color: '#f1f5f9' }}
          />
          {config.refHigh && <ReferenceLine y={config.refHigh} stroke="#ef444466" strokeDasharray="4 4" label={{ value: 'High', fill: '#ef4444', fontSize: 9 }} />}
          {config.refLow  && <ReferenceLine y={config.refLow}  stroke="#f59e0b66" strokeDasharray="4 4" label={{ value: 'Low',  fill: '#f59e0b', fontSize: 9 }} />}
          <Line type="monotone" dataKey="value" stroke={config.color} dot={false} strokeWidth={2} name={config.label} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function VitalTrendChart({ records = [] }) {
  if (!records.length) return <p className="text-[#94a3b8] text-sm text-center py-6">No vitals recorded yet.</p>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {VITALS_CONFIG.map(cfg => (
        <SingleVitalChart key={cfg.key} records={records} config={cfg} />
      ))}
    </div>
  );
}
