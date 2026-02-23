import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import { ShieldCheck, KeyRound } from 'lucide-react';

export default function AdminResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest(`/admin/reset-password/${token}`, {
        method: 'PUT',
        body: { password },
      });

      setSuccess(data.message || 'Password reset successfully!');
      setTimeout(() => navigate('/admin/login'), 2000);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-night text-mist flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
            <KeyRound className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Reset Password</h1>
          <p className="text-mist/60 text-sm mt-1">Enter your new admin password</p>
        </div>

        <div className="glass p-6 md:p-8 rounded-2xl border border-white/10 space-y-5 shadow-xl">
          <form className="space-y-4" onSubmit={onSubmit}>
            <label className="text-sm text-mist/80 block">
              New Password
              <input
                className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-white outline-none focus:border-red-400/50 focus:ring-1 focus:ring-red-400/30 transition-all"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </label>

            <label className="text-sm text-mist/80 block">
              Confirm Password
              <input
                className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-white outline-none focus:border-red-400/50 focus:ring-1 focus:ring-red-400/30 transition-all"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-2.5 disabled:opacity-60 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-200"
            >
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          {success && (
            <p className="text-sm text-green-400 text-center">
              {success} Redirecting to login…
            </p>
          )}

          <div className="pt-4 border-t border-white/10 text-center">
            <p className="text-sm text-mist/50">
              <Link to="/admin/login" className="text-red-400 hover:underline">
                Back to Admin Login
              </Link>
            </p>
          </div>
        </div>

        <p className="text-xs text-center text-mist/50 flex items-center justify-center gap-1">
          <ShieldCheck size={12} />
          Your password will be securely hashed
        </p>
      </div>
    </div>
  );
}
