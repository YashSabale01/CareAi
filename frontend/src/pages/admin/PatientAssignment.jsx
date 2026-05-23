import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPatients } from '../../api/patient.api';
import { adminGetUsers, adminAssignDoctor, adminAssignCaretaker } from '../../api/admin.api';
import toast from 'react-hot-toast';

export default function PatientAssignment() {
  const qc = useQueryClient();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [doctorId, setDoctorId] = useState('');
  const [caretakerId, setCaretakerId] = useState('');

  const { data: patientsData } = useQuery({ queryKey: ['all-patients-admin'], queryFn: () => getPatients().then(r => r.data) });
  const { data: doctorsData }  = useQuery({ queryKey: ['doctors'],   queryFn: () => adminGetUsers({ role: 'doctor' }).then(r => r.data) });
  const { data: caretakersData } = useQuery({ queryKey: ['caretakers'], queryFn: () => adminGetUsers({ role: 'caretaker' }).then(r => r.data) });

  const assignDoctorMutation = useMutation({
    mutationFn: () => adminAssignDoctor(selectedPatient._id, doctorId),
    onSuccess: () => { toast.success('Doctor assigned'); qc.invalidateQueries({ queryKey: ['all-patients-admin'] }); },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const assignCaretakerMutation = useMutation({
    mutationFn: () => adminAssignCaretaker(selectedPatient._id, caretakerId),
    onSuccess: () => { toast.success('Caretaker assigned'); qc.invalidateQueries({ queryKey: ['all-patients-admin'] }); },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const patients   = patientsData?.patients   || [];
  const doctors    = doctorsData?.users        || [];
  const caretakers = caretakersData?.users     || [];
  const unassigned = patients.filter(p => !p.assignedDoctorId || !p.assignedCaretakerId);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[#f1f5f9]">Patient Assignments</h1>
      {unassigned.length > 0 && (
        <div className="card border border-[#ef4444] bg-[#ef444411]">
          <p className="text-sm text-[#ef4444] font-semibold">⚠ {unassigned.length} patient(s) missing doctor or caretaker assignment</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient list */}
        <div className="card">
          <h2 className="text-sm font-semibold text-[#94a3b8] mb-3">SELECT PATIENT</h2>
          <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
            {patients.map(p => (
              <button key={p._id} onClick={() => { setSelectedPatient(p); setDoctorId(p.assignedDoctorId?._id || p.assignedDoctorId || ''); setCaretakerId(p.assignedCaretakerId?._id || p.assignedCaretakerId || ''); }}
                className={`p-3 rounded-lg border text-left transition-colors ${selectedPatient?._id === p._id ? 'border-[#00d4ff] bg-[#00d4ff11]' : 'border-[#2d3748] hover:border-[#00d4ff44]'}`}>
                <p className="text-sm font-semibold text-[#f1f5f9]">{p.userId?.name}</p>
                <p className="text-xs text-[#94a3b8]">{p.patientId} · Age {p.age}</p>
                <div className="flex gap-3 mt-1 text-xs">
                  <span className={p.assignedDoctorId ? 'text-[#22c55e]' : 'text-[#ef4444]'}>
                    {p.assignedDoctorId ? '✓ Doctor' : '✗ No Doctor'}
                  </span>
                  <span className={p.assignedCaretakerId ? 'text-[#22c55e]' : 'text-[#ef4444]'}>
                    {p.assignedCaretakerId ? '✓ Caretaker' : '✗ No Caretaker'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Assignment form */}
        <div className="card">
          <h2 className="text-sm font-semibold text-[#94a3b8] mb-3">ASSIGN ROLES</h2>
          {!selectedPatient ? (
            <p className="text-[#94a3b8] text-sm text-center py-8">Select a patient to assign roles</p>
          ) : (
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-sm font-semibold text-[#f1f5f9]">{selectedPatient.userId?.name}</p>
                <p className="text-xs text-[#94a3b8]">{selectedPatient.patientId}</p>
              </div>

              {/* Assign Doctor */}
              <div>
                <label className="text-sm text-[#94a3b8] block mb-1">Assign Doctor</label>
                <div className="flex gap-2">
                  <select value={doctorId} onChange={e => setDoctorId(e.target.value)} className="input-field flex-1">
                    <option value="">Select doctor...</option>
                    {doctors.map(d => <option key={d._id} value={d._id} className="bg-[#1a2234]">{d.name} ({d.email})</option>)}
                  </select>
                  <button onClick={() => assignDoctorMutation.mutate()} disabled={!doctorId || assignDoctorMutation.isPending}
                    className="btn-primary px-4 text-sm">
                    {assignDoctorMutation.isPending ? '...' : 'Assign'}
                  </button>
                </div>
              </div>

              {/* Assign Caretaker */}
              <div>
                <label className="text-sm text-[#94a3b8] block mb-1">Assign Caretaker</label>
                <div className="flex gap-2">
                  <select value={caretakerId} onChange={e => setCaretakerId(e.target.value)} className="input-field flex-1">
                    <option value="">Select caretaker...</option>
                    {caretakers.map(c => <option key={c._id} value={c._id} className="bg-[#1a2234]">{c.name} ({c.email})</option>)}
                  </select>
                  <button onClick={() => assignCaretakerMutation.mutate()} disabled={!caretakerId || assignCaretakerMutation.isPending}
                    className="btn-primary px-4 text-sm">
                    {assignCaretakerMutation.isPending ? '...' : 'Assign'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
