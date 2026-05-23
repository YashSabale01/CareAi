import { useQuery } from '@tanstack/react-query';
import { getPatients } from '../../api/patient.api';
import { getAlertsByPatient } from '../../api/alert.api';
import { formatDateTime } from '../../utils/formatters';

const STATUS_COLORS = { Active: '#ef4444', Acknowledged: '#f59e0b', Resolved: '#22c55e' };

function PatientAlerts({ patient }) {
  const { data } = useQuery({
    queryKey: ['patient-alerts', patient._id],
    queryFn: () => getAlertsByPatient(patient._id).then(r => r.data),
  });
  const alerts = data?.alerts || [];
  if (alerts.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-[#94a3b8] mb-2">{patient.userId?.name} ({patient.patientId})</p>
      {alerts.map(a => (
        <div key={a._id} className="p-2 rounded border border-[#2d3748] mb-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold" style={{ color: STATUS_COLORS[a.status] }}>{a.status}</span>
            <span className="text-xs text-[#94a3b8]">{formatDateTime(a.createdAt)}</span>
          </div>
          <p className="text-sm text-[#f1f5f9]">{a.predictedDisease || a.alertType} — {a.riskLevel} Risk</p>
          <p className="text-xs text-[#94a3b8] mt-0.5">{a.message}</p>
          {a.status === 'Active' && (
            <p className="text-xs text-[#f59e0b] mt-1">⚠ Awaiting doctor acknowledgement</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default function CaretakerAlerts() {
  const { data, isLoading } = useQuery({ queryKey: ['my-patients'], queryFn: () => getPatients().then(r => r.data) });
  const patients = data?.patients || [];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[#f1f5f9]">Alerts</h1>
      <p className="text-sm text-[#94a3b8]">Alerts for your assigned patients. Only doctors can acknowledge or resolve alerts.</p>
      {isLoading ? <p className="text-[#94a3b8] text-center py-8">Loading...</p> : (
        <div className="card flex flex-col gap-4">
          {patients.length === 0 && <p className="text-[#94a3b8] text-center py-8">No patients assigned</p>}
          {patients.map(p => <PatientAlerts key={p._id} patient={p} />)}
        </div>
      )}
    </div>
  );
}
