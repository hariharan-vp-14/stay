import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest, getImageUrl } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import {
  Star, Trash2, Building2, MapPin, IndianRupee, Pencil,
  LayoutDashboard, Search, Heart, MessageSquare, StarIcon,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, end: true },
  { label: 'Search', to: '/search', icon: Search },
  { label: 'Saved', to: '/saved', icon: Heart },
  { label: 'My Inquiries', to: '/inquiries', icon: MessageSquare },
  { label: 'My Reviews', to: '/my-reviews', icon: Star },
];

export default function MyReviews() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchReviews = async () => {
    try {
      const res = await apiRequest('/reviews/user/my-reviews', { token });
      setReviews(res.reviews || []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (reviewId) => {
    setDeletingId(reviewId);
    try {
      await apiRequest(`/reviews/${reviewId}`, { method: 'DELETE', token });
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
    } catch {} finally {
      setDeletingId(null);
    }
  };

  const renderStars = (rating) =>
    [1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        size={14}
        className={s <= rating ? 'fill-accent text-accent' : 'text-white/15'}
      />
    ));

  return (
    <DashboardLayout navItems={navItems}>
      <div className="max-w-3xl space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="h-10 w-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center">
            <Star size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="text-xl text-white font-semibold">My Reviews</h1>
            <p className="text-mist/50 text-xs mt-0.5">
              {reviews.length} review{reviews.length !== 1 ? 's' : ''} written
            </p>
          </div>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="text-mist/40 text-sm py-12 text-center">Loading reviews…</div>
        )}

        {/* Empty */}
        {!loading && reviews.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 space-y-3"
          >
            <Star size={36} className="mx-auto text-white/10" />
            <p className="text-mist/40 text-sm">You haven't reviewed any property yet.</p>
            <button
              onClick={() => navigate('/search')}
              className="text-accent text-sm hover:underline"
            >
              Browse properties
            </button>
          </motion.div>
        )}

        {/* Review Cards */}
        <AnimatePresence>
          {reviews.map((rev, i) => {
            const prop = rev.property;
            const img = getImageUrl(prop?.images?.[0]) || 'https://placehold.co/120x80/1a1a2e/6ae3d9?text=PG';

            return (
              <motion.div
                key={rev._id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden hover:border-white/20 transition-colors"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Property thumbnail */}
                  <div
                    className="sm:w-40 h-32 sm:h-auto flex-shrink-0 cursor-pointer"
                    onClick={() => navigate(`/property/${prop?._id}`)}
                  >
                    <img
                      src={img}
                      alt={prop?.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 space-y-3">
                    {/* Property info */}
                    <div
                      className="cursor-pointer group"
                      onClick={() => navigate(`/property/${prop?._id}`)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                          {prop?.type || 'PG'}
                        </span>
                        {prop?.price && (
                          <span className="text-mist/40 text-xs flex items-center gap-0.5">
                            <IndianRupee size={10} /> {prop.price.toLocaleString('en-IN')}/mo
                          </span>
                        )}
                      </div>
                      <h3 className="text-white text-sm font-medium mt-1 group-hover:text-accent transition-colors">
                        {prop?.title || 'Property'}
                      </h3>
                      {prop?.city && (
                        <p className="text-mist/40 text-xs flex items-center gap-1 mt-0.5">
                          <MapPin size={10} /> {prop.city}
                        </p>
                      )}
                    </div>

                    {/* Rating + Comment */}
                    <div className="border-t border-white/5 pt-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">{renderStars(rev.rating)}</div>
                        <span className="text-mist/30 text-[10px]">
                          {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      {rev.comment && (
                        <p className="text-mist/60 text-sm leading-relaxed">{rev.comment}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => navigate(`/property/${prop?._id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-mist/60 text-xs hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Pencil size={12} /> Edit Review
                      </button>
                      <button
                        onClick={() => handleDelete(rev._id)}
                        disabled={deletingId === rev._id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400/70 text-xs hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-40"
                      >
                        <Trash2 size={12} />
                        {deletingId === rev._id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
