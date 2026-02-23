import { motion } from 'framer-motion';
import { Routes, Route, Link } from 'react-router-dom';
import { LogIn, ShieldCheck } from 'lucide-react';
import logo from './assets/stay-high-resolution-logo.png';
import UserRegister from './pages/UserRegister';
import OwnerRegister from './pages/OwnerRegister';
import RegisterLanding from './pages/RegisterLanding';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ProfileEdit from './pages/ProfileEdit';
import SearchPage from './pages/SearchPage';
import PropertyDetail from './pages/PropertyDetail';
import AddProperty from './pages/AddProperty';
import SavedProperties from './pages/SavedProperties';
import UserInquiries from './pages/UserInquiries';
import OwnerInquiries from './pages/OwnerInquiries';
import MyProperties from './pages/MyProperties';
import AnalyticsPage from './pages/AnalyticsPage';
import MyReviews from './pages/MyReviews';
import AdminLogin from './pages/AdminLogin';
import AdminRegister from './pages/AdminRegister';
import AdminDashboard from './pages/AdminDashboard';
import AdminForgotPassword from './pages/AdminForgotPassword';
import AdminResetPassword from './pages/AdminResetPassword';
import ProtectedRoute from './components/ProtectedRoute';
import { RedirectIfAuth } from './components/ProtectedRoute';
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
        <img src={logo} alt="Stay" className="h-10 w-10 rounded-full object-cover" />
        <div>
          <p className="text-white font-semibold">Stay</p>
        </div>
      </div>
      <Link
        to="/admin/login"
        className="p-2 rounded-lg hover:bg-white/10 text-mist/40 hover:text-red-400 transition-colors"
        title="Admin Login"
      >
        <ShieldCheck size={18} />
      </Link>
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
      <Route path="/" element={<RedirectIfAuth><Home /></RedirectIfAuth>} />
      <Route path="/register" element={<RedirectIfAuth><RegisterLanding /></RedirectIfAuth>} />
      <Route path="/register/user" element={<RedirectIfAuth><UserRegister /></RedirectIfAuth>} />
      <Route path="/register/owner" element={<RedirectIfAuth><OwnerRegister /></RedirectIfAuth>} />
      <Route path="/login" element={<RedirectIfAuth><Login /></RedirectIfAuth>} />

      {/* Protected — shared */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/profile/edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
      <Route path="/property/:id" element={<ProtectedRoute><PropertyDetail /></ProtectedRoute>} />

      {/* Protected — user */}
      <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
      <Route path="/saved" element={<ProtectedRoute><SavedProperties /></ProtectedRoute>} />
      <Route path="/inquiries" element={<ProtectedRoute><UserInquiries /></ProtectedRoute>} />
      <Route path="/my-reviews" element={<ProtectedRoute><MyReviews /></ProtectedRoute>} />

      {/* Protected — owner */}
      <Route path="/owner/add-property" element={<ProtectedRoute><AddProperty /></ProtectedRoute>} />
      <Route path="/owner/edit-property/:id" element={<ProtectedRoute><AddProperty /></ProtectedRoute>} />
      <Route path="/owner/properties" element={<ProtectedRoute><MyProperties /></ProtectedRoute>} />
      <Route path="/owner/inquiries" element={<ProtectedRoute><OwnerInquiries /></ProtectedRoute>} />
      <Route path="/owner/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />

      {/* Admin — public auth */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/register" element={<AdminRegister />} />
      <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
      <Route path="/admin/reset-password/:token" element={<AdminResetPassword />} />

      {/* Admin — protected */}
      <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/pending" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/properties" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/owners" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/audit-logs" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
