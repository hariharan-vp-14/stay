import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Building2, ArrowLeft, Mail, User, Phone, Shield, Pencil } from 'lucide-react';

export default function Profile() {
  const { profile, role } = useAuth();
  const navigate = useNavigate();

  const name = profile?.name || 'Guest';
  const email = profile?.email || '—';
  const contactNumber = profile?.contactNumber || null;
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-night text-mist flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-night/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
              <Building2 size={18} />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">Stay</span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-sm text-mist/70 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        </div>
      </nav>

      {/* Profile Card */}
      <main className="flex-1 flex items-start justify-center px-5 py-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden"
        >
          {/* Avatar Header */}
          <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-6 border-b border-white/10 bg-gradient-to-b from-accent/5 to-transparent">
            <div className="h-20 w-20 rounded-full bg-accent/20 border-2 border-accent/40 flex items-center justify-center text-accent text-2xl font-bold">
              {initials}
            </div>
            <div className="text-center">
              <h2 className="text-xl text-white font-semibold">{name}</h2>
              <span className="inline-block mt-1 px-2.5 py-0.5 text-[11px] uppercase tracking-wider rounded-full bg-accent/10 text-accent border border-accent/20">
                {role || 'user'}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="divide-y divide-white/5">
            <Row icon={User} label="Name" value={name} />
            <Row icon={Mail} label="Email" value={email} />
            {contactNumber && (
              <Row icon={Phone} label="Phone" value={contactNumber} />
            )}
            <Row icon={Shield} label="Role" value={role === 'owner' ? 'Property Owner' : 'User'} />
          </div>

          {/* Edit Button */}
          <div className="px-6 py-4">
            <Link
              to="/profile/edit"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-night font-medium text-sm hover:bg-accent/90 transition-colors"
            >
              <Pencil size={16} /> Edit Profile
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <div className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-mist/50">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-mist/40">{label}</p>
        <p className="text-sm text-white truncate">{value}</p>
      </div>
    </div>
  );
}
