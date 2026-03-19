'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

function getNextDeadline(): Date {
  const now = new Date();
  // Get current time in Africa/Lagos (UTC+1)
  const lagosOffset = 1; // hours
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const lagosNow = new Date(utcMs + lagosOffset * 3600000);

  // Target: 5:00 PM WAT today (or tomorrow if past 5pm)
  const target = new Date(lagosNow);
  target.setHours(17, 0, 0, 0);

  if (lagosNow >= target) {
    target.setDate(target.getDate() + 1);
  }

  // Convert back to local time
  const targetUtcMs = target.getTime() - lagosOffset * 3600000;
  return new Date(targetUtcMs - now.getTimezoneOffset() * 60000);
}

function formatTime(totalSeconds: number): { hours: string; minutes: string; seconds: string } {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return {
    hours: String(h).padStart(2, '0'),
    minutes: String(m).padStart(2, '0'),
    seconds: String(s).padStart(2, '0'),
  };
}

export default function CountdownCTA() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    function update() {
      const deadline = getNextDeadline();
      const diff = Math.max(0, Math.floor((deadline.getTime() - Date.now()) / 1000));
      setRemaining(diff);
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const time = remaining !== null ? formatTime(remaining) : { hours: '--', minutes: '--', seconds: '--' };

  return (
    <section className="bg-amber-400 py-20 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="font-heading font-extrabold text-slate-900 text-3xl md:text-5xl mb-6">
          Size your system before 5:00 PM — free, no signup
        </h2>

        {/* Countdown */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[
            { value: time.hours, label: 'HRS' },
            { value: time.minutes, label: 'MIN' },
            { value: time.seconds, label: 'SEC' },
          ].map((unit, i) => (
            <div key={unit.label} className="flex items-center gap-3">
              <div className="bg-slate-900 rounded-xl px-4 py-3 min-w-[72px]">
                <p className="font-heading font-extrabold text-white text-3xl md:text-4xl tabular-nums">
                  {unit.value}
                </p>
                <p className="text-slate-400 text-[10px] font-semibold tracking-widest">{unit.label}</p>
              </div>
              {i < 2 && <span className="font-extrabold text-slate-900 text-3xl">:</span>}
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/calculator"
            className="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-full px-8 py-4 transition-all text-lg"
          >
            Calculate My System →
          </Link>
          <Link
            href="/marketplace"
            className="inline-flex items-center justify-center border-2 border-slate-900 text-slate-900 hover:bg-slate-900/10 font-semibold rounded-full px-8 py-4 transition-all text-lg"
          >
            Browse Verified Builders
          </Link>
        </div>
      </div>
    </section>
  );
}
