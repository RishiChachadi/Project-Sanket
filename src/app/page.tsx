import Link from 'next/link';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-6 select-none">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-wider text-red-500 flex items-center justify-center gap-2">
            <AlertTriangle className="w-8 h-8 animate-pulse" /> PROJECT SANKET
          </h1>
          <p className="text-sm text-neutral-400">
            Emergency Response & Crisis Coordination System
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <Link
            href="/victim"
            className="block w-full py-5 rounded-2xl bg-red-600 hover:bg-red-500 active:scale-[0.98] transition-all font-black text-lg tracking-wide shadow-lg shadow-red-900/50"
          >
            CIVILIAN DISTRESS SOS
          </Link>

          <Link
            href="/rescuer"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-200 font-bold text-base transition-all"
          >
            <ShieldAlert className="w-5 h-5 text-blue-400" />
            RESCUER / COMMAND DASHBOARD
          </Link>
        </div>
      </div>
    </main>
  );
}
