import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, Home, BedDouble, PlusCircle, List, MessageSquare,
  BarChart3, LayoutDashboard, Crown,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, end: true },
  { label: 'Add Property', to: '/owner/add-property', icon: PlusCircle },
  { label: 'My Properties', to: '/owner/properties', icon: List },
  { label: 'Inquiries', to: '/owner/inquiries', icon: MessageSquare },
  { label: 'Analytics', to: '/owner/analytics', icon: BarChart3 },
];

const cards = [
  {
    title: 'Add PG',
    description: 'List your paying guest property.',
    icon: Building2,
    type: 'pg',
    gradient: 'from-emerald-500/20 to-green-600/20',
    border: 'border-emerald-500/30',
    iconColor: 'text-emerald-400',
  },
  {
    title: 'Add Hostel',
    description: 'Register your hostel with amenities.',
    icon: Home,
    type: 'hostel',
    gradient: 'from-sky-500/20 to-indigo-600/20',
    border: 'border-sky-500/30',
    iconColor: 'text-sky-400',
  },
  {
    title: 'Add Dormitory',
    description: 'Add a dormitory with bed facilities.',
    icon: BedDouble,
    type: 'dormitory',
    gradient: 'from-rose-500/20 to-pink-600/20',
    border: 'border-rose-500/30',
    iconColor: 'text-rose-400',
  },
];

export default function OwnerDashboard({ profile }) {
  const navigate = useNavigate();
  const name = profile?.name || 'Owner';

  return (
    <DashboardLayout navItems={navItems}>
      <div className="max-w-5xl space-y-8">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center flex-shrink-0">
            <Crown size={22} className="text-accent" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl text-white font-semibold">Welcome, {name}</h1>
            <p className="text-mist/60 text-sm mt-1">What type of property would you like to list?</p>
          </div>
        </motion.div>

        {/* Type Cards */}
        <div className="flex flex-col gap-5 max-w-3xl">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.button
                key={card.type}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * idx, duration: 0.45 }}
                onClick={() => navigate(`/owner/add-property?type=${card.type}`)}
                className={`group relative overflow-hidden rounded-2xl border ${card.border} bg-gradient-to-br ${card.gradient} backdrop-blur-sm px-7 py-7 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20 cursor-pointer flex items-center gap-6 min-h-[7rem]`}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/5 to-transparent" />
                <div className={`relative z-10 h-14 w-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 ${card.iconColor}`}>
                  <Icon size={26} />
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl font-semibold text-white">{card.title}</h3>
                  <p className="text-sm text-mist/60 mt-1">{card.description}</p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            onClick={() => navigate('/owner/properties')}
            className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/5 transition-colors text-left"
          >
            <List size={20} className="text-emerald-400" />
            <div>
              <p className="text-white text-sm font-medium">My Properties</p>
              <p className="text-mist/50 text-xs">Manage listings</p>
            </div>
          </motion.button>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            onClick={() => navigate('/owner/inquiries')}
            className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/5 transition-colors text-left"
          >
            <MessageSquare size={20} className="text-sky-400" />
            <div>
              <p className="text-white text-sm font-medium">Inquiries</p>
              <p className="text-mist/50 text-xs">View tenant requests</p>
            </div>
          </motion.button>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            onClick={() => navigate('/owner/analytics')}
            className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/5 transition-colors text-left"
          >
            <BarChart3 size={20} className="text-violet-400" />
            <div>
              <p className="text-white text-sm font-medium">Analytics</p>
              <p className="text-mist/50 text-xs">Views & performance</p>
            </div>
          </motion.button>
        </div>
      </div>
    </DashboardLayout>
  );
}
