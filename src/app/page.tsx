import Link from 'next/link';
import { 
  AlertOctagon, 
  ShieldAlert, 
  Radio, 
  PhoneCall, 
  MapPin, 
  Sparkles, 
  WifiOff, 
  Layers,
  ArrowRight
} from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 font-sans flex flex-col justify-between p-4 md:p-8 max-w-5xl mx-auto selection:bg-red-500 selection:text-white">
      {/* Tactical Top Bar */}
      <header className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-600/20 border border-red-500 flex items-center justify-center">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-widest uppercase flex items-center gap-2">
              PROJECT SANKET <span className="text-xs text-neutral-400 font-mono font-normal">(ಸಂಕೇತ್)</span>
            </h1>
            <p className="text-[11px] font-mono text-neutral-400">
              Low-Bandwidth Crisis Response & Computer-Aided Dispatch (CAD)
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-neutral-300">GRID STATUS: ACTIVE</span>
        </div>
      </header>

      {/* Primary Triage Gateway Cards */}
      <div className="my-auto py-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Citizen SOS */}
        <Link
          href="/victim"
          className="group relative overflow-hidden rounded-2xl border-2 border-red-600/60 bg-gradient-to-b from-neutral-900 via-neutral-900 to-red-950/30 p-6 md:p-8 flex flex-col justify-between hover:border-red-500 transition-all shadow-[0_0_30px_rgba(220,38,38,0.15)] hover:shadow-[0_0_40px_rgba(220,38,38,0.3)] active:scale-[0.99]"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded bg-red-600 text-white font-black font-mono text-[11px] uppercase tracking-wider">
                FOR CITIZENS IN DANGER
              </span>
              <AlertOctagon className="w-8 h-8 text-red-500 group-hover:scale-110 transition-transform" />
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white group-hover:text-red-400 transition-colors">
                Transmit Emergency SOS
              </h2>
              <p className="text-xs md:text-sm text-neutral-400 mt-2 leading-relaxed">
                Instant one-tap coordinate lock and alert dispatch. Operates on throttled 2G networks with automatic offline SMS backup.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono text-neutral-400">
              <span className="flex items-center gap-1 bg-neutral-950 px-2 py-1 rounded border border-neutral-800">
                <MapPin className="w-3 h-3 text-red-400" /> GPS Tagged
              </span>
              <span className="flex items-center gap-1 bg-neutral-950 px-2 py-1 rounded border border-neutral-800">
                <WifiOff className="w-3 h-3 text-amber-400" /> 2G / SMS Redundant
              </span>
              <span className="flex items-center gap-1 bg-neutral-950 px-2 py-1 rounded border border-neutral-800">
                <Sparkles className="w-3 h-3 text-sky-400" /> Multilingual Triage
              </span>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-red-400 group-hover:translate-x-1 transition-transform">
            <span>Launch Citizen Distress Beacon</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Card 2: Rescuer CAD Desk */}
        <Link
          href="/rescuer"
          className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 md:p-8 flex flex-col justify-between hover:border-blue-500/80 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] active:scale-[0.99]"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded bg-blue-950 border border-blue-800 text-blue-300 font-bold font-mono text-[11px] uppercase tracking-wider">
                FIRST RESPONDERS & COMMAND
              </span>
              <ShieldAlert className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white group-hover:text-blue-400 transition-colors">
                Tactical Command Desk
              </h2>
              <p className="text-xs md:text-sm text-neutral-400 mt-2 leading-relaxed">
                Common Operating Picture (COP) featuring PostGIS spatial clusters, multimodal AI damage verification, and evacuation routing.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono text-neutral-400">
              <span className="flex items-center gap-1 bg-neutral-950 px-2 py-1 rounded border border-neutral-800">
                <Layers className="w-3 h-3 text-blue-400" /> 50m Spatial Clusters
              </span>
              <span className="flex items-center gap-1 bg-neutral-950 px-2 py-1 rounded border border-neutral-800">
                <Sparkles className="w-3 h-3 text-purple-400" /> Gemini Vision AI
              </span>
              <span className="flex items-center gap-1 bg-neutral-950 px-2 py-1 rounded border border-neutral-800">
                <MapPin className="w-3 h-3 text-emerald-400" /> Safe Haven Routing
              </span>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-400 group-hover:translate-x-1 transition-transform">
            <span>Open Incident Command Board</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>

      {/* Emergency Quick-Dial Helpline Strip */}
      <footer className="border-t border-neutral-800 pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-red-500" />
            National Emergency Direct Dial Lines
          </span>
          <span className="text-[10px] font-mono text-neutral-500">Toll-Free 24/7 Dispatch</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <a
            href="tel:112"
            className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 flex items-center justify-between group transition-colors"
          >
            <div>
              <div className="text-[10px] text-neutral-400 uppercase">National All-in-One</div>
              <div className="font-black text-white group-hover:text-red-400 text-sm">112</div>
            </div>
            <PhoneCall className="w-4 h-4 text-neutral-500 group-hover:text-white" />
          </a>

          <a
            href="tel:101"
            className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 flex items-center justify-between group transition-colors"
          >
            <div>
              <div className="text-[10px] text-neutral-400 uppercase">Fire & Rescue</div>
              <div className="font-black text-white group-hover:text-amber-400 text-sm">101</div>
            </div>
            <PhoneCall className="w-4 h-4 text-neutral-500 group-hover:text-white" />
          </a>

          <a
            href="tel:108"
            className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 flex items-center justify-between group transition-colors"
          >
            <div>
              <div className="text-[10px] text-neutral-400 uppercase">Ambulance / Trauma</div>
              <div className="font-black text-white group-hover:text-emerald-400 text-sm">108</div>
            </div>
            <PhoneCall className="w-4 h-4 text-neutral-500 group-hover:text-white" />
          </a>

          <a
            href="tel:1077"
            className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 flex items-center justify-between group transition-colors"
          >
            <div>
              <div className="text-[10px] text-neutral-400 uppercase">Disaster Control HQ</div>
              <div className="font-black text-white group-hover:text-blue-400 text-sm">1077</div>
            </div>
            <PhoneCall className="w-4 h-4 text-neutral-500 group-hover:text-white" />
          </a>
        </div>
      </footer>
    </main>
  );
}
