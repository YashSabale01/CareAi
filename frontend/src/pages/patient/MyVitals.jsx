import { useQuery } from '@tanstack/react-query';
import api from '../../api/axiosInstance';
import { getVitalsByPatient } from '../../api/vitals.api';
import { Table } from '../../components/ui/index.jsx';
import { formatDateTime } from '../../utils/formatters';

export default function MyVitals() {
  const { data: profileData } = useQuery({
    queryKey: ['my-patient-profile'],
    queryFn: () => api.get('/api/patients/me').then(r => r.data),
  });

  const patientId = profileData?.patient?._id;

  const { data, isLoading } = useQuery({
    queryKey: ['vitals', patientId],
    queryFn: () => getVitalsByPatient(patientId).then(r => r.data),
    enabled: !!patientId,
  });

  const columns = [
    { key: 'recordedAt',   label: 'Date',       render: r => formatDateTime(r.recordedAt) },
    { key: 'heartRate',    label: 'HR (bpm)' },
    { key: 'spo2',         label: 'SpO2 (%)' },
    { key: 'systolicBP',   label: 'BP (mmHg)',  render: r => `${r.systolicBP}/${r.diastolicBP}` },
    { key: 'temperature',  label: 'Temp (°C)' },
    { key: 'fallDetection',label: 'Fall',       render: r => r.fallDetection ? '⚠ Yes' : 'No' },
    { key: 'submittedBy',  label: 'Submitted By', render: r => r.submittedBy?.name || '—' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[#f1f5f9]">My Vitals History</h1>
      <div className="card">
        {isLoading ? <p className="text-center text-[#94a3b8] py-8">Loading...</p>
          : <Table columns={columns} data={data?.vitals || []} emptyMsg="No vitals recorded yet. Your caretaker will enter them." />}
      </div>
    </div>
  );
}
