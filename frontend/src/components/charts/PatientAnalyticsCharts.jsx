import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend,
} from 'recharts';
import { formatDateTime } from '../../utils/formatters';

const RISK_NUM  = { Low: 1, Medium: 2, High: 3, Unknown: 0 };
const RISK_COLOR = { High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e', Unknown: '#94a3b8' };
const ALERT_COLORS = { Critical: '#ef4444', Warning: '#f59e0b' };

function RiskHistoryChart({ riskHistory = [] }) {
  const data = riskHistory.map(r => ({
    time: formatDateTime(r.createdAt),
    risk: RISK_NUM[r.riskLevel] ?? 0,
    label: r.riskLevel,
    disease: r.predictedDisease,
    confidence: Math.round((r.confidence || 0) * 100),
  }));

  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    return <circle cx={cx} cy={cy} r={4} fill={RISK_COLOR[payload.label]} stroke="none" />;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{ background: '#1a2234', border: '1px solid #2d3748', borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
        <p style={{ color: '#f1f5f9' }}>{d.time}</p>
        <p style={{ color: RISK_COLOR[d.label] }}>{d.label} Risk</p>
        <p style={{ color: '#94a3b8' }}>{d.disease} · {d.confidence}%</p>
      </div>
    );
  };

  return (
    <div className="card">
      <p className="text-xs font-semibold text-[#94a3b8] mb-3">RISK LEVEL OVER TIME</p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
          <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 9 }} interval="preserveStartEnd" />
          <YAxis domain={[0, 3]} ticks={[1, 2, 3]} tickFormatter={v => ['', 'Low', 'Med', 'High'][v] || ''} tick={{ fill: '#94a3b8', fontSize: 9 }} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="risk" stroke="#6366f1" strokeWidth={2} dot={<CustomDot />} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function AlertTimelineChart({ alertHistory = [] }) {
  const counts = alertHistory.reduce((acc, a) => {
    acc[a.alertType] = (acc[a.alertType] || 0) + 1;
    return acc;
  }, {});
  const data = Object.entries(counts).map(([type, count]) => ({ type, count }));

  return (
    <div className="card">
      <p className="text-xs font-semibold text-[#94a3b8] mb-3">ALERT BREAKDOWN</p>
      {data.length === 0 ? (
        <p className="text-[#94a3b8] text-sm text-center py-6">No alerts recorded.</p>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis dataKey="type" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
            <Tooltip contentStyle={{ background: '#1a2234', border: '1px solid #2d3748', borderRadius: 8, fontSize: 11 }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Alerts">
              {data.map(entry => <Cell key={entry.type} fill={ALERT_COLORS[entry.type] || '#6366f1'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export { RiskHistoryChart, AlertTimelineChart };
