import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';
import PropertyCard from '../components/PropertyCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import MapView from '../components/MapView';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Search as SearchIcon,
  SlidersHorizontal,
  X,
  Home,
  Bookmark,
  MessageSquare,
  LayoutDashboard,
  MapPin,
  Crosshair,
  Map as MapIcon,
  List,
} from 'lucide-react';

/* ── Sidebar nav ── */
const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Search', path: '/search', icon: SearchIcon },
  { label: 'Saved', path: '/saved', icon: Bookmark },
  { label: 'My Inquiries', path: '/inquiries', icon: MessageSquare },
];

/* ── Constants ── */
const TYPES = ['pg', 'hostel', 'dormitory'];
const GENDERS = ['male', 'female', 'unisex'];
const AMENITIES = [
  'WiFi', 'AC', 'Parking', 'Laundry', 'Gym',
  'Power Backup', 'Kitchen', 'TV', 'Security', 'CCTV',
];
const RADIUS_OPTIONS = [
  { label: '2 km', value: 2 },
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '20 km', value: 20 },
  { label: '50 km', value: 50 },
];

/* ── Well-known city coords for text search → map center ── */
const CITY_COORDS = {
  bangalore: { lat: 12.9716, lng: 77.5946 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  delhi: { lat: 28.7041, lng: 77.1025 },
  'new delhi': { lat: 28.6139, lng: 77.209 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  pune: { lat: 18.5204, lng: 73.8567 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
  chandigarh: { lat: 30.7333, lng: 76.7794 },
  indore: { lat: 22.7196, lng: 75.8577 },
  nagpur: { lat: 21.1458, lng: 79.0882 },
  bhopal: { lat: 23.2599, lng: 77.4126 },
  kochi: { lat: 9.9312, lng: 76.2673 },
  gurgaon: { lat: 28.4595, lng: 77.0266 },
  gurugram: { lat: 28.4595, lng: 77.0266 },
  noida: { lat: 28.5355, lng: 77.391 },
};

const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 };

export default function SearchPage() {
  const { token } = useAuth();
  const [params] = useSearchParams();

  /* ── Data state ── */
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [savedIds, setSavedIds] = useState([]);

  /* ── UI state ── */
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState('');

  /* ── Filter state ── */
  const [type, setType] = useState(params.get('type') || '');
  const [city, setCity] = useState(params.get('city') || '');
  const [search, setSearch] = useState(params.get('q') || '');
  const [gender, setGender] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  /* ── Geo state ── */
  const [geoMode, setGeoMode] = useState(false);
  const [radius, setRadius] = useState(10);
  const [userLat, setUserLat] = useState(null);
  const [userLng, setUserLng] = useState(null);

  const limit = 12;

  /* ── Map center derived from geo coords or city name ── */
  const mapCenter = useMemo(() => {
    if (userLat && userLng) return { lat: userLat, lng: userLng };
    const key = (city || '').toLowerCase().trim();
    if (CITY_COORDS[key]) return CITY_COORDS[key];
    return DEFAULT_CENTER;
  }, [userLat, userLng, city]);

  /* ── Fetch: text-based search ── */
  const fetchByText = useCallback(
    async (pg = 1) => {
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
        setTotal(data.pagination?.total || data.total || 0);
        setPage(pg);
      } catch {
        setProperties([]);
      } finally {
        setLoading(false);
      }
    },
    [type, city, search, gender, minPrice, maxPrice, selectedAmenities]
  );

  /* ── Fetch: geo-based search ── */
  const fetchByGeo = useCallback(
    async (lat, lng, rad = radius) => {
      if (!lat || !lng) return;
      setLoading(true);
      try {
        const q = new URLSearchParams();
        q.set('lat', lat);
        q.set('lng', lng);
        q.set('radius', rad);
        if (type) q.set('type', type);

        const data = await apiRequest(`/properties/near?${q.toString()}`);
        setProperties(data.properties || []);
        setTotal(data.properties?.length || 0);
        setPage(1);
      } catch {
        setProperties([]);
      } finally {
        setLoading(false);
      }
    },
    [type, radius]
  );

  /* ── Unified fetch ── */
  const doSearch = useCallback(
    (pg = 1) => {
      if (geoMode && userLat && userLng) {
        fetchByGeo(userLat, userLng, radius);
      } else {
        fetchByText(pg);
      }
    },
    [geoMode, userLat, userLng, radius, fetchByGeo, fetchByText]
  );

  /* ── "Use My Location" ── */
  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLat(latitude);
        setUserLng(longitude);
        setGeoMode(true);
        setLocating(false);
        fetchByGeo(latitude, longitude, radius);
      },
      (err) => {
        setLocating(false);
        setGeoError(
          err.code === 1
            ? 'Location permission denied. Please allow location access.'
            : 'Unable to retrieve your location.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  /* ── Switch back to text search ── */
  const switchToTextSearch = () => {
    setGeoMode(false);
    setUserLat(null);
    setUserLng(null);
    setGeoError('');
  };

  /* ── Fetch saved IDs ── */
  useEffect(() => {
    if (!token) return;
    apiRequest('/users/saved', { token })
      .then((res) => setSavedIds((res.properties || []).map((p) => p._id)))
      .catch(() => {});
  }, [token]);

  /* ── Auto-search on filter change ── */
  useEffect(() => {
    doSearch(1);
  }, [doSearch]);

  /* ── Helpers ── */
  const toggleAmenity = (a) =>
    setSelectedAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );

  const clearFilters = () => {
    setType('');
    setCity('');
    setSearch('');
    setGender('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedAmenities([]);
    switchToTextSearch();
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

  const handleRadiusChange = (r) => {
    setRadius(r);
    if (geoMode && userLat && userLng) {
      fetchByGeo(userLat, userLng, r);
    }
  };

  /* ────────────────────── RENDER ────────────────────── */
  return (
    <DashboardLayout navItems={navItems}>
      <div className="space-y-4">
        {/* ── Top Bar ── */}
        <div className="flex flex-wrap gap-3">
          {/* Search input */}
          <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4">
            <SearchIcon size={16} className="text-mist/40 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (geoMode) switchToTextSearch();
              }}
              onKeyDown={(e) => e.key === 'Enter' && doSearch(1)}
              placeholder="Search by name, city, address…"
              className="flex-1 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-mist/30"
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              filtersOpen
                ? 'bg-accent/10 border-accent/30 text-accent'
                : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
            }`}
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filters</span>
          </button>

          {/* Use My Location */}
          <button
            onClick={handleUseLocation}
            disabled={locating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors bg-white/5 border-white/10 text-white hover:bg-white/10 disabled:opacity-50"
          >
            {locating ? (
              <span className="h-4 w-4 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
            ) : (
              <Crosshair size={16} />
            )}
            <span className="hidden sm:inline">
              {locating ? 'Locating…' : 'My Location'}
            </span>
          </button>

          {/* Mobile map / list toggle */}
          <button
            onClick={() => setShowMap((v) => !v)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            {showMap ? <List size={16} /> : <MapIcon size={16} />}
            <span className="hidden sm:inline">{showMap ? 'List' : 'Map'}</span>
          </button>
        </div>

        {/* ── Geo status ── */}
        {geoMode && (
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-accent">
              <MapPin size={12} />
              Showing properties within {radius} km of your location
            </span>
            <button
              onClick={switchToTextSearch}
              className="text-mist/40 hover:text-white transition-colors underline"
            >
              Switch to text search
            </button>
          </div>
        )}

        {geoError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {geoError}
          </div>
        )}

        {/* ── Radius selector ── */}
        {geoMode && (
          <div className="flex items-center gap-2">
            <span className="text-mist/50 text-xs">Radius:</span>
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r.value}
                onClick={() => handleRadiusChange(r.value)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  radius === r.value
                    ? 'bg-accent/20 border-accent/40 text-accent'
                    : 'bg-white/5 border-white/10 text-mist/50 hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Filters Panel ── */}
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
                  <button onClick={clearFilters} className="text-xs text-accent hover:underline">
                    Clear all
                  </button>
                </div>

                {/* Row 1: Type, Gender, City */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-mist/50 text-xs mb-1 block">Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
                    >
                      <option value="">All</option>
                      {TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-mist/50 text-xs mb-1 block">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
                    >
                      <option value="">All</option>
                      {GENDERS.map((g) => (
                        <option key={g} value={g}>
                          {g.charAt(0).toUpperCase() + g.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-mist/50 text-xs mb-1 block">City</label>
                    <input
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        if (geoMode) switchToTextSearch();
                      }}
                      placeholder="e.g. Mumbai"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none placeholder:text-mist/30"
                    />
                  </div>
                </div>

                {/* Row 2: Price Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-mist/50 text-xs mb-1 block">Min Price</label>
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="₹0"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none placeholder:text-mist/30"
                    />
                  </div>
                  <div>
                    <label className="text-mist/50 text-xs mb-1 block">Max Price</label>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="₹50,000"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none placeholder:text-mist/30"
                    />
                  </div>
                </div>

                {/* Row 3: Amenities */}
                <div>
                  <label className="text-mist/50 text-xs mb-2 block">Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {AMENITIES.map((a) => (
                      <button
                        key={a}
                        onClick={() => toggleAmenity(a)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          selectedAmenities.includes(a)
                            ? 'bg-accent/20 border-accent/40 text-accent'
                            : 'bg-white/5 border-white/10 text-mist/50 hover:text-white'
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => doSearch(1)}
                  className="w-full py-2.5 rounded-xl bg-accent text-night font-medium text-sm hover:bg-accent/90 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results count */}
        <div className="text-mist/50 text-sm">{total} properties found</div>

        {/* ── Split Layout: Cards + Map ── */}
        <div className="flex gap-5 items-start" style={{ minHeight: '70vh' }}>
          {/* Left — Property cards */}
          <div
            className={`${
              showMap ? 'hidden lg:block' : 'block'
            } w-full lg:w-1/2 space-y-5 overflow-y-auto pr-1`}
            style={{ maxHeight: '75vh' }}
          >
            {loading ? (
              <LoadingSkeleton />
            ) : properties.length === 0 ? (
              <div className="text-center py-20">
                <Home size={40} className="mx-auto text-mist/20 mb-3" />
                <p className="text-mist/40 text-sm">
                  No properties found. Try adjusting your filters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {properties.map((p, idx) => (
                  <PropertyCard
                    key={p._id}
                    property={p}
                    saved={savedIds.includes(p._id)}
                    onSave={() => handleSave(p._id)}
                    index={idx}
                  />
                ))}
              </div>
            )}

            {/* Pagination (text mode only) */}
            {!geoMode && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4 pb-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => doSearch(pg)}
                    className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${
                      pg === page
                        ? 'bg-accent text-night'
                        : 'bg-white/5 text-mist/60 hover:bg-white/10'
                    }`}
                  >
                    {pg}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right — Google Map */}
          <div
            className={`${
              showMap ? 'block' : 'hidden lg:block'
            } w-full lg:w-1/2 sticky top-4`}
            style={{ height: '75vh' }}
          >
            <MapView
              properties={properties}
              center={mapCenter}
              zoom={geoMode ? 13 : 12}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
