'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabaseClient';
import { Incident } from '@/components/RescuerMap';
import { EMERGENCY_BASES, calculateDistanceKm, EmergencyBase } from '@/data/emergencyBases';
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
  PhoneCall, 
  Download, 
  Megaphone, 
  Archive, 
  AlertCircle, 
  X, 
  Tent, 
  Truck, 
  AlertTriangle, 
  Sparkles, 
  Camera, 
  Eye, 
  CheckCircle2, 
  FileText, 
  Copy, 
  Printer, 
  Loader2,
  MapPin
} from 'lucide-react';

const RescuerMap = dynamic(() => import('@/components/RescuerMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-neutral-950 flex items-center justify-center text-neutral-400 font-mono text-sm">
      Initializing Tactical Vector Surface Map...
    </div>
  ),
});

const AVAILABLE_CAD_UNITS = [
  { id: 'ndrf-boat-alpha', name: 'NDRF Inflatable Flood Boat Alpha', category: 'Flood' },
  { id: 'ndrf-boat-bravo', name: 'NDRF Inflatable Flood Boat Bravo', category: 'Flood' },
  { id: 'sdrf-usar-1', name: 'Karnataka SDRF USAR (Urban Search & Rescue) Unit 1', category: 'Trapped' },
  { id: 'fire-heavy-highgrounds', name: 'High Grounds Heavy Water Tender 1', category: 'Fire' },
  { id: 'fire-foam-mayohall', name: 'Mayo Hall Foam Tender & Hydraulic Platform', category: 'Fire' },
  { id: 'fire-dinghy-hebbal', name: 'Hebbal Fire Inflatable Rescue Dinghy', category: 'Flood' },
  { id: 'med-als-victoria', name: 'Victoria Trauma Advanced Life Support (ALS) Ambulance', category: 'Medical' },
  { id: 'med-icu-bowring', name: 'Bowring Critical Resuscitation Van', category: 'Medical' },
  { id: 'civil-defence-qrt', name: 'Civil Defence Quick Response Team (QRT-4)', category: 'General' },
];

