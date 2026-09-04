'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  AlertOctagon, 
  CheckCircle2, 
  Users, 
  MapPin, 
  Radio, 
  HeartHandshake, 
  Send,
  Loader2
} from 'lucide-react';

export default function VictimPage() {
  // Stage state: 'trigger' (Stage 1) -> 'followup' (Stage 2)
  const [stage, setStage] = useState<'trigger' | 'followup'>('trigger');
  
  // Geolocation state
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Active Incident Tracking
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Stage 1 Selection
  const [selectedHazard, setSelectedHazard] = useState<string>('Flood');

  // Stage 2 Follow-up States
  const [headcount, setHeadcount] = useState<number>(1);
  const [hasMedical, setHasMedical] = useState<boolean>(false);
  const [isTrapped, setIsTrapped] = useState<boolean>(false);
  const [landmarkNotes, setLandmarkNotes] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [enrichmentSaved, setEnrichmentSaved] = useState<boolean>(false);

  // Acquire high-accuracy GPS coordinates on mount
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGpsError(null);
      },
      (err) => {
        console.warn('GPS error, using sector fallback:', err.message);
        setCoords({ lat: 12.9716, lng: 77.5946 }); // Default Bangalore Center
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // STAGE 1: Immediate Panic Transmission
  const handleInitialSOS = async () => {
    setIsSubmitting(true);
    setStatusMessage(null);

    const lat = coords?.lat || 12.9716;
    const lng = coords?.lng || 77.5946;

    try {
      const { data, error } = await supabase.rpc('ingest_distress_report', {
        p_lat: lat,
        p_lng: lng,
        p_hazard: selectedHazard,
        p_headcount: 1,
        p_note: 'Initial SOS Triggered - Awaiting follow-up enrichment',
        p_source: 'PWA_PROGRESSIVE'
      });

      if (error) throw error;

      setIncidentId(data);
      setStage('followup');
    } catch (err: any) {
      console.error('SOS Failed:', err);
      setStatusMessage(`Failed to send: ${err.message || 'Check network'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // STAGE 2: Progressive Enrichment (Follow-up Details)
  const handleFollowUpSubmit = async () => {
    if (!incidentId) return;

    setIsUpdating(true);
    setEnrichmentSaved(false);

    try {
      const notesList: string[] = [];
      if (hasMedical) notesList.push('CRITICAL: Medical / Oxygen dependency');
      if (isTrapped) notesList.push('URGENT: Structure trapped / Water ingress');
      if (landmarkNotes.trim()) notesList.push(`Landmark: ${landmarkNotes.trim()}`);

      // Calculate an elevated priority score based on answered questions
      let extraScore = 50;
      if (selectedHazard === 'Medical' || hasMedical) extraScore += 25;
      if (selectedHazard === 'Fire' || isTrapped) extraScore += 20;
      if (headcount > 3) extraScore += 15;

      const { error } = await supabase
        .from('distress_incidents')
        .update({
          headcount: headcount,
          priority_score: Math.min(100, extraScore),
          caller_notes: notesList,
          updated_at: new Date().toISOString()
        })
        .eq('id', incidentId);

      if (error) throw error;

      setEnrichmentSaved(true);
      setTimeout(() => setEnrichmentSaved(false), 3000);
    } catch (err: any) {
      console.error('Failed to update incident details:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col justify-between p-4 max-w-md mx-auto select-none">
      {/* Top Telemetry Header */}
      <header className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-red-500 animate-pulse" />
          <span className="text-xs font-black tracking-widest uppercase">Project Sanket</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono bg-neutral-900 border border-neutral-800 px-2 py-1 rounded">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Locking GPS...'}
          </span>
        </div>
      </header>

      {/* STAGE 1: MINIMAL 1-TAP DISPATCH */}
      {stage === 'trigger' && (
        <div className="flex-1 flex flex-col justify-center space-y-6 my-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-100">
              Emergency Distress
            </h1>
            <p className="text-xs text-neutral-400">
              Tap once to lock your coordinates and alert rescue commanders.
            </p>
          </div>

          {/* Quick Hazard Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono tracking-wider uppercase text-neutral-400">
              What is happening right now?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'Flood', label: 'Flood / Water' },
                { id: 'Fire', label: 'Fire / Explosion' },
                { id: 'Trapped', label: 'Trapped / Collapse' },
                { id: 'Medical', label: 'Medical Emergency' },
              ].map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setSelectedHazard(h.id)}
                  className={`p-3 rounded-lg text-xs font-bold border transition-all text-left ${
                    selectedHazard === h.id
                      ? 'border-red-500 bg-red-950/40 text-red-200'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          {/* Big Instant SOS Button */}
          <div className="pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleInitialSOS}
              className="w-full h-44 rounded-2xl bg-gradient-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 active:scale-95 transition-all shadow-[0_0_40px_rgba(239,68,68,0.35)] flex flex-col items-center justify-center gap-3 border-2 border-red-400/40"
            >
              {isSubmitting ? (
                <Loader2 className="w-12 h-12 animate-spin text-white" />
              ) : (
                <>
                  <AlertOctagon className="w-14 h-14 text-white" />
                  <span className="text-xl font-black uppercase tracking-widest">
                    TRANSMIT SOS
                  </span>
                  <span className="text-[10px] text-red-200 font-mono">
                    Instant Dispatched &bull; GPS Tagged
                  </span>
                </>
              )}
            </button>
          </div>

          {statusMessage && (
            <p className="text-center text-xs text-red-400 font-mono bg-red-950/50 p-2 rounded border border-red-900">
              {statusMessage}
            </p>
          )}
        </div>
      )}

      {/* STAGE 2: PROGRESSIVE ENRICHMENT (FOLLOW-UP QUESTIONS) */}
      {stage === 'followup' && (
        <div className="flex-1 flex flex-col justify-between py-4 space-y-4">
          {/* Confirmation Banner */}
          <div className="bg-emerald-950/60 border border-emerald-800 p-3 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                Beacon Active & Dispatched
              </h2>
              <p className="text-[11px] text-emerald-300/80">
                Rescuers have your location. Answer below to help them prepare:
              </p>
            </div>
          </div>

          <div className="space-y-4 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
            {/* Question 1: Headcount */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-200 flex items-center justify-between">
                <span>1. How many people are stranded?</span>
                <span className="text-red-400 font-mono">{headcount} Person(s)</span>
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setHeadcount(num)}
                    className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold border ${
                      headcount === num
                        ? 'bg-red-600 border-red-500 text-white'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                    }`}
                  >
                    {num === 5 ? '5+' : num}
                  </button>
                ))}
              </div>
            </div>

            {/* Question 2: Critical Condition Toggles */}
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <label className="text-xs font-bold text-neutral-200 block">
                2. Immediate Hazards / Vulnerabilities
              </label>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setIsTrapped(!isTrapped)}
                  className={`w-full p-2.5 rounded-lg text-xs font-semibold text-left border flex items-center justify-between ${
                    isTrapped
                      ? 'border-amber-500 bg-amber-950/40 text-amber-200'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-400'
                  }`}
                >
                  <span>Water rising inside / Physically trapped</span>
                  <span className="font-mono text-[10px]">{isTrapped ? '[YES]' : '[NO]'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHasMedical(!hasMedical)}
                  className={`w-full p-2.5 rounded-lg text-xs font-semibold text-left border flex items-center justify-between ${
                    hasMedical
                      ? 'border-red-500 bg-red-950/40 text-red-200'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-400'
                  }`}
                >
                  <span>Infant / Elderly / Oxygen dependent</span>
                  <span className="font-mono text-[10px]">{hasMedical ? '[YES]' : '[NO]'}</span>
                </button>
              </div>
            </div>

            {/* Question 3: Landmark / Micro-location */}
            <div className="space-y-1.5 pt-2 border-t border-neutral-800">
              <label className="text-xs font-bold text-neutral-200 block">
                3. Landmark or Exact Floor (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 2nd floor, blue roof, near water tank"
                value={landmarkNotes}
                onChange={(e) => setLandmarkNotes(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Update Action Button */}
          <div className="space-y-2">
            <button
              type="button"
              disabled={isUpdating}
              onClick={handleFollowUpSubmit}
              className="w-full py-3.5 rounded-xl bg-neutral-100 hover:bg-white active:bg-neutral-300 text-neutral-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : enrichmentSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Rescuers Updated!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Updates to Rescuers</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Persistent Footer Emergency Fallback */}
      <footer className="pt-3 border-t border-neutral-900 text-center">
        <a
          href="tel:112"
          className="text-xs font-mono text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          National Emergency Helpline: <strong className="text-neutral-300 underline">Call 112</strong>
        </a>
      </footer>
    </main>
  );
}
