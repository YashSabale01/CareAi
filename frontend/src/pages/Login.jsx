import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login as loginApi } from '../api/auth.api';
import { AuthContext } from '../auth/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await loginApi(form);
      login(data.token, data.user);
      toast.success(`Welcome, ${data.user.name}!`);
      const paths = { doctor: '/doctor', patient: '/patient', caretaker: '/caretaker', admin: '/admin' };
      navigate(paths[data.user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Left branding */}
      <div className="hidden lg:flex flex-col justify-center items-center flex-1 px-12" style={{ background: 'var(--color-bg-secondary)' }}>
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">⚕</div>
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-accent-primary)' }}>CareAI</h1>
          <p className="text-lg text-[#94a3b8] mb-6">AI-powered healthcare monitoring platform for real-time patient care and disease prediction.</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {['🤖 AI Disease Prediction', '📊 Real-time Monitoring', '🚨 Instant Alerts', '📋 Smart Care Plans'].map(f => (
              <div key={f} className="card text-center py-3 text-[#94a3b8]">{f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex flex-col justify-center items-center flex-1 px-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#f1f5f9]">Sign In</h2>
            <p className="text-[#94a3b8] text-sm mt-1">Access your CareAI dashboard</p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm text-[#94a3b8] block mb-1">Email</label>
              <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="input-field" placeholder="doctor@careai.health" />
            </div>
            <div>
              <label className="text-sm text-[#94a3b8] block mb-1">Password</label>
              <input type="password" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="input-field" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-sm text-[#94a3b8] mt-4">
            Don't have an account? <Link to="/register" className="text-[#00d4ff] hover:underline">Register</Link>
          </p>

        </div>
      </div>
    </div>
  );
}
