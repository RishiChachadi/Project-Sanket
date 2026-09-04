'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from 'react-leaflet';
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
  created_at: string;
}

interface RescuerMapProps {
  incidents: Incident[];
  bases?: EmergencyBase[];
  showBases?: boolean;
  selectedIncident: Incident | null;
  onSelectIncident: (inc: Incident) => void;
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

function getMarkerColor(priority: number): string {
  if (priority >= 75) return '#ef4444'; // Red: Critical
  if (priority >= 50) return '#f59e0b'; // Amber: Urgent
  return '#10b981';                     // Green: Minor
}

// Generate tactical square badge HTML icons for emergency bases
function createBaseIcon(type: EmergencyBase['type']) {
  let bgColor = '#2563eb'; // NDRF Blue
  let label = 'NDRF';

  if (type === 'FIRE') {
    bgColor = '#ea580c'; // Fire Orange
    label = 'FIRE';
  } else if (type === 'HOSPITAL') {
    bgColor = '#7c3aed'; // Hospital Purple
    label = 'MED';
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
        box-shadow: 0 2px 6px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 22px;
      ">
        ${label}
      </div>
    `,
    iconSize: [38, 22],
    iconAnchor: [19, 11],
  });
}

export default function RescuerMap({
  incidents,
  bases = [],
  showBases = true,
  selectedIncident,
  onSelectIncident,
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

      {/* EMERGENCY INFRASTRUCTURE BASES */}
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
                <div className="text-[10px] font-mono uppercase text-neutral-500">
                  Facility Type: <strong>{base.type}</strong>
                </div>
                <div>Equipment: <strong>{base.capacity}</strong></div>
                <div>Contact: <a href={`tel:${base.contact}`} className="text-blue-600 underline font-mono">{base.contact}</a></div>
              </div>
            </Popup>
          </Marker>
        ))}

      {/* DISTRESS BEACONS */}
      {incidents.map((incident) => {
        const color = getMarkerColor(incident.priority_score);
        const dynamicRadius = 8 + Math.min(incident.corroboration_count * 2, 14);

        return (
          <CircleMarker
            key={incident.id}
            center={[incident.latitude, incident.longitude]}
            radius={dynamicRadius}
            pathOptions={{
              color: '#ffffff',
              fillColor: color,
              fillOpacity: 0.85,
              weight: 2,
            }}
            eventHandlers={{
              click: () => onSelectIncident(incident),
            }}
          >
            <Popup>
              <div className="text-xs space-y-1 text-neutral-900 font-sans p-1">
                <div className="font-bold uppercase text-red-600">
                  {incident.hazard_type} ({incident.headcount} trapped)
                </div>
                <div>Priority Score: <strong>{incident.priority_score}/100</strong></div>
                <div>Corroborations: <strong>{incident.corroboration_count}</strong></div>
                <div>Status: <span className="font-semibold uppercase">{incident.status}</span></div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
