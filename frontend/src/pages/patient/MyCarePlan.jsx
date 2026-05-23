import { useQuery } from '@tanstack/react-query';
import api from '../../api/axiosInstance';
import { getCarePlanByPatient } from '../../api/careplan.api';
import { DISCLAIMER } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';

export default function MyCarePlan() {
  const { data: profileData } = useQuery({
    queryKey: ['my-patient-profile'],
    queryFn: () => api.get('/api/patients/me').then(r => r.data),
  });

  const patientId = profileData?.patient?._id;

  const { data: cpData, isLoading } = useQuery({
    queryKey: ['my-careplan', patientId],
    queryFn: () => getCarePlanByPatient(patientId).then(r => r.data).catch(() => null),
    enabled: !!patientId,
  });

  const cp = cpData?.carePlan;

  if (isLoading) return <p className="text-[#94a3b8] text-center py-20">Loading...</p>;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-[#f1f5f9]">My Care Plan</h1>
      {cp ? (
        cp.status === 'Approved' ? (
          <div className="card flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-[#f1f5f9]">{cp.predictedDisease}</p>
                <p className="text-xs text-[#94a3b8]">Approved: {formatDate(cp.approvedAt)} · Follow-up: {cp.followUpSchedule}</p>
                <p className="text-xs text-[#94a3b8]">Dr. {cp.doctorId?.name}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-[#22c55e22] text-[#22c55e]">✓ Doctor Approved</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#94a3b8] mb-2">🥗 Dietary Guidelines</p>
              <ul className="flex flex-col gap-1">{cp.dietaryGuidelines?.map((d, i) => <li key={i} className="text-sm text-[#f1f5f9]">• {d}</li>)}</ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#94a3b8] mb-2">🏃 Activity Recommendations</p>
              <ul className="flex flex-col gap-1">{cp.activityRecommendations?.map((a, i) => <li key={i} className="text-sm text-[#f1f5f9]">• {a}</li>)}</ul>
            </div>
            {cp.restrictions?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-[#94a3b8] mb-2">🚫 Restrictions</p>
                <div className="flex flex-wrap gap-2">{cp.restrictions.map((r, i) => <span key={i} className="px-2 py-0.5 rounded bg-[#ef444422] text-[#ef4444] text-xs">{r}</span>)}</div>
              </div>
            )}
            {cp.doctorNotes && <div><p className="text-sm font-semibold text-[#94a3b8] mb-1">📝 Doctor Notes</p><p className="text-sm text-[#f1f5f9]">{cp.doctorNotes}</p></div>}
            <p className="text-xs text-[#94a3b8] italic border-t border-[#2d3748] pt-3">{DISCLAIMER}</p>
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-4xl mb-3">⏳</p>
            <p className="text-[#f1f5f9] font-semibold">Care plan is being reviewed by your doctor</p>
            <p className="text-sm text-[#94a3b8] mt-2">You will be notified once it is approved.</p>
          </div>
        )
      ) : (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-[#94a3b8]">No care plan assigned yet.</p>
        </div>
      )}
    </div>
  );
}
