'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabaseClient';
import { Incident } from '@/components/RescuerMap';
import { 
  ShieldAlert, 
  Users, 
  Layers, 
  Radio, 
  Navigation2
} from 'lucide-react';

const RescuerMap = dynamic(() => import('@/components/RescuerMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-neutral-950 flex items-center justify-center text-neutral-400 font-mono text-sm">
      Initializing Tactical Vector Surface Map...
    </div>
  ),
});

export default function RescuerDashboardPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isLive, setIsLive] = useState(false);

  const fetchIncidents = async () => {
    const { data, error } = await supabase
      .from('distress_incidents')
      .select('*')
      .neq('status', 'resolved')
      .order('priority_score', { ascending: false });

    if (!error && data) {
      setIncidents(data as Incident[]);
      if (data.length > 0 && !selectedIncident) {
        setSelectedIncident(data[0] as Incident);
      }
    }
  };

  useEffect(() => {
    fetchIncidents();

    const channel = supabase
      .channel('realtime-rescuer-incidents')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'distress_incidents' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRecord = payload.new as Incident;
            setIncidents((prev) => [newRecord, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Incident;
            if (updated.status === 'resolved') {
              setIncidents((prev) => prev.filter((item) => item.id !== updated.id));
              setSelectedIncident((prev) => (prev?.id === updated.id ? null : prev));
            } else {
              setIncidents((prev) =>
                prev.map((item) => (item.id === updated.id ? updated : item))
              );
              setSelectedIncident((prev) => (prev?.id === updated.id ? updated : prev));
            }
          }
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateIncidentStatus = async (id: string, nextStatus: string) => {
    await supabase
      .from('distress_incidents')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', id);
  };

  return (
    <div className="h-screen w-screen bg-neutral-950 text-neutral-100 flex flex-col overflow-hidden font-sans">
      <header className="h-14 border-b border-neutral-800 px-4 flex items-center justify-between bg-neutral-900 shrink-0">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-red-500" />
          <div>
            <h1 className="text-sm font-black tracking-wider uppercase">
              Incident Command System (ICS) — Common Operating Picture
            </h1>
            <p className="text-[11px] text-neutral-400">Sector Command & Spatial Dispatch</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-neutral-800 px-2.5 py-1 rounded-md border border-neutral-700">
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{isLive ? 'SOCKET LIVE' : 'CONNECTING'}</span>
          </div>
          <div className="text-neutral-400">
            Active Incidents: <strong className="text-neutral-100">{incidents.length}</strong>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Prioritized Triage Queue */}
        <div className="w-88 border-r border-neutral-800 flex flex-col bg-neutral-900/40 shrink-0">
          <div className="p-3 border-b border-neutral-800 text-xs font-semibold text-neutral-400 flex items-center justify-between">
            <span>PRIORITIZED QUEUE</span>
            <Layers className="w-4 h-4" />
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/60">
            {incidents.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-500">
                No active distress incidents in this sector.
              </div>
            ) : (
              incidents.map((item) => {
                const isSelected = selectedIncident?.id === item.id;
                const isCritical = item.priority_score >= 75;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedIncident(item)}
                    className={`p-3.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-neutral-800/80 border-l-4 border-red-500'
                        : 'hover:bg-neutral-900/80'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        isCritical ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-amber-950 text-amber-400'
                      }`}>
                        {item.hazard_type}
                      </span>
                      <span className="font-mono text-neutral-400 text-[11px]">Score: {item.priority_score}</span>
                    </div>

                    <div className="text-sm font-bold flex items-center justify-between my-1">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-neutral-400" /> {item.headcount} reported
                      </span>
                      <span className="text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-300 font-mono">
                        {item.corroboration_count}x corroborated
                      </span>
                    </div>

                    <p className="text-xs text-neutral-400 line-clamp-1">
                      {item.caller_notes?.[item.caller_notes.length - 1] || 'No field notes'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center: Leaflet Vector Surface Map */}
        <div className="flex-1 relative bg-neutral-950">
          <RescuerMap
            incidents={incidents}
            selectedIncident={selectedIncident}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
          />
        </div>

        {/* Right Column: Tactical Dispatch Panel */}
        {selectedIncident && (
          <div className="w-80 border-l border-neutral-800 p-4 flex flex-col justify-between bg-neutral-900/60 shrink-0">
            <div className="space-y-4">
              <div className="border-b border-neutral-800 pb-3">
                <span className="text-[10px] font-mono text-neutral-400 uppercase block">Cluster ID</span>
                <span className="text-xs font-mono text-neutral-300">{selectedIncident.id.slice(0, 16)}...</span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-neutral-400 uppercase block">Ground Coordinates</span>
                <span className="text-sm font-mono text-white flex items-center gap-1.5 mt-0.5">
                  <Navigation2 className="w-3.5 h-3.5 text-red-500" />
                  {selectedIncident.latitude.toFixed(5)}, {selectedIncident.longitude.toFixed(5)}
                </span>
              </div>

              <div className="p-2.5 bg-neutral-900 rounded-lg border border-neutral-800 space-y-1">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase block">Ingestion Source</span>
                <div className="flex items-center gap-1.5 text-xs text-neutral-200 font-mono">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{selectedIncident.source_channel}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-neutral-400 uppercase block mb-1">
                  Corroborated Field Logs ({selectedIncident.caller_notes?.length || 0})
                </span>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {selectedIncident.caller_notes?.map((note, idx) => (
                    <div key={idx} className="p-2 bg-neutral-950 rounded border border-neutral-800 text-xs text-neutral-300">
                      &bull; {note}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => updateIncidentStatus(selectedIncident.id, 'dispatched')}
                className="w-full py-2.5 rounded bg-blue-600 hover:bg-blue-500 font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Mark Rescuers Dispatched
              </button>
              <button
                type="button"
                onClick={() => updateIncidentStatus(selectedIncident.id, 'resolved')}
                className="w-full py-2.5 rounded bg-emerald-700 hover:bg-emerald-600 font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Mark Incident Resolved
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
