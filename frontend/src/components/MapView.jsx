import { useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  InfoWindowF,
  MarkerClustererF,
} from '@react-google-maps/api';
import { IndianRupee, MapPin, ExternalLink } from 'lucide-react';

const containerStyle = { width: '100%', height: '100%' };

const darkMapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8aa0' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#b8b8d0' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#2a2a40' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f1f35' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#3a3a55' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0e1a2b' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4a6fa5' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#1e1e34' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6a6a80' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#22223a' }],
  },
];

const CLUSTER_OPTIONS = {
  gridSize: 60,
  maxZoom: 15,
  styles: [
    {
      textColor: '#0a0a14',
      textSize: 13,
      url: 'data:image/svg+xml;charset=UTF-8,' +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="20" cy="20" r="18" fill="#6ae3d9" stroke="#0a0a14" stroke-width="2"/></svg>'
        ),
      height: 40,
      width: 40,
    },
  ],
};

const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 }; // Bangalore

/**
 * MapView — displays property markers on a Google Map.
 *
 * Props:
 *   properties  – array of property docs (with location.coordinates [lng, lat])
 *   center      – { lat, lng } to center the map on
 *   zoom        – optional initial zoom (default 12)
 *   loading     – show shimmer overlay while data loads
 *   onMapClick  – optional callback when map background is clicked
 */
export default function MapView({
  properties = [],
  center,
  zoom = 12,
  loading = false,
  onMapClick,
}) {
  const navigate = useNavigate();

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    // libraries loaded once globally; keep stable reference
  });

  const [activeMarker, setActiveMarker] = useState(null);
  const mapRef = useRef(null);

  // Stable map options to prevent re-renders
  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: false,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: true,
      styles: darkMapStyles,
      clickableIcons: false,
    }),
    []
  );

  const mapCenter = useMemo(
    () => center || DEFAULT_CENTER,
    [center]
  );

  const onLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const handleMarkerClick = useCallback((id) => {
    setActiveMarker((prev) => (prev === id ? null : id));
  }, []);

  const handleInfoClose = useCallback(() => {
    setActiveMarker(null);
  }, []);

  // ───── Render states ─────
  if (loadError) {
    return (
      <div className="h-full flex items-center justify-center bg-night/50 rounded-2xl border border-white/10">
        <p className="text-red-400 text-sm">Failed to load Google Maps</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-night/50 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2 text-mist/50 text-sm">
          <span className="h-4 w-4 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
          Loading map…
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden border border-white/10">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 bg-night/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center gap-2 text-mist/60 text-sm">
            <span className="h-4 w-4 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
            Searching nearby…
          </div>
        </div>
      )}

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={zoom}
        options={mapOptions}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={(e) => {
          handleInfoClose();
          onMapClick?.(e);
        }}
      >
        <MarkerClustererF options={CLUSTER_OPTIONS}>
          {(clusterer) =>
            properties.map((property) => {
              const coords = property.location?.coordinates;
              if (!coords || (coords[0] === 0 && coords[1] === 0)) return null;

              const position = { lat: coords[1], lng: coords[0] };

              return (
                <MarkerF
                  key={property._id}
                  position={position}
                  clusterer={clusterer}
                  onClick={() => handleMarkerClick(property._id)}
                  icon={{
                    url:
                      'data:image/svg+xml;charset=UTF-8,' +
                      encodeURIComponent(
                        `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
                          <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24s16-12 16-24C32 7.16 24.84 0 16 0z" fill="#6ae3d9"/>
                          <circle cx="16" cy="15" r="7" fill="#0a0a14"/>
                        </svg>`
                      ),
                    scaledSize: new window.google.maps.Size(32, 40),
                    anchor: new window.google.maps.Point(16, 40),
                  }}
                >
                  {activeMarker === property._id && (
                    <InfoWindowF
                      position={position}
                      onCloseClick={handleInfoClose}
                    >
                      <div className="min-w-[200px] max-w-[260px] p-1 text-gray-900">
                        <h3 className="font-semibold text-sm leading-tight mb-1 line-clamp-2">
                          {property.title}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                          <MapPin size={12} />
                          <span className="line-clamp-1">
                            {property.address || property.city}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 text-sm font-bold text-emerald-700 mb-2">
                          <IndianRupee size={14} />
                          {property.price?.toLocaleString('en-IN')}/mo
                        </div>
                        <button
                          onClick={() => navigate(`/property/${property._id}`)}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors"
                        >
                          View Details
                          <ExternalLink size={12} />
                        </button>
                      </div>
                    </InfoWindowF>
                  )}
                </MarkerF>
              );
            })
          }
        </MarkerClustererF>
      </GoogleMap>
    </div>
  );
}
