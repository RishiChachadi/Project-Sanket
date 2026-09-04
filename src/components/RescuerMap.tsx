'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { EmergencyBase } from '@/data/emergencyBases';

export interface Incident {
  id: string;
  latitude: number;
  longitude: number;
  hazard_type: string;
  headcount: number;
  priority_score: number;
  corroboration_count: number;
  status: string;
  caller_notes: string[];
  source_channel: string;
  evidence_image_url?: string;
  ai_verification?: {
    hazard_confirmed?: boolean;
    detected_hazard?: string;
    severity_level?: string;
    severity_boost?: number;
    observations?: string;
    verified_at?: string;
  };
  created_at: string;
}

interface RescuerMapProps {
  incidents: Incident[];
  bases?: EmergencyBase[];
  showBases?: boolean;
  selectedIncident: Incident | null;
  onSelectIncident: (inc: Incident) => void;
  onViewPhoto?: (url: string) => void;
}

function MapController({ selectedIncident }: { selectedIncident: Incident | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedIncident) {
      map.flyTo([selectedIncident.latitude, selectedIncident.longitude], 16, { duration: 1.2 });
    }
  }, [selectedIncident, map]);
  return null;
}

function createIncidentIcon(
  hazardType: string,
  priorityScore: number,
  corroborationCount: number,
  hasPhoto: boolean,
  isSelected: boolean
) {
  const h = hazardType.toLowerCase();

  let pinColor = '#dc2626';
  let emoji = '🔥';

  if (h === 'flood') {
    pinColor = '#2563eb';
    emoji = '🌊';
  } else if (h === 'trapped') {
    pinColor = '#d97706';
    emoji = '🏚️';
  } else if (h === 'medical') {
    pinColor = '#059669';
    emoji = '🚑';
  }

  const isCritical = priorityScore >= 75;

  const html = `
    <div style="
      position: relative;
      width: 36px;
      height: 48px;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      ${isSelected ? 'transform: scale(1.22); z-index: 999;' : ''}
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.6));
    ">
      ${isCritical || isSelected ? `
        <div style="
          position: absolute;
          top: 2px;
          left: 3px;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background-color: ${pinColor};
          opacity: 0.45;
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          pointer-events: none;
        "></div>
      ` : ''}

      <svg width="36" height="46" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M17 0C7.61 0 0 7.61 0 17C0 27.5 14.5 41.5 16.2 43.1C16.6 43.5 17.4 43.5 17.8 43.1C19.5 41.5 34 27.5 34 17C34 7.61 26.39 0 17 0Z"
          fill="${pinColor}"
          stroke="#FFFFFF"
          stroke-width="${isSelected ? '2.5' : '1.8'}"
        />
        <circle cx="17" cy="17" r="11" fill="#FFFFFF" fill-opacity="0.22" />
      </svg>

      <div style="
        position: absolute;
        top: 7px;
        left: 0;
        width: 36px;
        text-align: center;
        font-size: 15px;
        line-height: 1;
        user-select: none;
        pointer-events: none;
      ">
        ${emoji}
      </div>

      ${corroborationCount > 1 ? `
        <div style="
          position: absolute;
          top: -4px;
          right: -4px;
          background: #0f172a;
          color: #fde047;
          border: 1.5px solid #fde047;
          border-radius: 9999px;
          font-size: 9px;
          font-weight: 900;
          font-family: monospace;
          padding: 1px 4px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.8);
          line-height: 1.2;
        ">
          ${corroborationCount}x
        </div>
      ` : ''}

      ${hasPhoto ? `
        <div style="
          position: absolute;
          bottom: 2px;
          right: -4px;
          background: #09090b;
          color: #38bdf8;
          border: 1.5px solid #38bdf8;
          border-radius: 9999px;
          font-size: 8px;
          padding: 1px 3px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.8);
          line-height: 1;
        ">
          📷
        </div>
      ` : ''}
    </div>
  `;

  return L.divIcon({
    className: 'custom-hazard-pin',
    html,
    iconSize: [36, 48],
    iconAnchor: [18, 46],
    popupAnchor: [0, -44],
  });
}

