import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, IndianRupee, Heart } from 'lucide-react';
import { getImageUrl } from '../lib/api';

const typeColors = {
  pg: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  hostel: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  dormitory: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

export default function PropertyCard({
  property,
  index = 0,
  isSaved = false,
  saved,
  onToggleSave,
  onSave,
  showSaveBtn,
}) {
  const isPropertySaved = saved ?? isSaved;
  const handleSave = onSave || onToggleSave;
  const shouldShowSave = showSaveBtn ?? !!handleSave;
  const {
    _id, title, type, price, address, city, images, gender, amenities,
  } = property;

  const img = getImageUrl(images?.[0]) || 'https://placehold.co/400x240/1a1a2e/6ae3d9?text=No+Image';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * index, duration: 0.4 }}
      className="group rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 flex flex-col"
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={img}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <span className={`absolute top-3 left-3 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border font-medium ${typeColors[type] || typeColors.pg}`}>
          {type}
        </span>
        {shouldShowSave && (
          <button
            onClick={(e) => { e.preventDefault(); handleSave?.(_id); }}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-night/60 backdrop-blur-sm flex items-center justify-center border border-white/10 hover:bg-night/80 transition-colors"
          >
            <Heart size={14} className={isPropertySaved ? 'fill-red-400 text-red-400' : 'text-white/60'} />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 p-4 flex flex-col gap-2">
        <Link to={`/property/${_id}`} className="block">
          <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 hover:text-accent transition-colors">
            {title}
          </h3>
        </Link>

        <div className="flex items-center gap-1 text-mist/50 text-xs">
          <MapPin size={12} />
          <span className="truncate">{address}, {city}</span>
        </div>

        {amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {amenities.slice(0, 3).map((a) => (
              <span key={a} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-mist/50">
                {a}
              </span>
            ))}
            {amenities.length > 3 && (
              <span className="text-[10px] text-mist/40">+{amenities.length - 3}</span>
            )}
          </div>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between border-t border-white/5">
          <div className="flex items-center gap-1 text-accent font-semibold text-sm">
            <IndianRupee size={14} />
            {price?.toLocaleString('en-IN')}<span className="text-mist/40 text-xs font-normal">/mo</span>
          </div>
          {gender && gender !== 'unisex' && (
            <span className="text-[10px] uppercase tracking-wider text-mist/40 border border-white/10 rounded-full px-2 py-0.5">
              {gender}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
