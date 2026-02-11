import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Search, Bookmark, MessageSquare,
  Clock, CheckCircle2, Building2,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Search', path: '/search', icon: Search },
  { label: 'Saved', path: '/saved', icon: Bookmark },
  { label: 'My Inquiries', path: '/inquiries', icon: MessageSquare },
];

export default function UserInquiries() {
  const { token } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/inquiries/user', { token })
      .then((data) => setInquiries(data.inquiries || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl text-white font-semibold">My Inquiries</h1>
          <p className="text-mist/50 text-sm mt-1">{inquiries.length} sent</p>
        </motion.div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare size={40} className="mx-auto text-mist/20 mb-3" />
            <p className="text-mist/40 text-sm">No inquiries yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inq) => (
              <motion.div
                key={inq._id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col sm:flex-row gap-4"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-accent" />
                    <Link to={`/property/${inq.property?._id}`} className="text-white text-sm font-medium hover:text-accent transition-colors">
                      {inq.property?.title || 'Property'}
                    </Link>
                  </div>
                  <p className="text-mist/60 text-sm">{inq.message}</p>
                  <div className="text-mist/40 text-xs">{new Date(inq.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center">
                  <span className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border ${
                    inq.status === 'responded'
                      ? 'bg-green-500/10 border-green-500/30 text-green-400'
                      : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                  }`}>
                    {inq.status === 'responded' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {inq.status === 'responded' ? 'Responded' : 'Pending'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
