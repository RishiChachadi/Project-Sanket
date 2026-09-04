'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';

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
  if (priority >= 75) return '#ef4444'; // Red: Critical / Immediate
  if (priority >= 50) return '#f59e0b'; // Amber: Urgent / Delayed
  return '#10b981';                     // Green: Minor
}

export default function RescuerMap({ incidents, selectedIncident, onSelectIncident }: RescuerMapProps) {
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
