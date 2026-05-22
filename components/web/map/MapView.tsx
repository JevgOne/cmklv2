"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import Link from "next/link";
import {
  MAPYCZ_TILES,
  MAPYCZ_ATTRIBUTION,
  CZ_CENTER,
  CZ_ZOOM,
} from "@/lib/map-config";
import type { MapMarker } from "@/lib/map-config";

import "leaflet/dist/leaflet.css";

// Custom orange marker icon
const markerIcon = new L.Icon({
  iconUrl: "data:image/svg+xml," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#F97316"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>
  `),
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36],
});

const selectedMarkerIcon = new L.Icon({
  iconUrl: "data:image/svg+xml," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 45" width="30" height="45">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 11.2 15 30 15 30s15-18.8 15-30C30 6.7 23.3 0 15 0z" fill="#EA580C"/>
      <circle cx="15" cy="15" r="6" fill="white"/>
    </svg>
  `),
  iconSize: [30, 45],
  iconAnchor: [15, 45],
  popupAnchor: [0, -45],
});

function FlyToMarker({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 14, { duration: 0.8 });
  }, [map, lat, lng]);
  return null;
}

function formatRating(rating: number): string {
  return rating > 0 ? rating.toFixed(1) : "—";
}

interface MapViewProps {
  markers: MapMarker[];
  selectedId?: string | null;
  onMarkerClick?: (id: string) => void;
  className?: string;
}

export function MapView({
  markers,
  selectedId,
  onMarkerClick,
  className = "",
}: MapViewProps) {
  const selectedMarker = selectedId
    ? markers.find((m) => m.id === selectedId)
    : null;

  return (
    <MapContainer
      center={CZ_CENTER}
      zoom={CZ_ZOOM}
      scrollWheelZoom={true}
      className={`w-full rounded-xl z-0 ${className}`}
      style={{ height: "100%" }}
    >
      <TileLayer url={MAPYCZ_TILES} attribution={MAPYCZ_ATTRIBUTION} />

      {selectedMarker && (
        <FlyToMarker lat={selectedMarker.lat} lng={selectedMarker.lng} />
      )}

      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={50}
        spiderfyOnMaxZoom
        showCoverageOnHover={false}
      >
        {markers.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={m.id === selectedId ? selectedMarkerIcon : markerIcon}
            eventHandlers={{
              click: () => onMarkerClick?.(m.id),
            }}
          >
            <Popup>
              <div className="min-w-[200px] font-sans">
                <div className="font-bold text-gray-900 text-sm mb-1">
                  {m.name}
                </div>
                <div className="text-xs text-gray-500 mb-2">{m.city}</div>

                {m.rating > 0 && (
                  <div className="flex items-center gap-1 text-xs mb-1">
                    <span className="text-yellow-500">★</span>
                    <span className="font-semibold">{formatRating(m.rating)}</span>
                    {m.reviewCount > 0 && (
                      <span className="text-gray-400">
                        ({m.reviewCount})
                      </span>
                    )}
                  </div>
                )}

                {m.phone && (
                  <div className="text-xs text-gray-500 mb-2">
                    {m.phone}
                  </div>
                )}

                <Link
                  href={m.type === "stk" ? `/stk/${m.slug}` : `/autoservisy/${m.slug}`}
                  className="text-xs font-semibold text-orange-500 hover:text-orange-600 no-underline"
                >
                  Zobrazit detail →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
