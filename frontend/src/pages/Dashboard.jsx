import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { motion } from 'framer-motion';
import UserDashboard from './UserDashboard';
import OwnerDashboard from './OwnerDashboard';

export default function Dashboard() {
  const { token, role: localRole, profile: localProfile, login, logout } = useAuth();
  const navigate = useNavigate();
  const verified = useRef(false);

  // Use cached data immediately if available, only show loading on first-ever visit
  const hasCached = !!(localRole && localProfile);
  const [loading, setLoading] = useState(!hasCached);
  const [role, setRole] = useState(localRole || '');
  const [profile, setProfile] = useState(localProfile || null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    // Skip duplicate calls (React StrictMode)
    if (verified.current) return;
    verified.current = true;

    async function verifySession() {
      try {
        const data = await apiRequest('/auth/me', { token });
        setRole(data.role);
        setProfile(data.user);
        login(data.role, { token, profile: data.user });
      } catch {
        // Only logout if we had no cached data (genuine invalid token)
        if (!hasCached) {
          setError('Session expired. Redirecting to login…');
          logout();
          setTimeout(() => navigate('/login', { replace: true }), 1200);
        }
        // If we had cached data, silently keep the user on the dashboard —
        // the next meaningful API call will surface the real error.
      } finally {
        setLoading(false);
      }
    }

    verifySession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-mist/70 text-lg"
        >
          Loading dashboard…
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (role === 'owner') {
    return <OwnerDashboard profile={profile} />;
  }

  return <UserDashboard profile={profile} />;
}
