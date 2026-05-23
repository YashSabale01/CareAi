import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPatient } from '../../api/patient.api';
import { getVitalsByPatient } from '../../api/vitals.api';
import { getPatientAnalytics } from '../../api/analytics.api';
import VitalTrendChart from '../../components/charts/VitalTrendChart';
import { formatDate } from '../../utils/formatters';
import { Spinner } from '../../components/ui/index.jsx';

export default function PatientDetail() {
  const { id } = useParams();
  const { data: pd, isLoading } = useQuery({ queryKey: ['patient', id], queryFn: () => getPatient(id).then(r => r.data) });
  const { data: vd } = useQuery({ queryKey: ['vitals', id], queryFn: () => getVitalsByPatient(id, { limit: 30 }).then(r => r.data) });
  const { data: ad } = useQuery({ queryKey: ['analytics', id], queryFn: () => getPatientAnalytics(id).then(r => r.data) });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size={40} /></div>;
  const p = pd?.patient;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[#f1f5f9]">Patient: {p?.userId?.name}</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[['Patient ID', p?.patientId], ['Age', p?.age], ['Gender', p?.gender], ['Blood Group', p?.bloodGroup]].map(([l, v]) => (
          <div key={l} className="card"><p className="text-xs text-[#94a3b8]">{l}</p><p className="text-lg font-semibold text-[#f1f5f9]">{v || '—'}</p></div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[['Vitals Recorded', ad?.vitalsCount], ['Predictions', ad?.predictionsCount], ['Alerts', ad?.alertsCount]].map(([l, v]) => (
          <div key={l} className="card text-center"><p className="text-2xl font-bold text-[#00d4ff]">{v ?? '—'}</p><p className="text-xs text-[#94a3b8]">{l}</p></div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-[#94a3b8] mb-4">VITAL TRENDS (LAST 30)</h2>
        <VitalTrendChart records={vd?.vitals || []} />
      </div>

      {p?.chronicConditions?.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-[#94a3b8] mb-3">CHRONIC CONDITIONS</h2>
          <div className="flex flex-wrap gap-2">{p.chronicConditions.map(c => <span key={c} className="px-2 py-1 rounded bg-[#6366f122] text-[#6366f1] text-xs">{c}</span>)}</div>
        </div>
      )}
    </div>
  );
}
