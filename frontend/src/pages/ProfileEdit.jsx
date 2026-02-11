import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, User, Save, Eye, EyeOff } from 'lucide-react';

export default function ProfileEdit() {
  const { token, role, profile, setProfile } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', contactNumber: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (profile) {
      setForm((f) => ({
        ...f,
        name: profile.name || '',
        contactNumber: profile.contactNumber || '',
      }));
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.password && form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const endpoint = role === 'owner' ? '/owners/profile' : '/users/profile';
      const body = { name: form.name, contactNumber: form.contactNumber };
      if (form.password) body.password = form.password;

      const data = await apiRequest(endpoint, { method: 'PUT', body, token });
      const updated = data.user || data.owner || data;
      if (setProfile) setProfile(updated);
      setSuccess('Profile updated!');
      setForm((f) => ({ ...f, password: '', confirmPassword: '' }));
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update profile.');
    }
    setSaving(false);
  };

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-accent/50 placeholder:text-mist/30 transition-colors';

  return (
    <div className="min-h-screen bg-night text-mist">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-night/80 backdrop-blur-xl px-5 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-mist/60 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <span className="text-white font-medium text-sm">Edit Profile</span>
      </div>

      <div className="max-w-lg mx-auto px-5 py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-6"
        >
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="h-16 w-16 rounded-full bg-accent/20 border-2 border-accent/40 flex items-center justify-center text-accent text-xl font-bold">
              {form.name?.[0]?.toUpperCase() || <User size={24} />}
            </div>
            <p className="text-mist/50 text-xs capitalize">{role}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-mist/50 text-xs mb-1 block">Full Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={inputCls} />
            </div>

            <div>
              <label className="text-mist/50 text-xs mb-1 block">Phone Number</label>
              <input value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                placeholder="e.g. 9876543210" className={inputCls} />
            </div>

            <hr className="border-white/10" />

            <div>
              <label className="text-mist/50 text-xs mb-1 block">New Password (optional)</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Leave blank to keep current"
                  className={inputCls + ' pr-10'}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mist/40 hover:text-white">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {form.password && (
              <div>
                <label className="text-mist/50 text-xs mb-1 block">Confirm Password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="Re-enter new password"
                  className={inputCls}
                />
              </div>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-green-400 text-sm">{success}</p>}

            <button type="submit" disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-night font-medium text-sm hover:bg-accent/90 transition-colors disabled:opacity-50">
              <Save size={16} />
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
