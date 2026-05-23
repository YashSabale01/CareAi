export const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
export const formatDateTime = (d) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
export const formatConfidence = (c) => `${(c * 100).toFixed(1)}%`;
export const riskColor = (r) => ({ High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e' }[r] || '#94a3b8');
export const riskBg = (r) => ({ High: 'rgba(239,68,68,0.15)', Medium: 'rgba(245,158,11,0.15)', Low: 'rgba(34,197,94,0.15)' }[r] || 'transparent');
