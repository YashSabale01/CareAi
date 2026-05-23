import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getAlerts, acknowledgeAlert, resolveAlert } from '../../api/alert.api';
import { formatDateTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

const STATUS_COLORS = { Active: '#ef4444', Acknowledged: '#f59e0b', Resolved: '#22c55e' };

export default function AlertManager() {
  const qc = useQueryClient();
  const { data, isLoading, refetch } = useQuery({ queryKey: ['all-alerts'], queryFn: () => getAlerts().then(r => r.data) });

  const ackMutation = useMutation({
    mutationFn: acknowledgeAlert,
    onSuccess: () => { toast.success('Alert acknowledged'); refetch(); },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const resMutation = useMutation({
    mutationFn: resolveAlert,
    onSuccess: () => { toast.success('Alert resolved'); refetch(); },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const alerts = data?.alerts || [];
  const active = alerts.filter(a => a.status === 'Active').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#f1f5f9]">Alert Manager</h1>
        {active > 0 && <span className="px-3 py-1 rounded-full bg-[#ef444422] text-[#ef4444] text-sm font-semibold">{active} Active</span>}
      </div>

      {isLoading ? <p className="text-[#94a3b8] text-center py-8">Loading...</p> : (
        <div className="flex flex-col gap-3">
          {alerts.length === 0 && <p className="text-[#94a3b8] text-center py-8">No alerts found</p>}
          {alerts.map(a => (
            <div key={a._id} className="card flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color: STATUS_COLORS[a.status], background: STATUS_COLORS[a.status] + '22' }}>
                    {a.status}
                  </span>
                  <span className="text-xs text-[#94a3b8]">{a.alertType}</span>
                  <span className="text-xs text-[#94a3b8]">{formatDateTime(a.createdAt)}</span>
                </div>
                <p className="text-sm font-semibold text-[#f1f5f9]">{a.predictedDisease || 'Alert'} — {a.riskLevel} Risk</p>
                <p className="text-xs text-[#94a3b8] mt-0.5">{a.message}</p>
                {a.vitalSnapshot && (
                  <p className="text-xs text-[#94a3b8] mt-1">
                    HR: {a.vitalSnapshot.heartRate}bpm · SpO2: {a.vitalSnapshot.spo2}% · BP: {a.vitalSnapshot.systolicBP}/{a.vitalSnapshot.diastolicBP}mmHg · Temp: {a.vitalSnapshot.temperature}°C
                  </p>
                )}
                <Link to={`/doctor/patients/${a.patientId}/analytics`} className="text-xs text-[#00d4ff] hover:underline mt-1 inline-block">
                  View Patient Analytics →
                </Link>
              </div>
              {a.status === 'Active' && (
                <div className="flex flex-col gap-2 shrink-0">
                  <button onClick={() => ackMutation.mutate(a._id)} disabled={ackMutation.isPending}
                    className="px-3 py-1 rounded text-xs bg-[#f59e0b22] text-[#f59e0b] hover:bg-[#f59e0b44]">
                    Acknowledge
                  </button>
                  <button onClick={() => resMutation.mutate(a._id)} disabled={resMutation.isPending}
                    className="px-3 py-1 rounded text-xs bg-[#22c55e22] text-[#22c55e] hover:bg-[#22c55e44]">
                    Resolve
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
