import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserRound, Building2 } from 'lucide-react';
import { FadeIn } from '../components/FadeIn';

export default function RegisterLanding() {
  return (
    <div className="min-h-screen bg-night text-mist px-4 py-12 flex items-center justify-center">
      <motion.div
        className="glass rounded-3xl border border-white/10 p-8 md:p-10 w-full max-w-3xl space-y-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <FadeIn>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-accent">Choose your path</p>
            <h1 className="text-3xl text-white font-semibold">Sign up / Sign in</h1>
            <p className="text-mist/80 text-sm">Pick whether you are a guest looking for a stay or an owner listing a property.</p>
          </div>
        </FadeIn>
        <div className="grid gap-4 md:grid-cols-2">
          <FadeIn delay={0.05}>
            <Link
              to="/register/user"
              className="block glass rounded-2xl border border-white/10 p-5 hover:border-accent/70 transition"
            >
              <div className="flex items-center gap-3 text-2xl mb-3">
                <UserRound size={24} className="text-accent" />
                <span className="text-white font-semibold">User</span>
              </div>
              <p className="text-mist/80 text-sm">Register or sign in to find PGs, hostels, and dorms.</p>
            </Link>
          </FadeIn>
          <FadeIn delay={0.1}>
            <Link
              to="/register/owner"
              className="block glass rounded-2xl border border-white/10 p-5 hover:border-accent/70 transition"
            >
              <div className="flex items-center gap-3 text-2xl mb-3">
                <Building2 size={24} className="text-accent" />
                <span className="text-white font-semibold">Owner</span>
              </div>
              <p className="text-mist/80 text-sm">Register or sign in to list and manage your property.</p>
            </Link>
          </FadeIn>
        </div>
      </motion.div>
    </div>
  );
}
