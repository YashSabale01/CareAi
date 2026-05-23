import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getPatients } from '../../api/patient.api';
import { getCarePlanByPatient } from '../../api/careplan.api';
import { formatDate } from '../../utils/formatters';

// Shows all patients with their care plan status
function PatientCarePlanRow({ patient }) {
  const { data } = useQuery({
    queryKey: ['careplan', patient._id],
    queryFn: () => getCarePlanByPatient(patient._id).then(r => r.data).catch(() => null),
  });
  const cp = data?.carePlan;

  return (
    <tr className="border-b border-[#2d3748] hover:bg-[#1f2d3d]">
      <td className="py-2 pr-4">
        <p className="text-sm text-[#f1f5f9] font-medium">{patient.userId?.name}</p>
        <p className="text-xs text-[#94a3b8]">{patient.patientId}</p>
      </td>
      <td className="py-2 pr-4 text-sm text-[#94a3b8]">{cp?.predictedDisease || '—'}</td>
      <td className="py-2 pr-4">
        {cp ? (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${cp.status === 'Approved' ? 'bg-[#22c55e22] text-[#22c55e]' : 'bg-[#f59e0b22] text-[#f59e0b]'}`}>
            {cp.status}
          </span>
        ) : <span className="text-xs text-[#94a3b8]">No plan</span>}
      </td>
      <td className="py-2 pr-4 text-xs text-[#94a3b8]">{cp ? formatDate(cp.updatedAt) : '—'}</td>
      <td className="py-2">
        <Link to={`/doctor/patients/${patient._id}/analytics`} className="text-xs text-[#00d4ff] hover:underline">
          {cp?.status === 'Draft' ? 'Review & Approve →' : 'View →'}
        </Link>
      </td>
    </tr>
  );
}

export default function CarePlanManager() {
  const { data, isLoading } = useQuery({ queryKey: ['my-patients'], queryFn: () => getPatients().then(r => r.data) });
  const patients = data?.patients || [];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[#f1f5f9]">Care Plans</h1>
      <p className="text-sm text-[#94a3b8]">Review and approve auto-generated care plan drafts for your patients.</p>
      <div className="card overflow-x-auto">
        {isLoading ? <p className="text-[#94a3b8] text-center py-8">Loading...</p> : (
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-[#94a3b8] border-b border-[#2d3748]">
              <th className="text-left pb-2 pr-4">Patient</th>
              <th className="text-left pb-2 pr-4">Disease</th>
              <th className="text-left pb-2 pr-4">Status</th>
              <th className="text-left pb-2 pr-4">Last Updated</th>
              <th className="text-left pb-2">Action</th>
            </tr></thead>
            <tbody>
              {patients.map(p => <PatientCarePlanRow key={p._id} patient={p} />)}
              {patients.length === 0 && <tr><td colSpan={5} className="text-center text-[#94a3b8] py-8">No patients assigned</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
