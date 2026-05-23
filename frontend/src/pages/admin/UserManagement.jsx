import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminGetUsers, adminCreateUser, adminDeactivateUser } from '../../api/admin.api';
import { Table } from '../../components/ui/index.jsx';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const ROLE_COLORS = { doctor: '#6366f1', caretaker: '#00d4ff', patient: '#22c55e', admin: '#f59e0b' };

export default function UserManagement() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'caretaker', phone: '' });

  const { data, isLoading } = useQuery({ queryKey: ['all-users'], queryFn: () => adminGetUsers().then(r => r.data) });

  const createMutation = useMutation({
    mutationFn: adminCreateUser,
    onSuccess: () => { toast.success('User created'); setShowForm(false); setForm({ name: '', email: '', password: '', role: 'caretaker', phone: '' }); qc.invalidateQueries({ queryKey: ['all-users'] }); },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const deactivateMutation = useMutation({
    mutationFn: adminDeactivateUser,
    onSuccess: () => { toast.success('User deactivated'); qc.invalidateQueries({ queryKey: ['all-users'] }); },
  });

  const columns = [
    { key: 'name',      label: 'Name' },
    { key: 'email',     label: 'Email' },
    { key: 'role',      label: 'Role', render: r => (
      <span className="text-xs font-semibold px-2 py-0.5 rounded capitalize" style={{ color: ROLE_COLORS[r.role], background: ROLE_COLORS[r.role] + '22' }}>{r.role}</span>
    )},
    { key: 'createdAt', label: 'Joined',  render: r => formatDate(r.createdAt) },
    { key: 'isActive',  label: 'Status',  render: r => <span className={r.isActive ? 'text-[#22c55e]' : 'text-[#ef4444]'}>{r.isActive ? 'Active' : 'Inactive'}</span> },
    { key: 'actions',   label: '',        render: r => r.isActive ? (
      <button onClick={() => deactivateMutation.mutate(r._id)} className="text-xs text-[#ef4444] hover:underline">Deactivate</button>
    ) : null },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#f1f5f9]">User Management</h1>
        <button onClick={() => setShowForm(s => !s)} className="btn-primary">+ Create User</button>
      </div>

      {showForm && (
        <div className="card flex flex-col gap-4 max-w-lg">
          <h2 className="text-sm font-semibold text-[#94a3b8]">CREATE NEW USER</h2>
          {[
            { key: 'name',     label: 'Full Name',    type: 'text' },
            { key: 'email',    label: 'Email',        type: 'email' },
            { key: 'password', label: 'Password',     type: 'password' },
            { key: 'phone',    label: 'Phone',        type: 'text' },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label className="text-xs text-[#94a3b8] block mb-1">{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="input-field" />
            </div>
          ))}
          <div>
            <label className="text-xs text-[#94a3b8] block mb-1">Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="input-field">
              {['doctor', 'caretaker', 'patient', 'admin'].map(r => <option key={r} value={r} className="bg-[#1a2234] capitalize">{r}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="btn-primary flex-1">
              {createMutation.isPending ? 'Creating...' : 'Create User'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-[#2d3748] text-[#94a3b8] text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="card">
        {isLoading ? <p className="text-center text-[#94a3b8] py-8">Loading...</p>
          : <Table columns={columns} data={data?.users || []} emptyMsg="No users found" />}
      </div>
    </div>
  );
}
