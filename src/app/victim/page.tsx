'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  AlertOctagon, 
  CheckCircle2, 
  MapPin, 
  Radio, 
  Send, 
  Loader2, 
  MessageSquare, 
  BatteryCharging, 
  WifiOff, 
  SunMedium,
  Megaphone,
  X
} from 'lucide-react';

interface BroadcastAlert {
  message: string;
  severity: 'CRITICAL' | 'ADVISORY';
  timestamp: string;
}

export default function VictimPage() {
  const [stage, setStage] = useState<'trigger' | 'followup'>('trigger');
  
  // Geolocation
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Connectivity & State
  const [isOffline, setIsOffline] = useState(false);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Broadcast Alert State (From Rescuer Command)
  const [activeBroadcast, setActiveBroadcast] = useState<BroadcastAlert | null>(null);

  // Stage 1 Selection
  const [selectedHazard, setSelectedHazard] = useState<string>('Flood');

  // Stage 2 Follow-ups
  const [headcount, setHeadcount] = useState<number>(1);
  const [hasMedical, setHasMedical] = useState<boolean>(false);
  const [isTrapped, setIsTrapped] = useState<boolean>(false);
  const [landmarkNotes, setLandmarkNotes] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [enrichmentSaved, setEnrichmentSaved] = useState<boolean>(false);

  // Battery Saver Mode
  const [batterySaver, setBatterySaver] = useState<boolean>(false);

  // Register SW & Network Listener
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('SW registration failed:', err);
      });
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for Realtime Broadcast Alerts from Rescuer Command
  useEffect(() => {
    const broadcastChannel = supabase
      .channel('disaster-broadcasts')
      .on('broadcast', { event: 'evacuation_alert' }, (payload) => {
        if (payload?.payload) {
          setActiveBroadcast(payload.payload as BroadcastAlert);
          // Haptic alert on mobile hardware
          if ('vibrate' in navigator) {
            navigator.vibrate([300, 150, 300, 150, 400]);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(broadcastChannel);
    };
  }, []);

  // Geolocation Watcher
  useEffect(() => {
    if (!('geolocation' in navigator)) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setAccuracy(Math.round(pos.coords.accuracy));
      },
      (err) => {
        console.warn('GPS degraded, using sector fallback:', err.message);
        setCoords({ lat: 12.9716, lng: 77.5946 });
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const generateSmsLink = () => {
    const lat = coords?.lat?.toFixed(5) || 'UNKNOWN';
    const lng = coords?.lng?.toFixed(5) || 'UNKNOWN';
    const body = `EMERGENCY SOS: Sanket Beacon\nHazard: ${selectedHazard}\nPeople: ${headcount}\nMedical: ${hasMedical ? 'YES' : 'NO'}\nTrapped: ${isTrapped ? 'YES' : 'NO'}\nLoc: ${lat},${lng}\nNote: ${landmarkNotes || 'None'}`;
    return `sms:112?&body=${encodeURIComponent(body)}`;
  };

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
        p_note: 'Initial SOS Triggered - Awaiting follow-up',
        p_source: 'PWA_PROGRESSIVE'
      });

      if (error) throw error;

      setIncidentId(data);
      setStage('followup');
    } catch (err: any) {
      console.error('Data broadcast failed:', err);
      setStatusMessage('Data link unavailable. Transmit via emergency SMS fallback below.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFollowUpSubmit = async () => {
    if (!incidentId) return;

    setIsUpdating(true);
    setEnrichmentSaved(false);

    try {
      const notesList: string[] = [];
      if (hasMedical) notesList.push('CRITICAL: Medical / Oxygen dependency');
      if (isTrapped) notesList.push('URGENT: Structure trapped / Water ingress');
      if (landmarkNotes.trim()) notesList.push(`Landmark: ${landmarkNotes.trim()}`);

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
      
      setTimeout(() => {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        setBatterySaver(true);
      }, 2000);

    } catch (err: any) {
      console.error('Failed to update details:', err);
      setStatusMessage('Failed to sync details. Use SMS fallback if urgent.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (batterySaver) {
    return (
      <main className="min-h-screen bg-black text-neutral-400 font-mono flex flex-col justify-between p-6 select-none">
        <div className="space-y-4 pt-8">
          <div className="inline-flex items-center gap-2 border border-emerald-900 bg-emerald-950/40 text-emerald-400 px-3 py-1 rounded text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>BEACON TRANSMITTED & LOGGED</span>
          </div>

          <h1 className="text-xl font-bold text-neutral-200">
            Battery Preservation Active
          </h1>
          <p className="text-xs text-neutral-500 leading-relaxed">
            GPS polling halted. Keep your device on this screen until rescue teams arrive.
          </p>

          <div className="border border-neutral-900 bg-neutral-950 p-3 rounded text-xs space-y-1 text-neutral-400">
            <div>Incident Cluster: <span className="text-neutral-200">{incidentId?.slice(0, 8)}...</span></div>
            <div>Coordinates: <span className="text-neutral-200">{coords?.lat.toFixed(4)}, {coords?.lng.toFixed(4)}</span></div>
            <div>Status: <span className="text-emerald-400 font-bold">QUEUED FOR DISPATCH</span></div>
          </div>
        </div>

        <div className="space-y-3 pb-4">
          <a
            href={generateSmsLink()}
            className="w-full py-3 rounded border border-neutral-800 bg-neutral-900/60 text-neutral-300 flex items-center justify-center gap-2 text-xs font-bold"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            Send Redundant SMS Backup
          </a>
          <button
            type="button"
            onClick={() => setBatterySaver(false)}
            className="w-full py-2 text-neutral-600 hover:text-neutral-400 text-xs flex items-center justify-center gap-1"
          >
            <SunMedium className="w-3.5 h-3.5" />
            Exit Battery Preservation Mode
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col justify-between p-4 max-w-md mx-auto select-none">
      {/* Realtime Commander Emergency Advisory Banner */}
      {activeBroadcast && (
        <div className="mb-3 bg-red-600 border border-red-500 text-white p-3 rounded-xl shadow-lg animate-pulse flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5">
            <Megaphone className="w-5 h-5 text-white shrink-0 mt-0.5" />
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider bg-red-800 px-1.5 py-0.5 rounded inline-block">
                OFFICIAL COMMAND ALERT
              </div>
              <p className="text-xs font-bold mt-1 leading-snug">
                {activeBroadcast.message}
              </p>
              <span className="text-[9px] text-red-200 font-mono block mt-1">
                Issued: {new Date(activeBroadcast.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveBroadcast(null)}
            className="text-red-200 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Telemetry Ribbon */}
      <header className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-red-500 animate-pulse" />
          <span className="text-xs font-black tracking-widest uppercase">Project Sanket</span>
        </div>
        
        <div className="flex items-center gap-2">
          {isOffline && (
            <div className="flex items-center gap-1 text-[10px] font-mono bg-red-950/80 border border-red-800 text-red-300 px-1.5 py-0.5 rounded">
              <WifiOff className="w-3 h-3" />
              <span>OFFLINE</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-[11px] font-mono bg-neutral-900 border border-neutral-800 px-2 py-1 rounded">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Locking GPS...'}
            </span>
            {accuracy && <span className="text-neutral-500 text-[9px]">(&plusmn;{accuracy}m)</span>}
          </div>
        </div>
      </header>

      {/* STAGE 1 */}
      {stage === 'trigger' && (
        <div className="flex-1 flex flex-col justify-center space-y-5 my-4">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-100">
              Emergency Distress
            </h1>
            <p className="text-xs text-neutral-400">
              Tap once to lock coordinates and alert rescue commanders.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono tracking-wider uppercase text-neutral-400">
              Select Immediate Danger
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'Flood', label: 'Rising Flood' },
                { id: 'Fire', label: 'Active Fire' },
                { id: 'Trapped', label: 'Trapped / Collapse' },
                { id: 'Medical', label: 'Medical Urgent' },
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

          <div className="pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleInitialSOS}
              className="w-full h-40 rounded-2xl bg-gradient-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 active:scale-95 transition-all shadow-[0_0_40px_rgba(239,68,68,0.35)] flex flex-col items-center justify-center gap-2 border-2 border-red-400/40"
            >
              {isSubmitting ? (
                <Loader2 className="w-12 h-12 animate-spin text-white" />
              ) : (
                <>
                  <AlertOctagon className="w-12 h-12 text-white" />
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

          <a
            href={generateSmsLink()}
            className="w-full py-3 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 flex items-center justify-center gap-2 text-xs font-bold text-neutral-300 transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>NO DATA? SEND VIA SMS (112)</span>
          </a>

          {statusMessage && (
            <p className="text-center text-xs text-red-400 font-mono bg-red-950/50 p-2 rounded border border-red-900">
              {statusMessage}
            </p>
          )}
        </div>
      )}

      {/* STAGE 2 */}
      {stage === 'followup' && (
        <div className="flex-1 flex flex-col justify-between py-3 space-y-4">
          <div className="bg-emerald-950/60 border border-emerald-800 p-3 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                Beacon Dispatched
              </h2>
              <p className="text-[11px] text-emerald-300/80">
                Coordinates locked. Answer below to equip field units:
              </p>
            </div>
          </div>

          <div className="space-y-4 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-200 flex items-center justify-between">
                <span>1. People stranded:</span>
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

            <div className="space-y-1.5 pt-2 border-t border-neutral-800">
              <label className="text-xs font-bold text-neutral-200 block">
                3. Landmark / Exact Spot (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 2nd floor balcony, blue gate"
                value={landmarkNotes}
                onChange={(e) => setLandmarkNotes(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

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
                  <span>Updates Dispatched! Entering Battery Saver...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Transmit Field Updates</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setBatterySaver(true)}
              className="w-full py-2.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 text-xs font-semibold flex items-center justify-center gap-1.5 hover:text-neutral-200"
            >
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
              <span>Enable Battery Preservation Now</span>
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="pt-2 border-t border-neutral-900 text-center">
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
