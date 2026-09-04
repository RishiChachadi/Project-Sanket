'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabaseClient';
import { Incident } from '@/components/RescuerMap';
import { EMERGENCY_BASES, EmergencyBase, calculateDistanceKm } from '@/data/emergencyBases';
import { 
  ShieldAlert, 
  Users, 
  Layers, 
  Radio, 
  Navigation2, 
  Volume2, 
  VolumeX, 
  ExternalLink,
  Filter,
  Building2,
  PhoneCall
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
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [isLive, setIsLive] = useState(false);
  const [audioAlertsEnabled, setAudioAlertsEnabled] = useState(true);
  const [showBases, setShowBases] = useState(true);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTacticalChime = () => {
    if (!audioAlertsEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio autoplay policy fallback
    }
  };

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
            playTacticalChime();
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
              playTacticalChime();
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
  }, [audioAlertsEnabled]);

  const updateIncidentStatus = async (id: string, nextStatus: string) => {
    await supabase
      .from('distress_incidents')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', id);
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (selectedFilter === 'ALL') return true;
    return inc.hazard_type.toLowerCase() === selectedFilter.toLowerCase();
  });

  // Calculate the 3 nearest emergency response bases to the currently selected incident
  const nearestBases = selectedIncident
    ? EMERGENCY_BASES.map((b) => ({
        ...b,
        distanceKm: calculateDistanceKm(
          selectedIncident.latitude,
          selectedIncident.longitude,
          b.latitude,
          b.longitude
        ),
      }))
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 3)
    : [];

  return (
    <div className="h-screen w-screen bg-neutral-950 text-neutral-100 flex flex-col overflow-hidden font-sans">
      {/* Tactical Ribbon */}
      <header className="h-14 border-b border-neutral-800 px-4 flex items-center justify-between bg-neutral-900 shrink-0">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-red-500" />
          <div>
            <h1 className="text-sm font-black tracking-wider uppercase">
              Incident Command System (ICS) — Common Operating Picture
            </h1>
            <p className="text-[11px] text-neutral-400">Sector Command & Resource Dispatch</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          {/* Base Layer Toggle */}
          <button
            type="button"
            onClick={() => setShowBases(!showBases)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-colors ${
              showBases
                ? 'border-blue-700 bg-blue-950/60 text-blue-300'
                : 'border-neutral-800 bg-neutral-900 text-neutral-500'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{showBases ? 'BASES VISIBLE' : 'BASES HIDDEN'}</span>
          </button>

          {/* Audio Alerts */}
          <button
            type="button"
            onClick={() => setAudioAlertsEnabled(!audioAlertsEnabled)}
            className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
              audioAlertsEnabled
                ? 'border-neutral-700 bg-neutral-800 text-neutral-300'
                : 'border-neutral-800 bg-neutral-900 text-neutral-600'
            }`}
          >
            {audioAlertsEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <div className="flex items-center gap-1.5 bg-neutral-800 px-2.5 py-1 rounded-md border border-neutral-700">
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{isLive ? 'SOCKET LIVE' : 'CONNECTING'}</span>
          </div>

          <div className="text-neutral-400">
            Active: <strong className="text-neutral-100">{incidents.length}</strong>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Prioritized Triage Queue */}
        <div className="w-88 border-r border-neutral-800 flex flex-col bg-neutral-900/40 shrink-0">
          <div className="p-3 border-b border-neutral-800 space-y-2">
            <div className="text-xs font-semibold text-neutral-400 flex items-center justify-between">
              <span>PRIORITIZED QUEUE</span>
              <Layers className="w-4 h-4" />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-mono no-scrollbar">
              {['ALL', 'Flood', 'Fire', 'Medical', 'Trapped'].map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
                    selectedFilter === filter
                      ? 'bg-neutral-100 text-neutral-950 font-bold'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/60">
            {filteredIncidents.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-500 flex flex-col items-center gap-2">
                <Filter className="w-4 h-4 text-neutral-600" />
                <span>No incidents matching filter.</span>
              </div>
            ) : (
              filteredIncidents.map((item) => {
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

        {/* Center: Surface Map */}
        <div className="flex-1 relative bg-neutral-950">
          <RescuerMap
            incidents={filteredIncidents}
            bases={EMERGENCY_BASES}
            showBases={showBases}
            selectedIncident={selectedIncident}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
          />
        </div>

        {/* Right Column: Dispatch Panel with Nearest Response Bases */}
        {selectedIncident && (
          <div className="w-96 border-l border-neutral-800 p-4 flex flex-col justify-between bg-neutral-900/70 shrink-0 overflow-y-auto">
            <div className="space-y-4">
              <div className="border-b border-neutral-800 pb-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-neutral-400 uppercase block">Cluster ID</span>
                  <span className="text-xs font-mono text-neutral-300">{selectedIncident.id.slice(0, 16)}...</span>
                </div>
                <span className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold ${
                  selectedIncident.status === 'dispatched' 
                    ? 'bg-blue-950 text-blue-400 border border-blue-800' 
                    : 'bg-neutral-800 text-neutral-300'
                }`}>
                  {selectedIncident.status}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-neutral-400 uppercase block">Incident Coordinates</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-mono text-white flex items-center gap-1">
                    <Navigation2 className="w-3.5 h-3.5 text-red-500" />
                    {selectedIncident.latitude.toFixed(5)}, {selectedIncident.longitude.toFixed(5)}
                  </span>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedIncident.latitude},${selectedIncident.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <span>Route</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* NEAREST RESPONSE BASES (PROXIMITY ENGINE) */}
              <div className="space-y-2 pt-1 border-t border-neutral-800">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase block flex items-center justify-between">
                  <span>Closest Emergency Bases</span>
                  <span className="font-mono text-emerald-400">PostGIS Proximity</span>
                </span>
                <div className="space-y-2">
                  {nearestBases.map((base) => (
                    <div
                      key={base.id}
                      className="p-2 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-neutral-200 truncate pr-2">{base.name}</span>
                        <span className="font-mono text-amber-400 text-[11px] font-semibold shrink-0">
                          {base.distanceKm} km
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-tight line-clamp-1">
                        {base.capacity}
                      </p>
                      <div className="pt-0.5 flex items-center justify-between text-[10px]">
                        <span className="font-mono text-neutral-500">Call Base:</span>
                        <a
                          href={`tel:${base.contact}`}
                          className="font-mono text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <PhoneCall className="w-2.5 h-2.5" />
                          {base.contact}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Corroborated Field Logs */}
              <div className="pt-1 border-t border-neutral-800">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase block mb-1">
                  Corroborated Field Logs ({selectedIncident.caller_notes?.length || 0})
                </span>
                <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                  {selectedIncident.caller_notes?.map((note, idx) => (
                    <div key={idx} className="p-2 bg-neutral-950 rounded border border-neutral-800 text-xs text-neutral-300">
                      &bull; {note}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tactical Actions */}
            <div className="space-y-2 pt-3 border-t border-neutral-800">
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
