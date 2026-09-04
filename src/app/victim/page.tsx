'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  X,
  Truck,
  Clock,
  RotateCcw,
  Timer,
  Globe
} from 'lucide-react';

interface BroadcastAlert {
  message: string;
  severity: 'CRITICAL' | 'ADVISORY';
  timestamp: string;
}

type IncidentStatus = 'pending' | 'dispatched' | 'resolved';
type Language = 'EN' | 'KN' | 'HI';

const TRANSLATIONS = {
  EN: {
    appTitle: 'Project Sanket',
    gpsLocking: 'Locking GPS...',
    offlineBadge: 'OFFLINE',
    stage1Heading: 'Emergency Distress',
    stage1Sub: 'Tap once to lock coordinates and alert rescue commanders.',
    selectDanger: 'Select Immediate Danger',
    flood: 'Rising Flood',
    fire: 'Active Fire',
    trapped: 'Trapped / Collapse',
    medical: 'Medical Urgent',
    transmitSos: 'TRANSMIT SOS',
    instantTagged: 'Instant Dispatched • GPS Tagged',
    smsFallback: 'NO DATA? SEND VIA SMS (112)',
    stage2Queued: 'Beacon Queued for Dispatch',
    stage2QueuedSub: 'Sector Command received your location. Provide details below:',
    stage2Dispatched: 'Rescue Units Dispatched',
    stage2DispatchedSub: 'Emergency responders have been deployed and are en route.',
    stage2Resolved: 'Incident Marked Resolved',
    stage2ResolvedSub: 'Sector Command closed this operation. Returning shortly.',
    q1Headcount: '1. People stranded:',
    person: 'Person(s)',
    q2Hazards: '2. Immediate Hazards / Vulnerabilities',
    waterTrapped: 'Water rising inside / Physically trapped',
    infantElderly: 'Infant / Elderly / Oxygen dependent',
    q3Landmark: '3. Landmark / Exact Spot (Optional)',
    landmarkPlaceholder: 'e.g. 2nd floor balcony, blue gate',
    sendUpdates: 'Transmit Field Updates',
    updatesSynced: 'Field Notes Synced! Entering Battery Saver...',
    enableBatterySaver: 'Enable Battery Preservation Now',
    batteryTitle: 'Battery Preservation Active',
    batterySub: 'GPS polling halted. Keep this screen active until rescue teams arrive.',
    smsRedundant: 'Send Redundant SMS Backup',
    exitBattery: 'Exit Battery Preservation Mode',
    stillInDanger: 'Still in danger? Cancel reset',
    resetNow: 'Reset Now',
    resettingIn: 'Resetting in',
    commandAlert: 'OFFICIAL COMMAND ALERT',
    helpline: 'National Emergency Helpline: Call 112',
  },
  KN: {
    appTitle: 'ಸಂಕೇತ್ ರಕ್ಷಣೆ',
    gpsLocking: 'ಜಿಪಿಎಸ್ ಹುಡುಕಲಾಗುತ್ತಿದೆ...',
    offlineBadge: 'ಆಫ್‌ಲೈನ್',
    stage1Heading: 'ತುರ್ತು ಅಪಾಯ ಸಂಕೇತ',
    stage1Sub: 'ರಕ್ಷಣಾ ಕಮಾಂಡರ್‌ಗಳಿಗೆ ತಕ್ಷಣ ಮಾಹಿತಿ ರವಾನಿಸಲು ಒಮ್ಮೆ ಒತ್ತಿ.',
    selectDanger: 'ತಕ್ಷಣದ ಅಪಾಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    flood: 'ಹೆಚ್ಚುತ್ತಿರುವ ಪ್ರವಾಹ',
    fire: 'ಬೆಂಕಿ ಅವಘಡ',
    trapped: 'ಸಿಲುಕಿಕೊಂಡಿದ್ದೇವೆ / ಕುಸಿತ',
    medical: 'ತುರ್ತು ವೈದ್ಯಕೀಯ',
    transmitSos: 'ತುರ್ತು ಎಸ್‌ಒಎಸ್ ಕಳುಹಿಸಿ',
    instantTagged: 'ತ್ವರಿತ ರವಾನೆ • ಜಿಪಿಎಸ್ ಲಾಕ್ ಆಗಿದೆ',
    smsFallback: 'ಇಂಟರ್ನೆಟ್ ಇಲ್ಲವೇ? SMS ಕಳುಹಿಸಿ (112)',
    stage2Queued: 'ರಕ್ಷಣಾ ಪಟ್ಟಿಯಲ್ಲಿ ದಾಖಲಾಗಿದೆ',
    stage2QueuedSub: 'ನಿಮ್ಮ ಸ್ಥಳ ದಾಖಲಾಗಿದೆ. ರಕ್ಷಣಾ ತಂಡಕ್ಕೆ ಹೆಚ್ಚಿನ ಮಾಹಿತಿ ನೀಡಿ:',
    stage2Dispatched: 'ರಕ್ಷಣಾ ಪಡೆಗಳು ಹೊರಟಿವೆ',
    stage2DispatchedSub: 'ತುರ್ತು ರಕ್ಷಣಾ ತಂಡಗಳು ನಿಮ್ಮ ಸ್ಥಳದತ್ತ ಧಾವಿಸುತ್ತಿವೆ.',
    stage2Resolved: 'ರಕ್ಷಣಾ ಕಾರ್ಯಾಚರಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ',
    stage2ResolvedSub: 'ಕಮಾಂಡ್ ಸೆಂಟರ್ ಈ ಕರೆಯನ್ನು ಪರಿಹರಿಸಿದೆ.',
    q1Headcount: '1. ಸಿಲುಕಿರುವ ಜನರ ಸಂಖ್ಯೆ:',
    person: 'ಜನರು',
    q2Hazards: '2. ತಕ್ಷಣದ ಅಪಾಯಗಳು / ವಿಶೇಷ ಕಾಳಜಿ',
    waterTrapped: 'ನೀರು ಒಳನುಗ್ಗುತ್ತಿದೆ / ಸಿಲುಕಿಕೊಂಡಿದ್ದೇವೆ',
    infantElderly: 'ಶಿಶು / ಹಿರಿಯರು / ಆಮ್ಲಜನಕದ ಅಗತ್ಯವಿದೆ',
    q3Landmark: '3. ಹತ್ತಿರದ ಗುರುತು ಅಥವಾ ಮಹಡಿ (ಐಚ್ಛಿಕ)',
    landmarkPlaceholder: 'ಉದಾ: 2ನೇ ಮಹಡಿ ಬಾಲ್ಕನಿ, ನೀಲಿ ಗೇಟ್',
    sendUpdates: 'ಮಾಹಿತಿಯನ್ನು ರವಾನಿಸಿ',
    updatesSynced: 'ಮಾಹಿತಿ ತಲುಪಿದೆ! ಬ್ಯಾಟರಿ ಸೇವರ್ ಆನ್ ಆಗುತ್ತಿದೆ...',
    enableBatterySaver: 'ಈಗಲೇ ಬ್ಯಾಟರಿ ಉಳಿತಾಯ ಮೋಡ್ ಆನ್ ಮಾಡಿ',
    batteryTitle: 'ಬ್ಯಾಟರಿ ಉಳಿತಾಯ ಮೋಡ್ ಸಕ್ರಿಯವಾಗಿದೆ',
    batterySub: 'ಜಿಪಿಎಸ್ ನಿಲ್ಲಿಸಲಾಗಿದೆ. ರಕ್ಷಣಾ ತಂಡ ಬರುವವರೆಗೆ ಈ ಪರದೆಯನ್ನು ಮುಚ್ಚಬೇಡಿ.',
    smsRedundant: 'ಬದಲಿ SMS ರವಾನಿಸಿ',
    exitBattery: 'ಬ್ಯಾಟರಿ ಸೇವರ್‌ನಿಂದ ನಿರ್ಗಮಿಸಿ',
    stillInDanger: 'ಇನ್ನೂ ಅಪಾಯದಲ್ಲಿದ್ದೀರಾ? ಮರು-ತೆರೆಯಿರಿ',
    resetNow: 'ಈಗಲೇ ಮರುಹೊಂದಿಸಿ',
    resettingIn: 'ಮರುಹೊಂದಿಕೆ:',
    commandAlert: 'ಸರ್ಕಾರಿ ಕಮಾಂಡ್ ಎಚ್ಚರಿಕೆ',
    helpline: 'ರಾಷ್ಟ್ರೀಯ ತುರ್ತು ಸಹಾಯವಾಣಿ: 112 ಕರೆ ಮಾಡಿ',
  },
  HI: {
    appTitle: 'प्रोजेक्ट संकेत',
    gpsLocking: 'जीपीएस लॉक हो रहा है...',
    offlineBadge: 'ऑफलाइन',
    stage1Heading: 'आपातकालीन संकट (SOS)',
    stage1Sub: 'बचाव दल को अपना स्थान भेजने के लिए एक बार टैप करें।',
    selectDanger: 'तत्काल संकट चुनें',
    flood: 'बाढ़ / पानी का भराव',
    fire: 'आग का संकट',
    trapped: 'फंसे हुए हैं / मलबा',
    medical: 'चिकित्सा आपातकाल',
    transmitSos: 'आपातकालीन SOS भेजें',
    instantTagged: 'तुरंत सतर्क • जीपीएस से जुड़ा',
    smsFallback: 'इंटरनेट बंद है? SMS भेजें (112)',
    stage2Queued: 'मदद के लिए कतार में है',
    stage2QueuedSub: 'कमांड सेंटर को आपका स्थान मिला। कृपया नीचे विवरण दें:',
    stage2Dispatched: 'बचाव दल रवाना हो चुका है',
    stage2DispatchedSub: 'आपातकालीन बचाव कर्मी आपके स्थान की ओर आ रहे हैं।',
    stage2Resolved: 'राहत कार्य पूरा हुआ',
    stage2ResolvedSub: 'कमांड सेंटर ने इस घटना को सुलझा लिया है।',
    q1Headcount: '1. फंसे हुए लोगों की संख्या:',
    person: 'लोग',
    q2Hazards: '2. गंभीर खतरे / विशेष स्थिति',
    waterTrapped: 'अंदर पानी बढ़ रहा है / फंसे हुए हैं',
    infantElderly: 'शिशु / बुजुर्ग / ऑक्सीजन की आवश्यकता',
    q3Landmark: '3. पहचान चिन्ह या सटीक मंजिल (वैकल्पिक)',
    landmarkPlaceholder: 'उदा. दूसरी मंजिल की बालकनी, नीला गेट',
    sendUpdates: 'अतिरिक्त विवरण भेजें',
    updatesSynced: 'जानकारी भेजी गई! बैटरी सेवर सक्रिय...',
    enableBatterySaver: 'बैटरी सेवर चालू करें',
    batteryTitle: 'बैटरी सेवर मोड सक्रिय',
    batterySub: 'बचाव दल के आने तक फोन की रोशनी कम कर दी गई है।',
    smsRedundant: 'बैकअप SMS भेजें',
    exitBattery: 'बैटरी सेवर से बाहर निकलें',
    stillInDanger: 'अभी भी खतरे में हैं? फिर से खोलें',
    resetNow: 'तुरंत रीसेट करें',
    resettingIn: 'रीसेट होने में:',
    commandAlert: 'आधिकारिक आपातकालीन चेतावनी',
    helpline: 'राष्ट्रीय आपातकालीन हेल्पलाइन: 112 पर कॉल करें',
  },
};

