import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiRequest, getImageUrl } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  MapPin, IndianRupee, Eye, MessageSquare, ArrowLeft,
  Heart, Building2, User, Phone, Mail, Star, Trash2,
  ExternalLink, MessageCircle, ChevronLeft, ChevronRight,
} from 'lucide-react';

export default function PropertyDetail() {
  const { id } = useParams();
  const { token, role, profile } = useAuth();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inquiryMsg, setInquiryMsg] = useState('');
  const [inquirySent, setInquirySent] = useState(false);
  const [inquiryError, setInquiryError] = useState('');
  const [saved, setSaved] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [myReview, setMyReview] = useState(null);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiRequest(`/properties/${id}`);
        setProperty(data.property);

        // Check if saved
        if (token && role === 'user') {
          try {
            const res = await apiRequest('/users/saved', { token });
            const ids = res.properties?.map((p) => p._id) || [];
            setSaved(ids.includes(id));
          } catch {}
        }
      } catch {
        setProperty(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, token, role]);

  // Fetch reviews whenever id or profile changes
  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, profile]);

  const handleSave = async () => {
    try {
      if (saved) {
        await apiRequest(`/users/save/${id}`, { method: 'DELETE', token });
        setSaved(false);
      } else {
        await apiRequest(`/users/save/${id}`, { method: 'POST', token });
        setSaved(true);
      }
    } catch {}
  };

  const handleInquiry = async (e) => {
    e.preventDefault();
    setInquiryError('');
    try {
      await apiRequest('/inquiries', {
        method: 'POST',
        body: { propertyId: id, message: inquiryMsg },
        token,
      });
      setInquirySent(true);
    } catch (err) {
      setInquiryError(err?.response?.data?.message || 'Failed to send inquiry');
    }
  };

  // ── Reviews helpers ──
  const fetchReviews = async () => {
    try {
      const res = await apiRequest(`/reviews/${id}`);
      setReviews(res.reviews || []);
      setAvgRating(res.averageRating || 0);
      // Find current user's review
      if (profile) {
        const mine = (res.reviews || []).find((r) => r.user?._id === profile._id);
        if (mine) {
          setMyReview(mine);
          setReviewRating(mine.rating);
          setReviewComment(mine.comment || '');
        }
      }
    } catch {}
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (reviewRating === 0) { setReviewError('Please select a rating'); return; }
    setReviewSubmitting(true);
    setReviewError('');
    try {
      await apiRequest('/reviews', {
        method: 'POST',
        body: { propertyId: id, rating: reviewRating, comment: reviewComment },
        token,
      });
      await fetchReviews();
    } catch (err) {
      setReviewError(err?.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await apiRequest(`/reviews/${reviewId}`, { method: 'DELETE', token });
      setMyReview(null);
      setReviewRating(0);
      setReviewComment('');
      await fetchReviews();
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center">
        <div className="text-mist/50">Loading…</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-red-400">Property not found.</p>
          <button onClick={() => navigate(-1)} className="text-accent text-sm hover:underline">Go back</button>
        </div>
      </div>
    );
  }

  const { title, type, price, deposit, gender, amenities, images, address, city, description, owner, viewsCount, contactNumber, googleMapLink } = property;
  const imageList = images?.length ? images : ['https://placehold.co/800x400/1a1a2e/6ae3d9?text=No+Image'];
  const prevImg = () => setImgIdx((i) => (i === 0 ? imageList.length - 1 : i - 1));
  const nextImg = () => setImgIdx((i) => (i === imageList.length - 1 ? 0 : i + 1));

  return (
    <div className="min-h-screen bg-night text-mist">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-night/80 backdrop-blur-xl px-5 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-mist/60 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-accent" />
          <span className="text-white font-medium text-sm">Property Details</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-8 space-y-8">
        {/* Image Carousel */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative rounded-2xl overflow-hidden border border-white/10 group">
          <img
            src={getImageUrl(imageList[imgIdx])}
            alt={`${title} — ${imgIdx + 1}`}
            className="w-full h-64 md:h-80 object-cover transition-opacity duration-300"
          />

          {imageList.length > 1 && (
            <>
              {/* Left arrow */}
              <button
                onClick={prevImg}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-night/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-night/80"
              >
                <ChevronLeft size={20} />
              </button>
              {/* Right arrow */}
              <button
                onClick={nextImg}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-night/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-night/80"
              >
                <ChevronRight size={20} />
              </button>
              {/* Counter badge */}
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-night/60 backdrop-blur-sm border border-white/10 text-white text-xs font-medium">
                {imgIdx + 1} / {imageList.length}
              </div>
              {/* Dot indicators */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                {imageList.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === imgIdx ? 'w-5 bg-accent' : 'w-1.5 bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — Details */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
                {type}
              </span>
              <h1 className="text-2xl md:text-3xl text-white font-semibold mt-3">{title}</h1>
              <div className="flex items-center gap-1.5 text-mist/50 text-sm mt-1">
                <MapPin size={14} /> {address}, {city}
              </div>
            </motion.div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm">
                <IndianRupee size={14} className="text-accent" />
                <span className="text-white font-medium">₹{price?.toLocaleString('en-IN')}</span>
                <span className="text-mist/40">/mo</span>
              </div>
              {deposit > 0 && (
                <div className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-mist/60">
                  Deposit: ₹{deposit?.toLocaleString('en-IN')}
                </div>
              )}
              <div className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-mist/60 capitalize">
                {gender}
              </div>
              <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-mist/60">
                <Eye size={14} /> {viewsCount} views
              </div>
            </div>

            {description && (
              <div>
                <h3 className="text-white font-medium text-sm mb-2">Description</h3>
                <p className="text-mist/60 text-sm leading-relaxed">{description}</p>
              </div>
            )}

            {amenities?.length > 0 && (
              <div>
                <h3 className="text-white font-medium text-sm mb-2">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((a) => (
                    <span key={a} className="text-xs px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent/80">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact & Map */}
            {(contactNumber || googleMapLink) && (
              <div className="space-y-3">
                <h3 className="text-white font-medium text-sm">Contact & Location</h3>
                <div className="flex flex-wrap gap-3">
                  {contactNumber && (
                    <a
                      href={`https://wa.me/${contactNumber.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/25 text-green-400 text-sm hover:bg-green-500/20 transition-colors"
                    >
                      <MessageCircle size={16} />
                      <span>WhatsApp: {contactNumber}</span>
                      <ExternalLink size={12} className="text-green-400/50" />
                    </a>
                  )}
                  {contactNumber && (
                    <a
                      href={`tel:${contactNumber.replace(/[^0-9+]/g, '')}`}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-400 text-sm hover:bg-blue-500/20 transition-colors"
                    >
                      <Phone size={16} />
                      <span>Call: {contactNumber}</span>
                    </a>
                  )}
                  {googleMapLink && (
                    <a
                      href={googleMapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm hover:bg-red-500/20 transition-colors"
                    >
                      <MapPin size={16} />
                      <span>View on Google Maps</span>
                      <ExternalLink size={12} className="text-red-400/50" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right — Owner + Save + Inquiry */}
          <div className="space-y-5">
            {/* Owner Card */}
            {owner && (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                <h3 className="text-white font-medium text-sm">Listed by</h3>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent text-xs font-bold">
                    {owner.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white text-sm">{owner.name}</p>
                    <p className="text-mist/50 text-xs">{owner.email}</p>
                  </div>
                </div>
                {owner.contactNumber && (
                  <div className="flex items-center gap-2 text-mist/50 text-xs">
                    <Phone size={12} /> {owner.contactNumber}
                  </div>
                )}
              </div>
            )}

            {/* Save Button (user only) */}
            {role === 'user' && token && (
              <button
                onClick={handleSave}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  saved
                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                }`}
              >
                <Heart size={16} className={saved ? 'fill-red-400' : ''} />
                {saved ? 'Saved' : 'Save Property'}
              </button>
            )}

            {/* Inquiry (user only) */}
            {role === 'user' && token && (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                <h3 className="text-white font-medium text-sm flex items-center gap-2">
                  <MessageSquare size={14} /> Send Inquiry
                </h3>
                {inquirySent ? (
                  <p className="text-green-400 text-sm">Inquiry sent successfully!</p>
                ) : (
                  <form onSubmit={handleInquiry} className="space-y-3">
                    <textarea
                      value={inquiryMsg}
                      onChange={(e) => setInquiryMsg(e.target.value)}
                      rows={3}
                      required
                      placeholder="I'm interested in this property…"
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-white text-sm outline-none focus:border-accent/50 resize-none placeholder:text-mist/30"
                    />
                    {inquiryError && <p className="text-red-400 text-xs">{inquiryError}</p>}
                    <button type="submit" className="w-full py-2.5 rounded-xl bg-accent text-night font-medium text-sm hover:bg-accent/90 transition-colors">
                      Send Inquiry
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Reviews & Ratings Section ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="border-t border-white/10 pt-8 space-y-6"
        >
          {/* Header with average */}
          <div className="flex items-center gap-4">
            <h2 className="text-white text-lg font-semibold">Reviews & Ratings</h2>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
                <Star size={14} className="fill-accent text-accent" />
                <span className="text-accent font-semibold text-sm">{avgRating.toFixed(1)}</span>
                <span className="text-mist/40 text-xs">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
              </div>
            )}
          </div>

          {/* Review Form (user only) */}
          {role === 'user' && token && (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
              <h3 className="text-white font-medium text-sm">
                {myReview ? 'Update Your Review' : 'Write a Review'}
              </h3>

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {/* Star Selector */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setReviewHover(star)}
                      onMouseLeave={() => setReviewHover(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        size={24}
                        className={`transition-colors ${
                          star <= (reviewHover || reviewRating)
                            ? 'fill-accent text-accent'
                            : 'text-white/20'
                        }`}
                      />
                    </button>
                  ))}
                  {reviewRating > 0 && (
                    <span className="text-mist/40 text-xs ml-2">
                      {reviewRating === 1 && 'Poor'}
                      {reviewRating === 2 && 'Fair'}
                      {reviewRating === 3 && 'Good'}
                      {reviewRating === 4 && 'Very Good'}
                      {reviewRating === 5 && 'Excellent'}
                    </span>
                  )}
                </div>

                {/* Comment */}
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Share your experience…"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-white text-sm outline-none focus:border-accent/50 resize-none placeholder:text-mist/30"
                />
                <div className="text-right text-mist/30 text-[10px]">{reviewComment.length}/500</div>

                {reviewError && <p className="text-red-400 text-xs">{reviewError}</p>}

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-accent text-night font-medium text-sm hover:bg-accent/90 transition-colors disabled:opacity-50"
                  >
                    {reviewSubmitting ? 'Submitting…' : myReview ? 'Update Review' : 'Submit Review'}
                  </button>

                  {myReview && (
                    <button
                      type="button"
                      onClick={() => handleDeleteReview(myReview._id)}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Review List */}
          {reviews.length === 0 ? (
            <p className="text-mist/40 text-sm">No reviews yet. Be the first to review!</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <motion.div
                  key={rev._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent text-xs font-bold">
                        {rev.user?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{rev.user?.name || 'User'}</p>
                        <p className="text-mist/40 text-[11px]">
                          {new Date(rev.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={13}
                          className={s <= rev.rating ? 'fill-accent text-accent' : 'text-white/15'}
                        />
                      ))}
                    </div>
                  </div>

                  {rev.comment && (
                    <p className="text-mist/60 text-sm leading-relaxed pl-11">{rev.comment}</p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
