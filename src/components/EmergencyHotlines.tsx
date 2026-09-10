'use client';

import { PhoneCall } from 'lucide-react';

export default function EmergencyHotlines() {
  return (
    <div className="w-full space-y-2.5 pt-4 border-t border-neutral-800/80">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
          <PhoneCall className="w-3.5 h-3.5 text-red-500" />
          Voice Emergency Direct Lines (Toll-Free)
        </span>
        <span className="text-[9px] font-mono text-neutral-500">24/7 PSTN Fallback</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <a
          href="tel:112"
          className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-850 flex items-center justify-between group transition-colors active:scale-95"
        >
          <div>
            <div className="text-[9px] text-neutral-400 uppercase">All-in-One</div>
            <div className="font-black text-white group-hover:text-red-400 text-sm">112</div>
          </div>
          <PhoneCall className="w-3.5 h-3.5 text-neutral-500 group-hover:text-red-400" />
        </a>

        <a
          href="tel:101"
          className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-850 flex items-center justify-between group transition-colors active:scale-95"
        >
          <div>
            <div className="text-[9px] text-neutral-400 uppercase">Fire & Rescue</div>
            <div className="font-black text-white group-hover:text-amber-400 text-sm">101</div>
          </div>
          <PhoneCall className="w-3.5 h-3.5 text-neutral-500 group-hover:text-amber-400" />
        </a>

        <a
          href="tel:108"
          className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-850 flex items-center justify-between group transition-colors active:scale-95"
        >
          <div>
            <div className="text-[9px] text-neutral-400 uppercase">Ambulance</div>
            <div className="font-black text-white group-hover:text-emerald-400 text-sm">108</div>
          </div>
          <PhoneCall className="w-3.5 h-3.5 text-neutral-500 group-hover:text-emerald-400" />
        </a>

        <a
          href="tel:1077"
          className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-850 flex items-center justify-between group transition-colors active:scale-95"
        >
          <div>
            <div className="text-[9px] text-neutral-400 uppercase">Disaster HQ</div>
            <div className="font-black text-white group-hover:text-blue-400 text-sm">1077</div>
          </div>
          <PhoneCall className="w-3.5 h-3.5 text-neutral-500 group-hover:text-blue-400" />
        </a>
      </div>
    </div>
  );
}