export default function VictimPage() {
  const [lang, setLang] = useState<Language>('EN');
  const t = TRANSLATIONS[lang];

  const [stage, setStage] = useState<'trigger' | 'followup'>('trigger');
  
  // Geolocation
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Connectivity & State
  const [isOffline, setIsOffline] = useState(false);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [incidentStatus, setIncidentStatus] = useState<IncidentStatus>('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Auto-Reset Countdown
  const [autoResetCountdown, setAutoResetCountdown] = useState<number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Broadcast Alert State
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

  const startGpsWatcher = useCallback(() => {
    if (!('geolocation' in navigator)) return;
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

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
  }, []);

  const resetToStageOne = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setAutoResetCountdown(null);
    setIncidentId(null);
    setIncidentStatus('pending');
    setHeadcount(1);
    setHasMedical(false);
    setIsTrapped(false);
    setLandmarkNotes('');
    setBatterySaver(false);
    setStatusMessage(null);
    setEnrichmentSaved(false);
    setStage('trigger');
    startGpsWatcher();
  }, [startGpsWatcher]);

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

  useEffect(() => {
    startGpsWatcher();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [startGpsWatcher]);

  useEffect(() => {
    if (!incidentId) return;

    const channel = supabase
      .channel(`incident-tracking-${incidentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'distress_incidents',
          filter: `id=eq.${incidentId}`,
        },
        (payload) => {
          if (payload.new && (payload.new as any).status) {
            const updatedStatus = (payload.new as any).status as IncidentStatus;
            setIncidentStatus(updatedStatus);

            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200, 100, 300]);
            }

            if (updatedStatus === 'resolved') {
              setAutoResetCountdown(8);
              if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

              countdownIntervalRef.current = setInterval(() => {
                setAutoResetCountdown((prev) => {
                  if (prev === null || prev <= 1) {
                    clearInterval(countdownIntervalRef.current!);
                    countdownIntervalRef.current = null;
                    resetToStageOne();
                    return null;
                  }
                  return prev - 1;
                });
              }, 1000);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [incidentId, resetToStageOne]);

  useEffect(() => {
    const broadcastChannel = supabase
      .channel('disaster-broadcasts')
      .on('broadcast', { event: 'evacuation_alert' }, (payload) => {
        if (payload?.payload) {
          setActiveBroadcast(payload.payload as BroadcastAlert);
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
        p_note: `Initial SOS [${lang}] - Awaiting follow-up`,
        p_source: 'PWA_PROGRESSIVE'
      });

      if (error) throw error;

      setIncidentId(data);
      setIncidentStatus('pending');
      setAutoResetCountdown(null);
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

  const handleReopenDistress = async () => {
    if (!incidentId) return;

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setAutoResetCountdown(null);

    try {
      await supabase
        .from('distress_incidents')
        .update({
          status: 'pending',
          priority_score: 95,
          updated_at: new Date().toISOString()
        })
        .eq('id', incidentId);

      setIncidentStatus('pending');
    } catch (err) {
      console.error('Failed to reopen distress:', err);
    }
  };

  if (batterySaver) {
    return (
      <main className="min-h-screen bg-black text-neutral-400 font-mono flex flex-col justify-between p-6 select-none">
        <div className="space-y-4 pt-8">
          {incidentStatus === 'pending' && (
            <div className="inline-flex items-center gap-2 border border-amber-800 bg-amber-950/40 text-amber-300 px-3 py-1 rounded text-xs">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>{t.stage2Queued.toUpperCase()}</span>
            </div>
          )}

          {incidentStatus === 'dispatched' && (
            <div className="inline-flex items-center gap-2 border border-blue-700 bg-blue-950/60 text-blue-300 px-3 py-1 rounded text-xs font-bold animate-pulse">
              <Truck className="w-4 h-4" />
              <span>{t.stage2Dispatched.toUpperCase()}</span>
            </div>
          )}

          {incidentStatus === 'resolved' && (
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 border border-emerald-800 bg-emerald-950/40 text-emerald-400 px-3 py-1 rounded text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t.stage2Resolved.toUpperCase()}</span>
              </div>
              {autoResetCountdown !== null && (
                <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <Timer className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                  <span>{t.resettingIn} <strong className="text-white">{autoResetCountdown}s</strong>...</span>
                </div>
              )}
            </div>
          )}

          <h1 className="text-xl font-bold text-neutral-200">
            {incidentStatus === 'dispatched' 
              ? t.stage2Dispatched 
              : incidentStatus === 'resolved'
              ? t.stage2Resolved
              : t.batteryTitle}
          </h1>

          <p className="text-xs text-neutral-500 leading-relaxed">
            {incidentStatus === 'dispatched'
              ? t.stage2DispatchedSub
              : incidentStatus === 'resolved'
              ? t.stage2ResolvedSub
              : t.batterySub}
          </p>

          <div className="border border-neutral-900 bg-neutral-950 p-3 rounded text-xs space-y-1 text-neutral-400">
            <div>Incident Cluster: <span className="text-neutral-200">{incidentId?.slice(0, 8)}...</span></div>
            <div>Coordinates: <span className="text-neutral-200">{coords?.lat.toFixed(4)}, {coords?.lng.toFixed(4)}</span></div>
            <div>
              Status:{' '}
              <span className={`font-bold uppercase ${
                incidentStatus === 'dispatched' ? 'text-blue-400' :
                incidentStatus === 'resolved' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {incidentStatus === 'dispatched' ? t.stage2Dispatched :
                 incidentStatus === 'resolved' ? t.stage2Resolved : t.stage2Queued}
              </span>
            </div>
          </div>

          {incidentStatus === 'resolved' && (
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleReopenDistress}
                className="w-full py-2.5 rounded border border-red-800 bg-red-950/50 text-red-300 flex items-center justify-center gap-2 text-xs font-bold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {t.stillInDanger}
              </button>
              <button
                type="button"
                onClick={resetToStageOne}
                className="w-full py-2 rounded bg-neutral-900 text-neutral-300 text-xs font-bold"
              >
                {t.resetNow}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3 pb-4">
          <a
            href={generateSmsLink()}
            className="w-full py-3 rounded border border-neutral-800 bg-neutral-900/60 text-neutral-300 flex items-center justify-center gap-2 text-xs font-bold"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            {t.smsRedundant}
          </a>
          <button
            type="button"
            onClick={() => setBatterySaver(false)}
            className="w-full py-2 text-neutral-600 hover:text-neutral-400 text-xs flex items-center justify-center gap-1"
          >
            <SunMedium className="w-3.5 h-3.5" />
            {t.exitBattery}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col justify-between p-4 max-w-md mx-auto select-none">
      {/* Official Advisory Banner */}
      {activeBroadcast && (
        <div className="mb-3 bg-red-600 border border-red-500 text-white p-3 rounded-xl shadow-lg animate-pulse flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5">
            <Megaphone className="w-5 h-5 text-white shrink-0 mt-0.5" />
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider bg-red-800 px-1.5 py-0.5 rounded inline-block">
                {t.commandAlert}
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

      {/* Top Telemetry Ribbon with 1-Tap Vernacular Switcher */}
      <header className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-red-500 animate-pulse" />
          <span className="text-xs font-black tracking-widest uppercase">{t.appTitle}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Vernacular Language Selector */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 text-[11px] font-bold">
            {(['EN', 'KN', 'HI'] as Language[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  lang === l
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {l === 'EN' ? 'EN' : l === 'KN' ? 'ಕನ್ನಡ' : 'हिन्दी'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono bg-neutral-900 border border-neutral-800 px-2 py-1 rounded">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : t.gpsLocking}
            </span>
          </div>
        </div>
      </header>

      {/* STAGE 1: 1-TAP PANIC BEACON */}
      {stage === 'trigger' && (
        <div className="flex-1 flex flex-col justify-center space-y-5 my-4">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-100">
              {t.stage1Heading}
            </h1>
            <p className="text-xs text-neutral-400">
              {t.stage1Sub}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono tracking-wider uppercase text-neutral-400">
              {t.selectDanger}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'Flood', label: t.flood },
                { id: 'Fire', label: t.fire },
                { id: 'Trapped', label: t.trapped },
                { id: 'Medical', label: t.medical },
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
                    {t.transmitSos}
                  </span>
                  <span className="text-[10px] text-red-200 font-mono">
                    {t.instantTagged}
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
            <span>{t.smsFallback}</span>
          </a>

          {statusMessage && (
            <p className="text-center text-xs text-red-400 font-mono bg-red-950/50 p-2 rounded border border-red-900">
              {statusMessage}
            </p>
          )}
        </div>
      )}

      {/* STAGE 2: PROGRESSIVE TRIAGE ENRICHMENT */}
      {stage === 'followup' && (
        <div className="flex-1 flex flex-col justify-between py-3 space-y-4">
          {incidentStatus === 'pending' && (
            <div className="bg-amber-950/60 border border-amber-800 p-3 rounded-xl flex items-center gap-3">
              <Clock className="w-6 h-6 text-amber-400 shrink-0 animate-pulse" />
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-amber-200">
                  {t.stage2Queued}
                </h2>
                <p className="text-[11px] text-amber-300/80">
                  {t.stage2QueuedSub}
                </p>
              </div>
            </div>
          )}

          {incidentStatus === 'dispatched' && (
            <div className="bg-blue-950/70 border border-blue-600 p-3 rounded-xl flex items-center gap-3 shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-pulse">
              <Truck className="w-6 h-6 text-blue-400 shrink-0" />
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-blue-200">
                  {t.stage2Dispatched}
                </h2>
                <p className="text-[11px] text-blue-300">
                  {t.stage2DispatchedSub}
                </p>
              </div>
            </div>
          )}

          {incidentStatus === 'resolved' && (
            <div className="bg-emerald-950/80 border border-emerald-600 p-3.5 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                    {t.stage2Resolved}
                  </h2>
                </div>
                {autoResetCountdown !== null && (
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700">
                    {t.resettingIn} {autoResetCountdown}s
                  </span>
                )}
              </div>
              <p className="text-[11px] text-emerald-300/80 leading-relaxed">
                {t.stage2ResolvedSub}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleReopenDistress}
                  className="flex-1 py-2 rounded bg-neutral-900 border border-red-900/80 text-[11px] font-bold text-red-300 flex items-center justify-center gap-1.5 hover:bg-neutral-850"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                  {t.stillInDanger}
                </button>
                <button
                  type="button"
                  onClick={resetToStageOne}
                  className="px-3 py-2 rounded bg-emerald-700 hover:bg-emerald-600 text-[11px] font-bold text-white transition-colors"
                >
                  {t.resetNow}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
            {/* Question 1 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-200 flex items-center justify-between">
                <span>{t.q1Headcount}</span>
                <span className="text-red-400 font-mono">{headcount} {t.person}</span>
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

            {/* Question 2 */}
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <label className="text-xs font-bold text-neutral-200 block">
                {t.q2Hazards}
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
                  <span>{t.waterTrapped}</span>
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
                  <span>{t.infantElderly}</span>
                  <span className="font-mono text-[10px]">{hasMedical ? '[YES]' : '[NO]'}</span>
                </button>
              </div>
            </div>

            {/* Question 3 */}
            <div className="space-y-1.5 pt-2 border-t border-neutral-800">
              <label className="text-xs font-bold text-neutral-200 block">
                {t.q3Landmark}
              </label>
              <input
                type="text"
                placeholder={t.landmarkPlaceholder}
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
                  <span>{t.updatesSynced}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{t.sendUpdates}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setBatterySaver(true)}
              className="w-full py-2.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 text-xs font-semibold flex items-center justify-center gap-1.5 hover:text-neutral-200"
            >
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.enableBatterySaver}</span>
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
          {t.helpline}
        </a>
      </footer>
    </main>
  );
}
