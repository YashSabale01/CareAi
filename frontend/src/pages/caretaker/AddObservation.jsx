import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPatients } from '../../api/patient.api';
import { createObservation, getObservationsByPatient, deleteObservation } from '../../api/observation.api';
import { formatDateTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

const MOODS = ['Good', 'Stable', 'Concerning', 'Critical'];
const MOOD_COLORS = { Good: '#22c55e', Stable: '#00d4ff', Concerning: '#f59e0b', Critical: '#ef4444' };

export default function AddObservation() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ patientId: '', note: '', mood: 'Stable' });

  const { data: patientsData } = useQuery({ queryKey: ['my-patients'], queryFn: () => getPatients().then(r => r.data) });
  const { data: obsData } = useQuery({
    queryKey: ['observations', form.patientId],
    queryFn: () => getObservationsByPatient(form.patientId).then(r => r.data),
    enabled: !!form.patientId,
  });

  const addMutation = useMutation({
    mutationFn: createObservation,
    onSuccess: () => {
      toast.success('Observation saved');
      setForm(f => ({ ...f, note: '', mood: 'Stable' }));
      qc.invalidateQueries({ queryKey: ['observations', form.patientId] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteObservation,
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['observations', form.patientId] }); },
  });

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-[#f1f5f9]">Health Observations</h1>

      <div className="card flex flex-col gap-4">
        <div>
          <label className="text-sm text-[#94a3b8] block mb-1">Patient</label>
          <select value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))} className="input-field">
            <option value="">Select patient...</option>
            {patientsData?.patients?.map(p => (
              <option key={p._id} value={p._id} className="bg-[#1a2234]">{p.userId?.name} ({p.patientId})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-[#94a3b8] block mb-1">Mood / Status</label>
          <div className="flex gap-2">
            {MOODS.map(m => (
              <button key={m} type="button" onClick={() => setForm(f => ({ ...f, mood: m }))}
                className="px-3 py-1 rounded text-xs font-semibold transition-all"
                style={{ background: form.mood === m ? MOOD_COLORS[m] + '33' : '#2d3748', color: form.mood === m ? MOOD_COLORS[m] : '#94a3b8', border: `1px solid ${form.mood === m ? MOOD_COLORS[m] : '#2d3748'}` }}>
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-[#94a3b8] block mb-1">Observation Note *</label>
          <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            className="input-field resize-none" rows={4} placeholder="Describe patient's condition, behavior, symptoms..." />
        </div>

        <button onClick={() => addMutation.mutate(form)} disabled={!form.patientId || !form.note || addMutation.isPending}
          className="btn-primary py-2">
          {addMutation.isPending ? 'Saving...' : 'Save Observation'}
        </button>
      </div>

      {obsData?.observations?.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-[#94a3b8] mb-3">PREVIOUS OBSERVATIONS</h2>
          <div className="flex flex-col gap-2">
            {obsData.observations.map(o => (
              <div key={o._id} className="p-3 rounded border border-[#2d3748] flex justify-between items-start gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold" style={{ color: MOOD_COLORS[o.mood] }}>{o.mood}</span>
                    <span className="text-xs text-[#94a3b8]">{formatDateTime(o.observedAt)}</span>
                  </div>
                  <p className="text-sm text-[#f1f5f9]">{o.note}</p>
                </div>
                <button onClick={() => deleteMutation.mutate(o._id)} className="text-xs text-[#ef4444] hover:underline shrink-0">Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
