import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AlertTimelineChart({ byType = [], byStatus = [] }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-xs text-[#94a3b8] mb-2">By Type</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={byType.map(d => ({ name: d._id, count: d.count }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <Tooltip contentStyle={{ background: '#1a2234', border: '1px solid #2d3748', borderRadius: 8 }} />
            <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div>
        <p className="text-xs text-[#94a3b8] mb-2">By Status</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={byStatus.map(d => ({ name: d._id, count: d.count }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <Tooltip contentStyle={{ background: '#1a2234', border: '1px solid #2d3748', borderRadius: 8 }} />
            <Bar dataKey="count" fill="#00d4ff" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
