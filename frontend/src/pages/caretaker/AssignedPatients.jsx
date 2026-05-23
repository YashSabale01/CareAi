import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getPatients } from '../../api/patient.api';

const RISK_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e', Unknown: '#94a3b8' };

export default function AssignedPatients() {
  const { data, isLoading } = useQuery({ queryKey: ['my-patients'], queryFn: () => getPatients().then(r => r.data) });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[#f1f5f9]">Assigned Patients</h1>
      {isLoading ? <p className="text-[#94a3b8] text-center py-8">Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.patients?.map(p => (
            <div key={p._id} className="card flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-[#f1f5f9]">{p.userId?.name}</p>
                  <p className="text-xs text-[#94a3b8] mt-0.5">{p.patientId} · {p.gender || '—'} · Age {p.age || '—'}</p>
                  <p className="text-xs text-[#94a3b8]">Dr. {p.assignedDoctorId?.name || '—'}</p>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color: RISK_COLORS[p.currentRiskLevel], background: RISK_COLORS[p.currentRiskLevel] + '22' }}>
                  {p.currentRiskLevel}
                </span>
              </div>
              <div className="flex gap-2">
                <Link to={`/caretaker/vitals?patientId=${p._id}`} className="btn-primary text-center text-sm py-1.5 flex-1">
                  ➕ Enter Vitals
                </Link>
                <Link to={`/caretaker/patients/${p._id}/analytics`} className="flex-1 text-center text-sm py-1.5 rounded-lg border border-[#2d3748] text-[#00d4ff] hover:bg-[#1f2d3d]">
                  📊 Analytics
                </Link>
              </div>
            </div>
          ))}
          {!data?.patients?.length && (
            <p className="text-[#94a3b8] col-span-3 text-center py-8">No patients assigned. Contact admin.</p>
          )}
        </div>
      )}
    </div>
  );
}
