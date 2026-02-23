import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck } from 'lucide-react';
import GoogleButton from '../components/GoogleButton';

export default function AdminRegister() {
  const [form, setForm] = useState({ name: '', email: '', password: '', contactNumber: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await apiRequest('/admin/register', {
        method: 'POST',
        body: form,
      });

      login(data.user?.roles || ['admin'], { token: data.token, profile: data.user });
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-night text-mist flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
            <ShieldCheck className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Admin Registration</h1>
          <p className="text-mist/60 text-sm mt-1">Maximum 5 admin accounts allowed</p>
        </div>

        {/* Form */}
        <div className="glass p-6 md:p-8 rounded-2xl border border-white/10 space-y-5 shadow-xl">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-mist/80">
                Full Name
                <input
                  className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-white outline-none focus:border-red-400/50 focus:ring-1 focus:ring-red-400/30 transition-all placeholder:text-mist/40"
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  placeholder="Admin Name"
                  required
                />
              </label>
              <label className="text-sm text-mist/80">
                Contact Number
                <input
                  className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-white outline-none focus:border-red-400/50 focus:ring-1 focus:ring-red-400/30 transition-all placeholder:text-mist/40"
                  name="contactNumber"
                  value={form.contactNumber}
                  onChange={onChange}
                  pattern="[6-9]\d{9}"
                  placeholder="10-digit mobile"
                />
              </label>
            </div>

            <label className="text-sm text-mist/80 block">
              Email address
              <input
                className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-white outline-none focus:border-red-400/50 focus:ring-1 focus:ring-red-400/30 transition-all placeholder:text-mist/40"
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                placeholder="admin@example.com"
                required
              />
            </label>

            <label className="text-sm text-mist/80 block">
              Password
              <input
                className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-white outline-none focus:border-red-400/50 focus:ring-1 focus:ring-red-400/30 transition-all"
                name="password"
                type="password"
                value={form.password}
                onChange={onChange}
                required
                minLength={6}
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-2.5 disabled:opacity-60 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-200"
            >
              {loading ? 'Creating…' : 'Register as Admin'}
            </button>
          </form>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-night text-mist/60">or continue with</span>
            </div>
          </div>

          <GoogleButton role="admin" />

          <div className="pt-4 border-t border-white/10 text-center space-y-2">
            <p className="text-sm text-mist/70">
              Already an admin?{' '}
              <Link to="/admin/login" className="text-red-400 font-medium hover:underline">
                Sign in
              </Link>
            </p>
            <p className="text-sm text-mist/50">
              <Link to="/login" className="text-accent hover:underline">
                Back to User/Owner Login
              </Link>
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs text-center">
          Only 5 admin accounts are allowed system-wide. If the limit is reached, registration will be blocked.
        </div>
      </div>
    </div>
  );
}
