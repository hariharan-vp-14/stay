import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';
import PropertyCard from '../components/PropertyCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Bookmark, Search, MessageSquare, LayoutDashboard, Heart,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Search', path: '/search', icon: Search },
  { label: 'Saved', path: '/saved', icon: Bookmark },
  { label: 'My Inquiries', path: '/inquiries', icon: MessageSquare },
];

export default function SavedProperties() {
  const { token } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = async () => {
    try {
      const data = await apiRequest('/users/saved', { token });
      setProperties(data.properties || []);
    } catch {
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSaved(); }, [token]);

  const handleUnsave = async (id) => {
    try {
      await apiRequest(`/users/save/${id}`, { method: 'DELETE', token });
      setProperties((prev) => prev.filter((p) => p._id !== id));
    } catch {}
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl text-white font-semibold">Saved Properties</h1>
          <p className="text-mist/50 text-sm mt-1">{properties.length} saved</p>
        </motion.div>

        {loading ? (
          <LoadingSkeleton />
        ) : properties.length === 0 ? (
          <div className="text-center py-20">
            <Heart size={40} className="mx-auto text-mist/20 mb-3" />
            <p className="text-mist/40 text-sm">No saved properties yet. Browse and save properties you like!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {properties.map((p) => (
              <PropertyCard key={p._id} property={p} saved onSave={() => handleUnsave(p._id)} index={properties.indexOf(p)} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
