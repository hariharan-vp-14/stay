import { motion } from 'framer-motion';
import { Routes, Route, Link } from 'react-router-dom';
import { Building2, LogIn } from 'lucide-react';
import UserRegister from './pages/UserRegister';
import OwnerRegister from './pages/OwnerRegister';
import RegisterLanding from './pages/RegisterLanding';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';
import { FadeIn } from './components/FadeIn';

const IntroHero = () => (
  <div className="relative overflow-hidden rounded-3xl p-8 md:p-12 gradient-bg shadow-2xl min-h-[60vh] flex flex-col justify-center">
    <div className="absolute inset-0 opacity-40 card-grid" aria-hidden />
    <div className="relative z-10 space-y-8">
      <FadeIn>
        <p className="text-sm uppercase tracking-[0.35em] text-accent">Welcome to Stay</p>
      </FadeIn>
      <FadeIn delay={0.1}>
        <div className="space-y-3">
          <motion.h1
            className="font-display text-5xl md:text-6xl font-semibold text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            Find your PG, hostel, or dorm in minutes.
          </motion.h1>
          <motion.p
            className="text-lg text-mist/80 max-w-2xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.8, ease: 'easeOut' }}
          >
            We guide students and professionals arriving in new cities—showing verified stays, maps, and quick onboarding with Google login.
          </motion.p>
        </div>
      </FadeIn>
      <FadeIn delay={0.25}>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-accent text-night font-semibold shadow-glow hover:scale-[1.01] transition"
        >
          <LogIn size={18} />
          Sign up / Sign in
        </Link>
      </FadeIn>
    </div>
  </div>
);

// Removed extra sections for a minimal homepage.

const Header = () => {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent font-bold">
          <Building2 size={18} />
        </div>
        <div>
          <p className="text-white font-semibold">Stay</p>
        </div>
      </div>
    </header>
  );
};

function App() {
  const Home = () => (
    <div className="min-h-screen bg-night text-mist">
      <main className="mx-auto max-w-6xl px-4 py-10 md:py-14 space-y-10">
        <FadeIn>
          <Header />
        </FadeIn>
        <IntroHero />
      </main>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<RegisterLanding />} />
      <Route path="/register/user" element={<UserRegister />} />
      <Route path="/register/owner" element={<OwnerRegister />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={(
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )}
      />
    </Routes>
  );
}

export default App;
