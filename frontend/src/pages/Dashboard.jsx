import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { profile, role } = useAuth();
  const name = profile?.name || 'Guest';

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="glass p-6 rounded-2xl border border-white/10">
        <p className="text-sm uppercase tracking-[0.25em] text-accent">Dashboard</p>
        <h1 className="text-3xl text-white font-semibold mt-2">Welcome, {name}</h1>
        <p className="text-mist/80 mt-2">You are signed in as {role || 'user'}.</p>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }} className="glass p-6 rounded-2xl border border-white/10 space-y-3">
        <h3 className="text-white font-semibold">Next: wire real data</h3>
        <ul className="list-disc list-inside text-mist/80 text-sm space-y-1">
          <li>Call backend profile endpoints to refresh user/owner data.</li>
          <li>Show saved properties, leads, or recent searches.</li>
          <li>Add logout that also hits backend logout if needed.</li>
        </ul>
      </motion.div>
    </div>
  );
}
