import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { apiRequest, api, getImageUrl } from '../lib/api';
import DashboardLayout from '../components/DashboardLayout';
import {
  PlusCircle, List, MessageSquare, BarChart3, LayoutDashboard,
  ImagePlus, X, Upload,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, end: true },
  { label: 'Add Property', to: '/owner/add-property', icon: PlusCircle },
  { label: 'My Properties', to: '/owner/properties', icon: List },
  { label: 'Inquiries', to: '/owner/inquiries', icon: MessageSquare },
  { label: 'Analytics', to: '/owner/analytics', icon: BarChart3 },
];

const AMENITY_OPTIONS = [
  'WiFi', 'AC', 'Parking', 'Laundry', 'Gym', 'Power Backup',
  'Kitchen', 'TV', 'Fridge', 'Geyser', 'Security', 'CCTV',
];

export default function AddProperty() {
  const { id: editId } = useParams(); // present when editing
  const isEdit = Boolean(editId);
  const [params] = useSearchParams();
  const preType = params.get('type') || 'pg';
  const navigate = useNavigate();
  const { token } = useAuth();

  const [form, setForm] = useState({
    title: '',
    type: preType,
    price: '',
    deposit: '',
    gender: 'unisex',
    address: '',
    city: '',
    description: '',
    lat: '',
    lng: '',
    contactNumber: '',
    googleMapLink: '',
  });
  const [amenities, setAmenities] = useState([]);
  const [photos, setPhotos] = useState([]); // { file, preview } for new uploads
  const [existingImages, setExistingImages] = useState([]); // URL strings from server
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState('');

  // Fetch existing property when editing
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await apiRequest(`/properties/${editId}`, { token });
        const p = res.property;
        setForm({
          title: p.title || '',
          type: p.type || 'pg',
          price: p.price ?? '',
          deposit: p.deposit ?? '',
          gender: p.gender || 'unisex',
          address: p.address || '',
          city: p.city || '',
          description: p.description || '',
          lat: p.location?.coordinates?.[1] ?? '',
          lng: p.location?.coordinates?.[0] ?? '',
          contactNumber: p.contactNumber || '',
          googleMapLink: p.googleMapLink || '',
        });
        setAmenities(p.amenities || []);
        setExistingImages(p.images || []);
      } catch {
        setError('Failed to load property data');
      } finally {
        setFetching(false);
      }
    })();
  }, [editId, isEdit, token]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleAmenity = (a) => {
    setAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const remaining = 6 - photos.length - existingImages.length;
    const selected = files.slice(0, remaining).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...selected]);
    e.target.value = '';
  };

  const removePhoto = (idx) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const removeExistingImage = (idx) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadPhotos = async () => {
    if (photos.length === 0) return [];
    const formData = new FormData();
    photos.forEach((p) => formData.append('images', p.file));

    const res = await api.post('/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data.urls || [];
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Upload new images (if any)
      setUploading(true);
      const newImageUrls = await uploadPhotos();
      setUploading(false);

      // 2. Combine existing + newly uploaded image URLs
      const allImages = [...existingImages, ...newImageUrls];

      // 3. Build body
      const body = {
        ...form,
        price: Number(form.price),
        deposit: Number(form.deposit) || 0,
        amenities,
        images: allImages,
        contactNumber: form.contactNumber,
        googleMapLink: form.googleMapLink,
        location: form.lat && form.lng
          ? { type: 'Point', coordinates: [Number(form.lng), Number(form.lat)] }
          : undefined,
      };

      if (isEdit) {
        await apiRequest(`/properties/${editId}`, { method: 'PUT', body, token });
      } else {
        await apiRequest('/properties', { method: 'POST', body, token });
      }
      navigate('/owner/properties');
    } catch (err) {
      setUploading(false);
      setError(err?.response?.data?.message || err.message || `Failed to ${isEdit ? 'update' : 'add'} property`);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-white text-sm outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all placeholder:text-mist/30';

  return (
    <DashboardLayout navItems={navItems}>
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl text-white font-semibold">{isEdit ? 'Edit Property' : 'Add Property'}</h1>
          <p className="text-mist/60 text-sm mt-1">{isEdit ? 'Update the details of your property.' : 'Fill in the details to list your property.'}</p>
        </motion.div>

        {fetching ? (
          <div className="text-mist/40 text-sm text-center py-16">Loading property data…</div>
        ) : (<>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Title */}
          <label className="block text-sm text-mist/70">
            Title
            <input name="title" value={form.title} onChange={onChange} required className={`mt-1 ${inputClass}`} placeholder="e.g. Cozy PG near IIT Gate" />
          </label>

          {/* Type + Gender */}
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm text-mist/70">
              Type
              <select name="type" value={form.type} onChange={onChange} className={`mt-1 ${inputClass}`}>
                <option value="pg">PG</option>
                <option value="hostel">Hostel</option>
                <option value="dormitory">Dormitory</option>
              </select>
            </label>
            <label className="block text-sm text-mist/70">
              Gender
              <select name="gender" value={form.gender} onChange={onChange} className={`mt-1 ${inputClass}`}>
                <option value="unisex">Unisex</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>
          </div>

          {/* Price + Deposit */}
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm text-mist/70">
              Price (₹/month)
              <input name="price" type="number" value={form.price} onChange={onChange} required className={`mt-1 ${inputClass}`} placeholder="5000" />
            </label>
            <label className="block text-sm text-mist/70">
              Deposit (₹)
              <input name="deposit" type="number" value={form.deposit} onChange={onChange} className={`mt-1 ${inputClass}`} placeholder="10000" />
            </label>
          </div>

          {/* Address + City */}
          <label className="block text-sm text-mist/70">
            Address
            <input name="address" value={form.address} onChange={onChange} required className={`mt-1 ${inputClass}`} placeholder="Full address" />
          </label>
          <label className="block text-sm text-mist/70">
            City
            <input name="city" value={form.city} onChange={onChange} required className={`mt-1 ${inputClass}`} placeholder="e.g. Mumbai" />
          </label>

          {/* Lat + Lng */}
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm text-mist/70">
              Latitude (optional)
              <input name="lat" type="number" step="any" value={form.lat} onChange={onChange} className={`mt-1 ${inputClass}`} placeholder="19.076" />
            </label>
            <label className="block text-sm text-mist/70">
              Longitude (optional)
              <input name="lng" type="number" step="any" value={form.lng} onChange={onChange} className={`mt-1 ${inputClass}`} placeholder="72.877" />
            </label>
          </div>

          {/* Description */}
          <label className="block text-sm text-mist/70">
            Description
            <textarea name="description" value={form.description} onChange={onChange} rows={3} className={`mt-1 ${inputClass} resize-none`} placeholder="Describe the property…" />
          </label>

          {/* Contact Number + Google Map */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block text-sm text-mist/70">
              <span className="flex items-center gap-1.5">📞 Contact / WhatsApp Number</span>
              <input name="contactNumber" value={form.contactNumber} onChange={onChange} className={`mt-1 ${inputClass}`} placeholder="e.g. +91 9876543210" />
            </label>
            <label className="block text-sm text-mist/70">
              <span className="flex items-center gap-1.5">📍 Google Map Link</span>
              <input name="googleMapLink" value={form.googleMapLink} onChange={onChange} className={`mt-1 ${inputClass}`} placeholder="https://maps.google.com/..." />
            </label>
          </div>

          {/* Photos */}
          <div>
            <p className="text-sm text-mist/70 mb-2">Property Photos <span className="text-mist/40">(max 6)</span></p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Existing Images (from server) */}
            {existingImages.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-3">
                {existingImages.map((url, idx) => (
                  <div key={`existing-${idx}`} className="relative group rounded-xl overflow-hidden border border-white/10 aspect-[4/3]">
                    <img src={getImageUrl(url)} alt={`Existing ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(idx)}
                      className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-night/70 backdrop-blur-sm flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-opacity border border-white/10"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New Photo Previews */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-3">
                {photos.map((p, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-white/10 aspect-[4/3]">
                    <img src={p.preview} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-night/70 backdrop-blur-sm flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-opacity border border-white/10"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {(photos.length + existingImages.length) < 6 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] hover:border-accent/30 hover:bg-white/[0.04] transition-colors cursor-pointer"
              >
                <ImagePlus size={28} className="text-mist/30" />
                <span className="text-sm text-mist/50">Click to add photos</span>
                <span className="text-xs text-mist/30">{photos.length + existingImages.length}/6 • JPG, PNG, WEBP up to 5 MB</span>
              </button>
            )}
          </div>

          {/* Amenities */}
          <div>
            <p className="text-sm text-mist/70 mb-2">Amenities</p>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    amenities.includes(a)
                      ? 'bg-accent/15 border-accent/40 text-accent'
                      : 'bg-white/5 border-white/10 text-mist/50 hover:border-white/20'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-night font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <><Upload size={16} className="animate-bounce" /> Uploading photos…</>
            ) : loading ? (
              isEdit ? 'Updating…' : 'Adding…'
            ) : (
              isEdit ? 'Update Property' : 'Add Property'
            )}
          </button>
        </form>
        </>)}
      </div>
    </DashboardLayout>
  );
}
