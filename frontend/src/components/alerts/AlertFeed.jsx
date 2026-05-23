import { riskColor } from '../../utils/formatters';
import { formatDateTime } from '../../utils/formatters';

export function AlertBanner({ alert, onAcknowledge, onResolve }) {
  const typeColor = { Critical: '#ef4444', Warning: '#f59e0b', Info: '#00d4ff' };
  const color = typeColor[alert.alertType] || '#94a3b8';
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border" style={{ borderColor: `${color}44`, background: `${color}11` }}>
      <span className="text-lg">{alert.alertType === 'Critical' ? '🚨' : alert.alertType === 'Warning' ? '⚠️' : 'ℹ️'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color }}>{alert.alertType}</p>
        <p className="text-xs text-[#94a3b8] mt-0.5 truncate">{alert.message}</p>
        <p className="text-xs text-[#94a3b8]">{formatDateTime(alert.createdAt)}</p>
      </div>
      {alert.status === 'Active' && (
        <div className="flex gap-2 shrink-0">
          {onAcknowledge && <button onClick={() => onAcknowledge(alert._id)} className="text-xs px-2 py-1 rounded bg-[#f59e0b22] text-[#f59e0b] hover:opacity-80">ACK</button>}
          {onResolve && <button onClick={() => onResolve(alert._id)} className="text-xs px-2 py-1 rounded bg-[#22c55e22] text-[#22c55e] hover:opacity-80">Resolve</button>}
        </div>
      )}
    </div>
  );
}

export function AlertFeed({ alerts = [], onAcknowledge, onResolve }) {
  if (!alerts.length) return <p className="text-sm text-[#94a3b8] text-center py-4">No active alerts</p>;
  return (
    <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
      {alerts.map(a => <AlertBanner key={a._id} alert={a} onAcknowledge={onAcknowledge} onResolve={onResolve} />)}
    </div>
  );
}
