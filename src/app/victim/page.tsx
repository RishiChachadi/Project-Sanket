'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { queueDistressReport, getQueuedReports, removeQueuedReport } from '@/lib/offlineQueue';
import { 
  AlertTriangle, 
  Flame, 
  Droplets, 
  HeartPulse, 
  Home, 
  Wifi, 
  WifiOff, 
  Send, 
  PhoneCall, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';

export default function VictimSOSPage() {
  // State
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [hazard, setHazard] = useState<'Flood' | 'Fire' | 'Medical' | 'Trapped'>('Flood');
  const [headcount, setHeadcount] = useState(1);
  const [isTrappedRoof, setIsTrappedRoof] = useState(false);
  const [isMedicalUrgent, setIsMedicalUrgent] = useState(false);
  const [extraNotes, setExtraNotes] = useState('');
  
  const [isOnline, setIsOnline] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [queuedCount, setQueuedCount] = useState(0);

  // 1. Monitor network status and flush offline queue
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const checkQueue = async () => {
      const queued = await getQueuedReports();
      setQueuedCount(queued.length);
    };
    checkQueue();

    const handleOnline = async () => {
      setIsOnline(true);
      await flushQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. Continuous high-accuracy GPS capture
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError('GPS not supported on this device');
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
        setGpsError('Acquiring satellite lock... Enable GPS location');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Flush background sync queue
  const flushQueue = async () => {
    const reports = await getQueuedReports();
    if (reports.length === 0) return;

    for (const item of reports) {
      try {
        const { error } = await supabase.rpc('ingest_distress_report', {
          p_lat: item.latitude,
          p_lng: item.longitude,
          p_hazard: item.hazard_type,
          p_headcount: item.headcount,
          p_note: item.note,
          p_source: 'PWA_SYNC'
        });

        if (!error && item.id) {
          await removeQueuedReport(item.id);
        }
      } catch (err) {
        console.error('Error syncing queued item:', err);
      }
    }
    const remaining = await getQueuedReports();
    setQueuedCount(remaining.length);
  };

  // Submit SOS
  const handleSOS = async () => {
    // Fallback coordinates for testing if indoor GPS cannot fix
    const lat = coords?.lat || 12.9716;
    const lng = coords?.lng || 77.5946;

    const notesSummary = [
      isTrappedRoof ? 'TRAPPED ON ROOF/HIGH GROUND' : '',
      isMedicalUrgent ? 'URGENT MEDICAL/CRITICAL MEDICINE NEEDED' : '',
      extraNotes
    ].filter(Boolean).join(' | ');

    setIsSubmitting(true);
    setStatusMessage(null);

    const payload = {
      latitude: lat,
      longitude: lng,
      hazard_type: hazard,
      headcount: headcount,
      note: notesSummary || 'Immediate assistance requested',
      source: 'PWA_DIRECT'
    };

    if (!navigator.onLine) {
      // Offline mode: queue in IndexedDB
      await queueDistressReport(payload);
      const remaining = await getQueuedReports();
      setQueuedCount(remaining.length);
      setIsSubmitting(false);
      setStatusMessage('Network offline. Distress beacon queued! It will auto-transmit immediately when signal returns.');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('ingest_distress_report', {
        p_lat: payload.latitude,
        p_lng: payload.longitude,
        p_hazard: payload.hazard_type,
        p_headcount: payload.headcount,
        p_note: payload.note,
        p_source: payload.source
      });

      if (error) throw error;

      setStatusMessage('Distress beacon received! Dispatch team notified.');
    } catch (err: any) {
      console.error('RPC Error:', err);
      // Fallback to queue if network or server error occurs
      await queueDistressReport(payload);
      const remaining = await getQueuedReports();
      setQueuedCount(remaining.length);

      const errMsg = err?.message || 'Unknown error';
      const errCode = err?.code ? ` (Code: ${err.code})` : '';
      setStatusMessage(`Error transmitting beacon: ${errMsg}${errCode}. Beacon queued to outbox.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pre-formatted SMS intent for zero-data scenarios
  const fallbackLat = coords?.lat?.toFixed(4) || '12.9716';
  const fallbackLng = coords?.lng?.toFixed(4) || '77.5946';
  const smsBody = encodeURIComponent(
    `SOS ${hazard.toUpperCase()} ${fallbackLat},${fallbackLng} ${headcount}ppl ${isTrappedRoof ? 'ROOF ' : ''}${isMedicalUrgent ? 'MED ' : ''}${extraNotes}`
  );
  // Replace with your Twilio/Helpline incoming SMS number
  const smsHref = `sms:+18005550199?body=${smsBody}`;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between max-w-md mx-auto p-4 select-none">
      {/* Header bar */}
      <header className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div>
          <h1 className="text-xl font-black tracking-wider text-red-500 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 animate-pulse" /> SANKET SOS
          </h1>
          <p className="text-xs text-neutral-400">Emergency Civilian Dispatch Link</p>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <span className="flex items-center gap-1 text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-1 rounded-full">
              <Wifi className="w-3 h-3" /> Online
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs bg-amber-950 text-amber-400 border border-amber-800 px-2 py-1 rounded-full">
              <WifiOff className="w-3 h-3" /> Offline ({queuedCount})
            </span>
          )}
        </div>
      </header>

      {/* GPS Status Indicator */}
      <div className="my-2 p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs flex justify-between items-center">
        <div>
          <span className="text-neutral-400 block">CURRENT COORDINATES</span>
          <span className="font-mono text-neutral-200">
            {coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : gpsError || 'Locking satellites...'}
          </span>
        </div>
        <span className={`w-2.5 h-2.5 rounded-full ${coords ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
      </div>

      {/* Hazard Type Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-neutral-400 tracking-wider">SELECT SITUATION</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'Flood', label: 'Rising Flood', icon: Droplets, color: 'border-blue-600 active:bg-blue-950' },
            { id: 'Fire', label: 'Active Fire', icon: Flame, color: 'border-orange-600 active:bg-orange-950' },
            { id: 'Trapped', label: 'Trapped / Collapse', icon: Home, color: 'border-purple-600 active:bg-purple-950' },
            { id: 'Medical', label: 'Medical Urgent', icon: HeartPulse, color: 'border-red-600 active:bg-red-950' },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = hazard === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setHazard(item.id as any)}
                className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                  isSelected 
                    ? 'bg-neutral-800 border-white text-white font-bold ring-2 ring-white/20' 
                    : 'bg-neutral-900/60 border-neutral-800 text-neutral-400'
                }`}
              >
                <Icon className={`w-5 h-5 ${isSelected ? 'text-red-400' : 'text-neutral-500'}`} />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Headcount Stepper */}
      <div className="my-2 p-3 bg-neutral-900/80 rounded-xl border border-neutral-800 flex items-center justify-between">
        <div>
          <span className="text-sm font-bold block">People Stranded</span>
          <span className="text-xs text-neutral-400">Total adults & children</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setHeadcount(Math.max(1, headcount - 1))}
            className="w-10 h-10 rounded-lg bg-neutral-800 text-xl font-bold flex items-center justify-center active:bg-neutral-700"
          >
            -
          </button>
          <span className="text-lg font-mono font-bold w-6 text-center">{headcount}</span>
          <button
            type="button"
            onClick={() => setHeadcount(headcount + 1)}
            className="w-10 h-10 rounded-lg bg-neutral-800 text-xl font-bold flex items-center justify-center active:bg-neutral-700"
          >
            +
          </button>
        </div>
      </div>

      {/* Critical Vulnerability Quick Toggles */}
      <div className="space-y-2">
        <label className="flex items-center gap-3 p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-sm">
          <input
            type="checkbox"
            checked={isTrappedRoof}
            onChange={(e) => setIsTrappedRoof(e.target.checked)}
            className="w-5 h-5 rounded accent-red-600"
          />
          <span>Trapped on roof / Water inside structure</span>
        </label>
        <label className="flex items-center gap-3 p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-sm">
          <input
            type="checkbox"
            checked={isMedicalUrgent}
            onChange={(e) => setIsMedicalUrgent(e.target.checked)}
            className="w-5 h-5 rounded accent-red-600"
          />
          <span>Critical medical dependency (Infant/Elderly/Oxygen)</span>
        </label>
      </div>

      {/* Quick Optional Note */}
      <input
        type="text"
        placeholder="Optional details (e.g. 2nd floor, blue house)"
        value={extraNotes}
        onChange={(e) => setExtraNotes(e.target.value)}
        className="my-2 w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-red-600"
      />

      {/* Submission Feedback Message */}
      {statusMessage && (
        <div className="p-3 rounded-lg bg-red-950/80 border border-red-800 text-xs text-red-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-red-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* MAIN ONE-TAP SOS TRIGGER */}
      <div className="pt-2 pb-1 space-y-2">
        <button
          type="button"
          onClick={handleSOS}
          disabled={isSubmitting}
          className="w-full py-5 rounded-2xl bg-red-600 text-white font-black text-xl tracking-wider uppercase shadow-lg shadow-red-900/50 hover:bg-red-500 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              TRANSMITTING BEACON...
            </>
          ) : (
            <>
              <Send className="w-6 h-6" />
              TRANSMIT SOS BEACON
            </>
          )}
        </button>

        {/* SMS FALLBACK BUTTON */}
        <a
          href={smsHref}
          className="w-full py-3 rounded-xl bg-neutral-900 border border-neutral-700 text-neutral-300 font-bold text-sm flex items-center justify-center gap-2 active:bg-neutral-800"
        >
          <PhoneCall className="w-4 h-4 text-emerald-400" />
          DATA DEAD? SEND AS SMS
        </a>
      </div>
    </div>
  );
}
