import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import { ShieldCheck, Mail } from 'lucide-react';

export default function AdminForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetInfo, setResetInfo] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setResetInfo(null);

    try {
      const data = await apiRequest('/admin/forgot-password', {
        method: 'POST',
        body: { email },
      });

      setSuccess(data.message || 'Reset token generated.');
      // In dev, backend returns the token directly
      if (data.resetToken) {
        setResetInfo({ token: data.resetToken, url: data.resetUrl });
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-night text-mist flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
            <Mail className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Forgot Password</h1>
          <p className="text-mist/60 text-sm mt-1">Enter your admin email to receive a reset link</p>
        </div>

        <div className="glass p-6 md:p-8 rounded-2xl border border-white/10 space-y-5 shadow-xl">
          <form className="space-y-4" onSubmit={onSubmit}>
            <label className="text-sm text-mist/80 block">
              Admin Email
              <input
                className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-white outline-none focus:border-red-400/50 focus:ring-1 focus:ring-red-400/30 transition-all placeholder:text-mist/40"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-2.5 disabled:opacity-60 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-200"
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          {success && <p className="text-sm text-green-400 text-center">{success}</p>}

          {/* Dev-only: show reset link */}
          {resetInfo && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-1">
              <p className="font-semibold">Dev Mode — Reset Link:</p>
              <Link
                to={`/admin/reset-password/${resetInfo.token}`}
                className="text-accent underline break-all"
              >
                {resetInfo.url}
              </Link>
            </div>
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
          In production, the reset link will be sent to your email
        </p>
      </div>
    </div>
  );
}
