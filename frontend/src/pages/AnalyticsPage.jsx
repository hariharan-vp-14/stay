import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, PlusCircle, Building2, MessageSquare, BarChart3,
  Eye, TrendingUp, Home,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Add Property', path: '/owner/add-property', icon: PlusCircle },
  { label: 'My Properties', path: '/owner/properties', icon: Building2 },
  { label: 'Inquiries', path: '/owner/inquiries', icon: MessageSquare },
  { label: 'Analytics', path: '/owner/analytics', icon: BarChart3 },
];

export default function AnalyticsPage() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/owner/analytics', { token })
      .then((data) => setAnalytics(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const stat = (icon, label, value, color) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 bg-white/[0.02] p-5 flex items-center gap-4"
    >
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-mist/50 text-xs">{label}</p>
        <p className="text-white text-xl font-semibold">{value}</p>
      </div>
    </motion.div>
  );

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl text-white font-semibold">Analytics</h1>
          <p className="text-mist/50 text-sm mt-1">Overview of your property performance</p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : !analytics ? (
          <div className="text-center py-20 text-mist/40 text-sm">Unable to load analytics.</div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {stat(<Building2 size={20} className="text-accent" />, 'Total Properties', analytics.totalProperties, 'bg-accent/10')}
              {stat(<Eye size={20} className="text-blue-400" />, 'Total Views', analytics.totalViews, 'bg-blue-500/10')}
              {stat(<MessageSquare size={20} className="text-purple-400" />, 'Total Inquiries', analytics.totalInquiries, 'bg-purple-500/10')}
            </div>

            {/* Most Viewed */}
            {analytics.mostViewedProperty && (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-2">
                <div className="flex items-center gap-2 text-mist/50 text-xs">
                  <TrendingUp size={14} /> Most Viewed Property
                </div>
                <p className="text-white font-medium">{analytics.mostViewedProperty.title}</p>
                <p className="text-mist/50 text-sm">{analytics.mostViewedProperty.viewsCount} views</p>
              </div>
            )}

            {/* Property Breakdown */}
            {analytics.propertyStats?.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-white text-sm font-medium">Property Breakdown</h2>
                <div className="space-y-3">
                  {analytics.propertyStats.map((ps) => {
                    const maxViews = Math.max(...analytics.propertyStats.map((x) => x.viewsCount), 1);
                    const pct = Math.round((ps.viewsCount / maxViews) * 100);
                    return (
                      <div key={ps._id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Home size={14} className="text-accent" />
                            <span className="text-white text-sm">{ps.title}</span>
                            <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                              {ps.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-mist/50">
                            <span className="flex items-center gap-1"><Eye size={12} />{ps.viewsCount}</span>
                            <span className="flex items-center gap-1"><MessageSquare size={12} />{ps.inquiriesCount}</span>
                          </div>
                        </div>
                        {/* Bar */}
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full rounded-full bg-gradient-to-r from-accent to-accent/60"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
