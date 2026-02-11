import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';
import PropertyCard from '../components/PropertyCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Search as SearchIcon, SlidersHorizontal, X,
  Home, Bookmark, MessageSquare, LayoutDashboard,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Search', path: '/search', icon: SearchIcon },
  { label: 'Saved', path: '/saved', icon: Bookmark },
  { label: 'My Inquiries', path: '/inquiries', icon: MessageSquare },
];

const TYPES = ['pg', 'hostel', 'dormitory'];
const GENDERS = ['male', 'female', 'unisex'];
const AMENITIES = ['WiFi', 'AC', 'Parking', 'Laundry', 'Gym', 'Power Backup', 'Kitchen', 'TV', 'Security', 'CCTV'];

export default function SearchPage() {
  const { token } = useAuth();
  const [params, setParams] = useSearchParams();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [savedIds, setSavedIds] = useState([]);

  // Filter state
  const [type, setType] = useState(params.get('type') || '');
  const [city, setCity] = useState(params.get('city') || '');
  const [search, setSearch] = useState(params.get('q') || '');
  const [gender, setGender] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  const limit = 9;

  const fetchProperties = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (type) q.set('type', type);
      if (city) q.set('city', city);
      if (search) q.set('search', search);
      if (gender) q.set('gender', gender);
      if (minPrice) q.set('minPrice', minPrice);
      if (maxPrice) q.set('maxPrice', maxPrice);
      if (selectedAmenities.length) q.set('amenities', selectedAmenities.join(','));
      q.set('page', pg);
      q.set('limit', limit);

      const data = await apiRequest(`/properties?${q.toString()}`);
      setProperties(data.properties || []);
      setTotal(data.total || 0);
      setPage(pg);
    } catch {
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [type, city, search, gender, minPrice, maxPrice, selectedAmenities]);

  // Fetch saved IDs
  useEffect(() => {
    if (!token) return;
    apiRequest('/users/saved', { token })
      .then((res) => setSavedIds((res.properties || []).map((p) => p._id)))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    fetchProperties(1);
  }, [fetchProperties]);

  const toggleAmenity = (a) =>
    setSelectedAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const clearFilters = () => {
    setType(''); setCity(''); setSearch(''); setGender('');
    setMinPrice(''); setMaxPrice(''); setSelectedAmenities([]);
  };

  const totalPages = Math.ceil(total / limit);

  const handleSave = async (propertyId) => {
    try {
      if (savedIds.includes(propertyId)) {
        await apiRequest(`/users/save/${propertyId}`, { method: 'DELETE', token });
        setSavedIds((p) => p.filter((x) => x !== propertyId));
      } else {
        await apiRequest(`/users/save/${propertyId}`, { method: 'POST', token });
        setSavedIds((p) => [...p, propertyId]);
      }
    } catch {}
  };

  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-6">
        {/* Search Bar + Filter Toggle */}
        <div className="flex gap-3">
          <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4">
            <SearchIcon size={16} className="text-mist/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchProperties(1)}
              placeholder="Search by name, city, address…"
              className="flex-1 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-mist/30"
            />
          </div>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              filtersOpen ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
            }`}
          >
            <SlidersHorizontal size={16} />
            Filters
          </button>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-white text-sm font-medium">Filters</h3>
                  <button onClick={clearFilters} className="text-xs text-accent hover:underline">Clear all</button>
                </div>

                {/* Row 1: Type, Gender, City */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-mist/50 text-xs mb-1 block">Type</label>
                    <select value={type} onChange={(e) => setType(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none">
                      <option value="">All</option>
                      {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-mist/50 text-xs mb-1 block">Gender</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none">
                      <option value="">All</option>
                      {GENDERS.map((g) => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-mist/50 text-xs mb-1 block">City</label>
                    <input value={city} onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Mumbai"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none placeholder:text-mist/30" />
                  </div>
                </div>

                {/* Row 2: Price Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-mist/50 text-xs mb-1 block">Min Price</label>
                    <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="₹0" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none placeholder:text-mist/30" />
                  </div>
                  <div>
                    <label className="text-mist/50 text-xs mb-1 block">Max Price</label>
                    <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="₹50,000" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none placeholder:text-mist/30" />
                  </div>
                </div>

                {/* Row 3: Amenities */}
                <div>
                  <label className="text-mist/50 text-xs mb-2 block">Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {AMENITIES.map((a) => (
                      <button key={a} onClick={() => toggleAmenity(a)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          selectedAmenities.includes(a)
                            ? 'bg-accent/20 border-accent/40 text-accent'
                            : 'bg-white/5 border-white/10 text-mist/50 hover:text-white'
                        }`}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={() => fetchProperties(1)}
                  className="w-full py-2.5 rounded-xl bg-accent text-night font-medium text-sm hover:bg-accent/90 transition-colors">
                  Apply Filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results count */}
        <div className="text-mist/50 text-sm">{total} properties found</div>

        {/* Grid */}
        {loading ? (
          <LoadingSkeleton />
        ) : properties.length === 0 ? (
          <div className="text-center py-20">
            <Home size={40} className="mx-auto text-mist/20 mb-3" />
            <p className="text-mist/40 text-sm">No properties found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {properties.map((p) => (
              <PropertyCard
                key={p._id}
                property={p}
                saved={savedIds.includes(p._id)}
                onSave={() => handleSave(p._id)}
                index={properties.indexOf(p)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                onClick={() => fetchProperties(pg)}
                className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${
                  pg === page ? 'bg-accent text-night' : 'bg-white/5 text-mist/60 hover:bg-white/10'
                }`}
              >
                {pg}
              </button>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
