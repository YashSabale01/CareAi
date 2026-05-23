import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e' };

export default function RiskDistributionChart({ data = [] }) {
  const chartData = data.map(d => ({ name: d._id, value: d.count }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
          {chartData.map((entry) => <Cell key={entry.name} fill={COLORS[entry.name] || '#6366f1'} />)}
        </Pie>
        <Tooltip contentStyle={{ background: '#1a2234', border: '1px solid #2d3748', borderRadius: 8 }} />
        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
