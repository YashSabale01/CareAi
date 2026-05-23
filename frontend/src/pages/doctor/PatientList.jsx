import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getPatients } from '../../api/patient.api';
import { Table } from '../../components/ui/index.jsx';
import { formatDate } from '../../utils/formatters';

const RISK_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e', Unknown: '#94a3b8' };

export default function PatientList() {
  const { data, isLoading } = useQuery({ queryKey: ['my-patients'], queryFn: () => getPatients().then(r => r.data) });

  const columns = [
    { key: 'patientId', label: 'Patient ID' },
    { key: 'name',      label: 'Name',       render: r => r.userId?.name || '—' },
    { key: 'age',       label: 'Age',        render: r => r.age || '—' },
    { key: 'gender',    label: 'Gender',     render: r => r.gender || '—' },
    { key: 'risk',      label: 'Risk',       render: r => (
      <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color: RISK_COLORS[r.currentRiskLevel], background: RISK_COLORS[r.currentRiskLevel] + '22' }}>
        {r.currentRiskLevel}
      </span>
    )},
    { key: 'caretaker', label: 'Caretaker',  render: r => r.assignedCaretakerId?.name || '—' },
    { key: 'createdAt', label: 'Registered', render: r => formatDate(r.createdAt) },
    { key: 'actions',   label: '',           render: r => (
      <Link to={`/doctor/patients/${r._id}/analytics`} className="text-[#00d4ff] text-xs hover:underline">Review Analytics →</Link>
    )},
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[#f1f5f9]">My Patients</h1>
      <div className="card">
        {isLoading ? <p className="text-[#94a3b8] text-center py-8">Loading...</p>
          : <Table columns={columns} data={data?.patients || []} emptyMsg="No patients assigned" />}
      </div>
    </div>
  );
}
