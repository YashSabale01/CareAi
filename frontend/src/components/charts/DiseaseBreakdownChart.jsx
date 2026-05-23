import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DiseaseBreakdownChart({ data = [] }) {
  const chartData = data.map(d => ({ name: d._id?.split(' ')[0] || d._id, count: d.count }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <Tooltip contentStyle={{ background: '#1a2234', border: '1px solid #2d3748', borderRadius: 8 }} />
        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Predictions" />
      </BarChart>
    </ResponsiveContainer>
  );
}
