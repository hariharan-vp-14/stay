import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { apiRequest, getImageUrl } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, PlusCircle, Building2, MessageSquare, BarChart3,
  MapPin, IndianRupee, Eye, Pencil, Trash2, Plus,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Add Property', path: '/owner/add-property', icon: PlusCircle },
  { label: 'My Properties', path: '/owner/properties', icon: Building2 },
  { label: 'Inquiries', path: '/owner/inquiries', icon: MessageSquare },
  { label: 'Analytics', path: '/owner/analytics', icon: BarChart3 },
];

export default function MyProperties() {
  const { token } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    apiRequest('/properties/my', { token })
      .then((data) => setProperties(data.properties || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this property? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await apiRequest(`/properties/${id}`, { method: 'DELETE', token });
      setProperties((prev) => prev.filter((p) => p._id !== id));
    } catch {}
    setDeletingId(null);
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-xl text-white font-semibold">My Properties</h1>
            <p className="text-mist/50 text-sm mt-1">{properties.length} listed</p>
          </div>
          <Link to="/owner/add-property"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-night text-sm font-medium hover:bg-accent/90 transition-colors">
            <Plus size={16} /> Add Property
          </Link>
        </motion.div>

        {loading ? (
          <LoadingSkeleton />
        ) : properties.length === 0 ? (
          <div className="text-center py-20">
            <Building2 size={40} className="mx-auto text-mist/20 mb-3" />
            <p className="text-mist/40 text-sm">You haven't listed any properties yet.</p>
            <Link to="/owner/add-property" className="text-accent text-sm hover:underline mt-2 inline-block">
              Add your first property →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {properties.map((p) => (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col sm:flex-row gap-4"
              >
                {/* Image */}
                <div className="w-full sm:w-36 h-28 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={getImageUrl(p.images?.[0]) || 'https://placehold.co/300x200/1a1a2e/6ae3d9?text=No+Image'}
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                      {p.type}
                    </span>
                    {!p.available && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                        Unavailable
                      </span>
                    )}
                  </div>
                  <Link to={`/property/${p._id}`} className="text-white font-medium text-sm hover:text-accent transition-colors block">
                    {p.title}
                  </Link>
                  <div className="flex items-center gap-1 text-mist/50 text-xs">
                    <MapPin size={12} /> {p.address}, {p.city}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-mist/50">
                    <span className="flex items-center gap-1"><IndianRupee size={12} />{p.price?.toLocaleString('en-IN')}/mo</span>
                    <span className="flex items-center gap-1"><Eye size={12} />{p.viewsCount} views</span>
                    <span className="flex items-center gap-1"><MessageSquare size={12} />{p.inquiriesCount} inquiries</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col gap-2 items-center">
                  <Link to={`/owner/edit-property/${p._id}`}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
                    <Pencil size={12} /> Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(p._id)}
                    disabled={deletingId === p._id}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={12} /> {deletingId === p._id ? '…' : 'Delete'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
