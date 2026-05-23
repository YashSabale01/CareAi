import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register as registerApi } from '../api/auth.api';
import { AuthContext } from '../auth/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient' });
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      const { data } = await registerApi(form);
      login(data.token, data.user);
      toast.success('Account created!');
      const paths = { doctor: '/doctor', patient: '/patient', caretaker: '/caretaker', admin: '/admin' };
      navigate(paths[data.user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-bg-primary)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">⚕</div>
          <h2 className="text-2xl font-bold text-[#f1f5f9]">Create Account</h2>
          <p className="text-[#94a3b8] text-sm mt-1">Join CareAI healthcare platform</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[['Name', 'text', 'name', 'Full name'], ['Email', 'email', 'email', 'your@email.com'], ['Password', 'password', 'password', '8+ characters']].map(([label, type, key, ph]) => (
            <div key={key}>
              <label className="text-sm text-[#94a3b8] block mb-1">{label}</label>
              <input type={type} required value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="input-field" placeholder={ph} />
            </div>
          ))}
          <div>
            <label className="text-sm text-[#94a3b8] block mb-1">Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="input-field">
              {['doctor', 'patient', 'caretaker'].map(r => <option key={r} value={r} className="bg-[#1a2234] capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-sm text-[#94a3b8] mt-4">
          Already have an account? <Link to="/login" className="text-[#00d4ff] hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