function createBaseIcon(type: EmergencyBase['type']) {
  let bgColor = '#2563eb';
  let label = 'NDRF';

  if (type === 'FIRE') {
    bgColor = '#ea580c';
    label = 'FIRE';
  } else if (type === 'HOSPITAL') {
    bgColor = '#7c3aed';
    label = 'MED';
  } else if (type === 'SHELTER') {
    bgColor = '#059669';
    label = 'SAFE';
  }

  return L.divIcon({
    className: 'custom-base-icon',
    html: `
      <div style="
        background-color: ${bgColor};
        color: #ffffff;
        border: 2px solid #ffffff;
        border-radius: 6px;
        padding: 2px 4px;
        font-family: monospace;
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.5px;
        text-align: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 22px;
      ">
        ${label}
      </div>
    `,
    iconSize: [40, 22],
    iconAnchor: [20, 11],
  });
}

export default function RescuerMap({
  incidents,
  bases = [],
  showBases = true,
  selectedIncident,
  onSelectIncident,
  onViewPhoto,
}: RescuerMapProps) {
  const defaultCenter: [number, number] = [12.9716, 77.5946];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      className="h-full w-full z-0"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapController selectedIncident={selectedIncident} />

      {/* EMERGENCY INFRASTRUCTURE BASES & SAFE HAVENS */}
      {showBases &&
        bases.map((base) => (
          <Marker
            key={base.id}
            position={[base.latitude, base.longitude]}
            icon={createBaseIcon(base.type)}
          >
            <Popup>
              <div className="text-xs space-y-1 text-neutral-900 font-sans p-1">
                <div className="font-bold text-sm text-neutral-900">{base.name}</div>
                <div className="text-[10px] font-mono uppercase font-bold text-emerald-700">
                  Type: {base.type === 'SHELTER' ? 'SAFE ASSEMBLY ZONE / SHELTER' : base.type}
                </div>
                <div>Capacity / Resources: <strong>{base.capacity}</strong></div>
                <div>Emergency Contact: <a href={`tel:${base.contact}`} className="text-blue-600 underline font-mono">{base.contact}</a></div>
              </div>
            </Popup>
          </Marker>
        ))}

      {/* INCIDENT PINS WITH PHOTO PREVIEWS */}
      {incidents.map((incident) => {
        const isSelected = selectedIncident?.id === incident.id;
        const hasPhoto = Boolean(incident.evidence_image_url);

        const customPin = createIncidentIcon(
          incident.hazard_type,
          incident.priority_score,
          incident.corroboration_count,
          hasPhoto,
          isSelected
        );

        return (
          <Marker
            key={incident.id}
            position={[incident.latitude, incident.longitude]}
            icon={customPin}
            eventHandlers={{
              click: () => onSelectIncident(incident),
            }}
          >
            <Popup>
              <div className="text-xs space-y-1.5 text-neutral-900 font-sans p-1 max-w-[200px]">
                <div className="font-bold uppercase text-red-600 flex items-center justify-between">
                  <span>{incident.hazard_type}</span>
                  <span className="text-[10px] font-mono text-neutral-600">Score: {incident.priority_score}</span>
                </div>
                <div>Trapped: <strong>{incident.headcount} people</strong></div>

                {/* Direct Map Popup Thumbnail */}
                {incident.evidence_image_url && (
                  <div className="pt-1">
                    <img
                      src={incident.evidence_image_url}
                      alt="Ground Evidence"
                      onClick={() => onViewPhoto && onViewPhoto(incident.evidence_image_url!)}
                      className="w-full h-24 object-cover rounded cursor-pointer border border-neutral-300 hover:opacity-90"
                    />
                    <button
                      type="button"
                      onClick={() => onViewPhoto && onViewPhoto(incident.evidence_image_url!)}
                      className="w-full mt-1 py-1 text-[10px] font-bold bg-neutral-900 text-white rounded hover:bg-neutral-800"
                    >
                      Enlarge Ground Photo
                    </button>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