function getHazardBadge(type: string) {
  const t = type.toLowerCase();
  if (t === 'flood') return { emoji: '🌊', badgeClass: 'bg-blue-950 text-blue-300 border-blue-800 border' };
  if (t === 'fire') return { emoji: '🔥', badgeClass: 'bg-red-950 text-red-300 border-red-800 border' };
  if (t === 'trapped') return { emoji: '🏚️', badgeClass: 'bg-amber-950 text-amber-300 border-amber-800 border' };
  return { emoji: '🚑', badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-800 border' };
}

function getRecommendedUnit(hazardType: string): string {
  const h = hazardType.toLowerCase();
  if (h === 'flood') return 'NDRF Inflatable Flood Boat Alpha';
  if (h === 'fire') return 'High Grounds Heavy Water Tender 1';
  if (h === 'trapped') return 'Karnataka SDRF USAR (Urban Search & Rescue) Unit 1';
  return 'Victoria Trauma Advanced Life Support (ALS) Ambulance';
}

export default function RescuerDashboardPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [viewTab, setViewTab] = useState<'ACTIVE' | 'RESOLVED'>('ACTIVE');
  const [isLive, setIsLive] = useState(false);
  const [audioAlertsEnabled, setAudioAlertsEnabled] = useState(true);
  const [showBases, setShowBases] = useState(true);

  // Reverse Geocoding Cache State: incidentId -> locality string
  const [localityCache, setLocalityCache] = useState<Record<string, string>>({});
  const [isLoadingLocality, setIsLoadingLocality] = useState(false);

  // CAD Unit Selection State
  const [selectedUnit, setSelectedUnit] = useState<string>('');

  // Broadcast Modal State
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  // Fullscreen Photo Lightbox State
  const [activePhotoModal, setActivePhotoModal] = useState<{ url: string; incident: Incident } | null>(null);

  // After-Action Report (AAR) State
  const [isAarModalOpen, setIsAarModalOpen] = useState(false);
  const [isGeneratingAar, setIsGeneratingAar] = useState(false);
  const [aarReport, setAarReport] = useState<string | null>(null);
  const [aarIncidentTarget, setAarIncidentTarget] = useState<Incident | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Fetch human-readable locality on incident selection
  const resolveIncidentLocality = useCallback(async (inc: Incident) => {
    if (localityCache[inc.id]) return;

    setIsLoadingLocality(true);
    try {
      const res = await fetch(`/api/reverse-geocode?lat=${inc.latitude}&lng=${inc.longitude}`);
      if (res.ok) {
        const data = await res.json();
        if (data.locality) {
          setLocalityCache((prev) => ({ ...prev, [inc.id]: data.locality }));
        }
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsLoadingLocality(false);
    }
  }, [localityCache]);

  useEffect(() => {
    if (selectedIncident) {
      if (selectedIncident.assigned_unit) {
        setSelectedUnit(selectedIncident.assigned_unit);
      } else {
        setSelectedUnit(getRecommendedUnit(selectedIncident.hazard_type));
      }
      resolveIncidentLocality(selectedIncident);
    }
  }, [selectedIncident, resolveIncidentLocality]);

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
    const query = supabase
      .from('distress_incidents')
      .select('*')
      .order('priority_score', { ascending: false });

    if (viewTab === 'ACTIVE') {
      query.neq('status', 'resolved');
    } else {
      query.eq('status', 'resolved');
    }

    const { data, error } = await query;
    if (!error && data) {
      setIncidents(data as Incident[]);
      if (data.length > 0) {
        setSelectedIncident(data[0] as Incident);
      } else {
        setSelectedIncident(null);
      }
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [viewTab]);

  useEffect(() => {
    const channel = supabase
      .channel('realtime-rescuer-incidents')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'distress_incidents' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRecord = payload.new as Incident;
            if (viewTab === 'ACTIVE') {
              setIncidents((prev) => [newRecord, ...prev]);
            }
            playTacticalChime();
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Incident;
            if (viewTab === 'ACTIVE') {
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
            } else if (viewTab === 'RESOLVED') {
              if (updated.status === 'resolved') {
                setIncidents((prev) => [updated, ...prev]);
              }
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
  }, [viewTab, audioAlertsEnabled]);

  const handleDispatchUnit = async () => {
    if (!selectedIncident) return;
    const unitToAssign = selectedUnit || getRecommendedUnit(selectedIncident.hazard_type);

    const updatedNotes = selectedIncident.caller_notes || [];
    updatedNotes.push(`CAD Dispatched: ${unitToAssign}`);

    await supabase
      .from('distress_incidents')
      .update({ 
        status: 'dispatched', 
        assigned_unit: unitToAssign,
        caller_notes: updatedNotes,
        updated_at: new Date().toISOString() 
      })
      .eq('id', selectedIncident.id);
  };

  const handleResolveIncident = async () => {
    if (!selectedIncident) return;
    await supabase
      .from('distress_incidents')
      .update({ status: 'resolved', updated_at: new Date().toISOString() })
      .eq('id', selectedIncident.id);
  };

  const handleGenerateAar = async (targetIncident: Incident) => {
    setAarIncidentTarget(targetIncident);
    setIsGeneratingAar(true);
    setAarReport(null);
    setIsAarModalOpen(true);

    try {
      const res = await fetch('/api/generate-aar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident: targetIncident }),
      });

      const data = await res.json();
      if (data?.report) {
        setAarReport(data.report);
      } else {
        setAarReport(data?.error || 'Failed to generate AAR narrative.');
      }
    } catch {
      setAarReport('Network error communicating with AI evaluation service.');
    } finally {
      setIsGeneratingAar(false);
    }
  };

  const handleCopyAar = () => {
    if (!aarReport) return;
    navigator.clipboard.writeText(aarReport);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePrintAar = () => {
    window.print();
  };

  const handleTransmitBroadcast = async () => {
    if (!broadcastMessage.trim()) return;

    const channel = supabase.channel('disaster-broadcasts');
    await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.send({
          type: 'broadcast',
          event: 'evacuation_alert',
          payload: {
            message: broadcastMessage.trim(),
            severity: 'CRITICAL',
            timestamp: new Date().toISOString(),
          },
        });
        setBroadcastSent(true);
        setTimeout(() => {
          setBroadcastSent(false);
          setIsBroadcastOpen(false);
          setBroadcastMessage('');
        }, 1500);
      }
    });
  };

  const exportToCSV = () => {
    if (incidents.length === 0) return;

    const headers = [
      'Cluster ID',
      'Status',
      'Hazard Type',
      'Assigned CAD Unit',
      'Priority Score',
      'Headcount',
      'Corroboration Count',
      'AI Verified',
      'Evidence Photo URL',
      'Latitude',
      'Longitude',
      'Sector Locality',
      'Field Notes',
      'Created At'
    ];

    const rows = incidents.map((inc) => [
      `"${inc.id}"`,
      `"${inc.status}"`,
      `"${inc.hazard_type}"`,
      `"${inc.assigned_unit || 'UNASSIGNED'}"`,
      inc.priority_score,
      inc.headcount,
      inc.corroboration_count,
      inc.ai_verification?.hazard_confirmed ? 'YES' : 'NO',
      `"${inc.evidence_image_url || ''}"`,
      inc.latitude,
      inc.longitude,
      `"${localityCache[inc.id] || 'Pending Resolution'}"`,
      `"${(inc.caller_notes || []).join(' | ').replace(/"/g, '""')}"`,
      `"${inc.created_at}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sanket_cad_report_${viewTab.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (selectedFilter === 'ALL') return true;
    return inc.hazard_type.toLowerCase() === selectedFilter.toLowerCase();
  });

  const totalSouls = incidents.reduce((acc, curr) => acc + (curr.headcount || 1), 0);
  const criticalCount = incidents.filter((i) => i.priority_score >= 75).length;
  const corroboratedCount = incidents.filter((i) => i.corroboration_count > 1).length;
  const dispatchedCount = incidents.filter((i) => i.status === 'dispatched').length;
  const totalShelters = EMERGENCY_BASES.filter((b) => b.type === 'SHELTER').length;

  const nearestBases = selectedIncident
    ? EMERGENCY_BASES.filter((b) => b.type !== 'SHELTER')
        .map((b) => ({
          ...b,
          distanceKm: calculateDistanceKm(
            selectedIncident.latitude,
            selectedIncident.longitude,
            b.latitude,
            b.longitude
          ),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 2)
    : [];

  const sheltersList = selectedIncident
    ? EMERGENCY_BASES.filter((b) => b.type === 'SHELTER')
        .map((b) => ({
          ...b,
          distanceKm: calculateDistanceKm(
            selectedIncident.latitude,
            selectedIncident.longitude,
            b.latitude,
            b.longitude
          ),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm)
    : [];

  const nearestShelter: (EmergencyBase & { distanceKm: number }) | null =
    sheltersList.length > 0 ? sheltersList[0] : null;

  return (
    <div className="h-screen w-screen bg-neutral-950 text-neutral-100 flex flex-col overflow-hidden font-sans">
      {/* Primary Header */}
      <header className="h-14 border-b border-neutral-800 px-4 flex items-center justify-between bg-neutral-900 shrink-0">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-red-500" />
          <div>
            <h1 className="text-sm font-black tracking-wider uppercase">
              Incident Command System (ICS) — Sector Command
            </h1>
            <p className="text-[11px] text-neutral-400">Common Operating Picture & Automated AAR Evaluation</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs font-mono">
          <button
            type="button"
            onClick={() => setIsBroadcastOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold transition-colors shadow-[0_0_12px_rgba(239,68,68,0.4)]"
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>BROADCAST ALERT</span>
          </button>

          <button
            type="button"
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-neutral-700 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>EXPORT CSV</span>
          </button>

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
            <span>{showBases ? 'BASES & SHELTERS ON' : 'BASES HIDDEN'}</span>
          </button>

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
        </div>
      </header>

      {/* Telemetry Bar */}
      <section className="h-10 bg-neutral-900/90 border-b border-neutral-800/80 px-4 flex items-center justify-between text-xs font-mono shrink-0 select-none overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-neutral-400 uppercase text-[10px]">Stranded Souls:</span>
            <span className="font-bold text-amber-300 text-sm">{totalSouls}</span>
          </div>

          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span className="text-neutral-400 uppercase text-[10px]">Critical (≥75):</span>
            <span className="font-bold text-red-400 text-sm">{criticalCount}</span>
          </div>

          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-neutral-400 uppercase text-[10px]">Corroborated:</span>
            <span className="font-bold text-sky-300 text-sm">{corroboratedCount}</span>
          </div>

          <div className="flex items-center gap-2">
            <Truck className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-neutral-400 uppercase text-[10px]">Dispatched:</span>
            <span className="font-bold text-blue-300 text-sm">{dispatchedCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <Tent className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-neutral-400 uppercase text-[10px]">Safe Havens:</span>
            <span className="font-bold text-emerald-300 text-sm">{totalShelters}</span>
          </div>

          <div className="text-neutral-500 text-[11px]">
            {viewTab === 'ACTIVE' ? 'Active Clusters:' : 'Resolved Records:'} <strong className="text-neutral-200">{incidents.length}</strong>
          </div>
        </div>
      </section>

      {/* Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Triage Queue */}
        <div className="w-88 border-r border-neutral-800 flex flex-col bg-neutral-900/40 shrink-0">
          <div className="grid grid-cols-2 border-b border-neutral-800 text-xs font-mono font-bold">
            <button
              type="button"
              onClick={() => setViewTab('ACTIVE')}
              className={`py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                viewTab === 'ACTIVE'
                  ? 'border-red-500 text-white bg-neutral-850'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-red-500" />
              <span>ACTIVE QUEUE</span>
            </button>
            <button
              type="button"
              onClick={() => setViewTab('RESOLVED')}
              className={`py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                viewTab === 'RESOLVED'
                  ? 'border-emerald-500 text-white bg-neutral-850'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Archive className="w-3.5 h-3.5 text-emerald-400" />
              <span>RESOLVED LOG</span>
            </button>
          </div>

          <div className="p-2.5 border-b border-neutral-800 flex items-center gap-1 overflow-x-auto text-[11px] font-mono no-scrollbar">
            {[
              { id: 'ALL', label: 'ALL' },
              { id: 'Flood', label: '🌊 Flood' },
              { id: 'Fire', label: '🔥 Fire' },
              { id: 'Medical', label: '🚑 Medical' },
              { id: 'Trapped', label: '🏚️ Trapped' },
            ].map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
                  selectedFilter === filter.id
                    ? 'bg-neutral-100 text-neutral-950 font-bold'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/60">
            {filteredIncidents.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-500 flex flex-col items-center gap-2">
                <Filter className="w-4 h-4 text-neutral-600" />
                <span>No incidents matching active view.</span>
              </div>
            ) : (
              filteredIncidents.map((item) => {
                const isSelected = selectedIncident?.id === item.id;
                const hazardInfo = getHazardBadge(item.hazard_type);
                const hasPhoto = Boolean(item.evidence_image_url);
                const cachedLocality = localityCache[item.id];

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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] flex items-center gap-1 ${hazardInfo.badgeClass}`}>
                          <span>{hazardInfo.emoji}</span>
                          <span>{item.hazard_type}</span>
                        </span>
                        {item.ai_verification?.hazard_confirmed && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-700 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            AI
                          </span>
                        )}
                        {hasPhoto && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePhotoModal({ url: item.evidence_image_url!, incident: item });
                            }}
                            className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-sky-950 text-sky-300 border border-sky-800 flex items-center gap-1 hover:bg-sky-900"
                            title="Click to view ground photo evidence"
                          >
                            <Camera className="w-2.5 h-2.5" />
                            PHOTO
                          </button>
                        )}
                      </div>
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

                    {/* Sector Locality in Queue Card */}
                    {cachedLocality && (
                      <div className="text-[11px] font-medium text-neutral-300 flex items-center gap-1 truncate my-0.5">
                        <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                        <span className="truncate">{cachedLocality}</span>
                      </div>
                    )}

                    {item.assigned_unit && (
                      <div className="text-[10px] font-mono text-blue-300 flex items-center gap-1 truncate my-0.5">
                        <Truck className="w-3 h-3 text-blue-400 shrink-0" />
                        <span className="truncate">{item.assigned_unit}</span>
                      </div>
                    )}

                    <p className="text-xs text-neutral-400 line-clamp-1 mt-1">
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
            onViewPhoto={(url) => {
              const inc = incidents.find((i) => i.evidence_image_url === url);
              if (inc) setActivePhotoModal({ url, incident: inc });
            }}
          />
        </div>

        {/* Right Column: Dispatch & CAD Panel */}
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
                    : selectedIncident.status === 'resolved'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-neutral-800 text-neutral-300'
                }`}>
                  {selectedIncident.status}
                </span>
              </div>

              {/* Reverse Geocoded Ground Sector */}
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase block">
                  Ground Sector & Locality
                </span>
                <div className="text-xs font-bold text-white flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                  <span>
                    {localityCache[selectedIncident.id] || (
                      isLoadingLocality ? (
                        <span className="text-neutral-400 flex items-center gap-1 font-mono font-normal text-[11px]">
                          <Loader2 className="w-3 h-3 animate-spin" /> Resolving neighborhood...
                        </span>
                      ) : (
                        `${selectedIncident.latitude.toFixed(4)}, ${selectedIncident.longitude.toFixed(4)}`
                      )
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-neutral-900 text-[11px] font-mono">
                  <span className="text-neutral-400 flex items-center gap-1">
                    <Navigation2 className="w-3 h-3 text-neutral-500" />
                    {selectedIncident.latitude.toFixed(5)}, {selectedIncident.longitude.toFixed(5)}
                  </span>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedIncident.latitude},${selectedIncident.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <span>Route</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Active Unit Banner */}
              {selectedIncident.assigned_unit && (
                <div className="p-2.5 bg-blue-950/60 border border-blue-700 rounded-xl space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                    Deployed CAD Unit
                  </div>
                  <div className="text-xs font-bold text-white">
                    {selectedIncident.assigned_unit}
                  </div>
                </div>
              )}

              {/* Photo Evidence */}
              {selectedIncident.evidence_image_url && (
                <div className="p-3 bg-neutral-950 rounded-xl border border-sky-900/60 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-sky-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                      <Camera className="w-3.5 h-3.5" />
                      Field Photo Evidence
                    </span>
                    <button
                      type="button"
                      onClick={() => setActivePhotoModal({ url: selectedIncident.evidence_image_url!, incident: selectedIncident })}
                      className="text-[10px] font-mono text-sky-400 hover:text-sky-300 underline flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      View Fullscreen
                    </button>
                  </div>

                  <div 
                    className="relative cursor-pointer group rounded-lg overflow-hidden border border-neutral-800 hover:border-sky-500 transition-colors"
                    onClick={() => setActivePhotoModal({ url: selectedIncident.evidence_image_url!, incident: selectedIncident })}
                  >
                    <img
                      src={selectedIncident.evidence_image_url}
                      alt="Ground Evidence"
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2">
                      <span className="text-[10px] text-neutral-200 font-mono flex items-center gap-1">
                        <Eye className="w-3 h-3 text-sky-400" />
                        Click to enlarge & inspect
                      </span>
                    </div>
                  </div>

                  {selectedIncident.ai_verification && (
                    <div className="p-2 bg-neutral-900 rounded-lg border border-neutral-800 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-amber-400 font-bold flex items-center gap-1 text-[10px]">
                          <Sparkles className="w-3 h-3" />
                          AI Ocular Diagnosis:
                        </span>
                        <span className="font-mono text-[10px] text-emerald-400">
                          +{selectedIncident.ai_verification.severity_boost || 20} pts
                        </span>
                      </div>
                      <p className="text-neutral-300 leading-snug">
                        {selectedIncident.ai_verification.observations}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Nearest Shelter */}
              {nearestShelter && (
                <div className="p-2.5 bg-emerald-950/40 border border-emerald-800 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                      <Tent className="w-3.5 h-3.5" />
                      Nearest Safe Haven (Shelter)
                    </span>
                    <span className="font-mono text-xs font-black text-emerald-300">
                      {nearestShelter.distanceKm} km
                    </span>
                  </div>
                  <div className="font-bold text-xs text-white">{nearestShelter.name}</div>
                  <p className="text-[10px] text-neutral-300 leading-tight">
                    {nearestShelter.capacity}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${selectedIncident.latitude},${selectedIncident.longitude}&destination=${nearestShelter.latitude},${nearestShelter.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 underline font-bold flex items-center gap-1"
                    >
                      <span>Evacuation Route</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    <a href={`tel:${nearestShelter.contact}`} className="font-mono text-neutral-400 hover:text-white">
                      Camp HQ: {nearestShelter.contact}
                    </a>
                  </div>
                </div>
              )}

              {/* Nearby First Responder Posts */}
              <div className="space-y-1.5 pt-1 border-t border-neutral-800">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase block">
                  First Responder Posts (Fire / NDRF / Medical)
                </span>
                <div className="space-y-1.5">
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
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-neutral-400 truncate max-w-[200px]">{base.capacity}</span>
                        <a
                          href={`tel:${base.contact}`}
                          className="font-mono text-blue-400 hover:underline flex items-center gap-1 shrink-0"
                        >
                          <PhoneCall className="w-2.5 h-2.5" />
                          Call
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Field Logs */}
              <div className="pt-1 border-t border-neutral-800">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase block mb-1">
                  Corroborated Field Logs ({selectedIncident.caller_notes?.length || 0})
                </span>
                <div className="max-h-20 overflow-y-auto space-y-1 pr-1">
                  {selectedIncident.caller_notes?.map((note, idx) => (
                    <div key={idx} className="p-2 bg-neutral-950 rounded border border-neutral-800 text-xs text-neutral-300">
                      • {note}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tactical Actions or AAR Button */}
            {viewTab === 'ACTIVE' ? (
              <div className="space-y-2.5 pt-3 border-t border-neutral-800 bg-neutral-950/80 -mx-4 -mb-4 p-4 rounded-b-none border-t-neutral-800">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono uppercase font-bold text-neutral-300 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-blue-400" />
                      <span>CAD Resource Allocation</span>
                    </label>
                    <span className="text-[9px] font-mono text-amber-400">
                      Auto-Recommended
                    </span>
                  </div>

                  <select
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 text-neutral-100 text-xs rounded-lg p-2 focus:outline-none focus:border-blue-500 font-sans"
                  >
                    {AVAILABLE_CAD_UNITS.map((unit) => (
                      <option key={unit.id} value={unit.name}>
                        [{unit.category.toUpperCase()}] {unit.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={handleDispatchUnit}
                    className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-black text-xs uppercase tracking-wider transition-colors text-white flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                  >
                    <Truck className="w-4 h-4" />
                    <span>
                      {selectedIncident.status === 'dispatched'
                        ? 'Reassign & Update Unit'
                        : 'Deploy & Dispatch Unit'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResolveIncident}
                    className="w-full py-2 rounded-lg bg-neutral-900 hover:bg-emerald-950 border border-neutral-800 hover:border-emerald-700 font-bold text-xs uppercase tracking-wider transition-colors text-neutral-300 hover:text-emerald-300 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mark Incident Resolved</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-3 border-t border-neutral-800 -mx-4 -mb-4 p-4 bg-neutral-950/80">
                <button
                  type="button"
                  onClick={() => handleGenerateAar(selectedIncident)}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-black text-xs uppercase tracking-wider text-white flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI After-Action Report (AAR)</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI AAR Modal */}
      {isAarModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsAarModalOpen(false)}
        >
          <div 
            className="relative max-w-3xl w-full bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-800 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <span>After-Action Report &bull; Incident Debrief</span>
                    <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-mono">
                      GEMINI FLASH 2.5
                    </span>
                  </h2>
                  <p className="text-[10px] font-mono text-neutral-400">
                    Cluster {aarIncidentTarget?.id.slice(0, 16)} &bull; {aarIncidentTarget?.hazard_type.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyAar}
                  disabled={isGeneratingAar || !aarReport}
                  className="px-2.5 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  title="Copy Report to Clipboard"
                >
                  {isCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'COPIED' : 'COPY'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintAar}
                  disabled={isGeneratingAar || !aarReport}
                  className="px-2.5 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  title="Print / Save as PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-400" />
                  <span>PRINT / PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAarModalOpen(false)}
                  className="text-neutral-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto font-mono text-xs text-neutral-300 space-y-4 leading-relaxed bg-neutral-950 selection:bg-purple-900">
              {isGeneratingAar ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                  <span className="font-bold text-neutral-200">Synthesizing Incident Log & CAD Efficacy Telemetry...</span>
                  <p className="text-[11px] text-neutral-500 max-w-sm">
                    Querying Gemini 2.5 Flash to evaluate spatial corroboration, assigned response assets, and hazard mitigation metrics.
                  </p>
                </div>
              ) : (
                <div className="whitespace-pre-wrap font-sans text-xs text-neutral-200 leading-normal space-y-2 prose prose-invert max-w-none">
                  {aarReport}
                </div>
              )}
            </div>

            <div className="p-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-[10px] font-mono text-neutral-400">
              <span>FEMA / NDRF Operational Doctrine Standards</span>
              <span>Project Sanket Incident Command</span>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Lightbox */}
      {activePhotoModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActivePhotoModal(null)}
        >
          <div 
            className="relative max-w-3xl w-full bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  Ground Photo Evidence &bull; Cluster {activePhotoModal.incident.id.slice(0, 8)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActivePhotoModal(null)}
                className="text-neutral-400 hover:text-white text-xs font-mono flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                <span>ESC</span>
              </button>
            </div>

            <div className="bg-black flex items-center justify-center max-h-[65vh] overflow-hidden">
              <img
                src={activePhotoModal.url}
                alt="Ground Evidence Full"
                className="max-h-[65vh] w-auto object-contain select-none"
              />
            </div>

            <div className="p-3.5 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="text-neutral-300 font-semibold">
                  Hazard: <strong className="text-white uppercase">{activePhotoModal.incident.hazard_type}</strong> &bull; Priority: {activePhotoModal.incident.priority_score}/100
                </div>
                {activePhotoModal.incident.assigned_unit && (
                  <div className="text-blue-400 text-[11px]">
                    Assigned Unit: <strong>{activePhotoModal.incident.assigned_unit}</strong>
                  </div>
                )}
                {activePhotoModal.incident.ai_verification && (
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    AI Assessment: {activePhotoModal.incident.ai_verification.observations}
                  </p>
                )}
              </div>
              <a
                href={activePhotoModal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold shrink-0 transition-colors"
              >
                Open Raw File
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Evacuation Broadcast Modal */}
      {isBroadcastOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2 text-red-500">
                <AlertCircle className="w-5 h-5" />
                <h2 className="text-sm font-black uppercase tracking-wider text-white">
                  Issue Public Evacuation Advisory
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsBroadcastOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              This message will be pushed instantly via WebSocket to all citizens currently viewing the mobile SOS PWA, accompanied by an urgent haptic pattern.
            </p>

            <textarea
              rows={3}
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="e.g. FLASH FLOOD WARNING: Breached lake bund in Sector 4. Proceed to Kanteerava Stadium Safe Haven immediately."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-red-500"
            />

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBroadcastOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-800 text-xs font-bold text-neutral-400 hover:bg-neutral-850 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTransmitBroadcast}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)]"
              >
                {broadcastSent ? 'ADVISORY TRANSMITTED!' : 'TRANSMIT BROADCAST'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
