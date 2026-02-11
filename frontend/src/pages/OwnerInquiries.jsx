import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, PlusCircle, Building2, MessageSquare, BarChart3,
  Clock, CheckCircle2, User, Send,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Add Property', path: '/owner/add-property', icon: PlusCircle },
  { label: 'My Properties', path: '/owner/properties', icon: Building2 },
  { label: 'Inquiries', path: '/owner/inquiries', icon: MessageSquare },
  { label: 'Analytics', path: '/owner/analytics', icon: BarChart3 },
];

export default function OwnerInquiries() {
  const { token } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState(null);

  useEffect(() => {
    apiRequest('/inquiries/owner', { token })
      .then((data) => setInquiries(data.inquiries || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleRespond = async (id) => {
    setRespondingId(id);
    try {
      await apiRequest(`/inquiries/${id}/respond`, { method: 'PUT', token });
      setInquiries((prev) =>
        prev.map((inq) => (inq._id === id ? { ...inq, status: 'responded' } : inq))
      );
    } catch {}
    setRespondingId(null);
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl text-white font-semibold">Property Inquiries</h1>
          <p className="text-mist/50 text-sm mt-1">{inquiries.length} received</p>
        </motion.div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare size={40} className="mx-auto text-mist/20 mb-3" />
            <p className="text-mist/40 text-sm">No inquiries received yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inq) => (
              <motion.div
                key={inq._id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3"
              >
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <div className="space-y-2 flex-1">
                    {/* Property */}
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-accent" />
                      <Link to={`/property/${inq.property?._id}`} className="text-white text-sm font-medium hover:text-accent transition-colors">
                        {inq.property?.title || 'Property'}
                      </Link>
                    </div>
                    {/* User details */}
                    <div className="flex items-center gap-2 text-mist/50 text-xs">
                      <User size={12} />
                      <span>{inq.user?.name || 'User'}</span>
                      <span className="text-mist/30">•</span>
                      <span>{inq.user?.email}</span>
                    </div>
                    {/* Message */}
                    <p className="text-mist/60 text-sm">{inq.message}</p>
                    <div className="text-mist/40 text-xs">{new Date(inq.createdAt).toLocaleDateString()}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    {inq.status === 'responded' ? (
                      <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400">
                        <CheckCircle2 size={12} /> Responded
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRespond(inq._id)}
                        disabled={respondingId === inq._id}
                        className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl bg-accent text-night font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
                      >
                        <Send size={12} />
                        {respondingId === inq._id ? 'Sending…' : 'Mark Responded'}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
