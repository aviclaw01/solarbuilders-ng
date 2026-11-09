'use client';

import { useState } from 'react';
import { BellRing, CheckCircle2, AlertTriangle } from 'lucide-react';
import { isPhone, type FieldErrors } from '@/lib/validation';
import { useToast } from '@/components/ui/Toast';
import { whatsappLink } from '@/lib/site';

/**
 * "Message me when these prices change" — posts to api/notify-me.
 *
 * Honest by construction: there is no alert system. A person re-checks prices
 * and messages everyone on the list by hand, and the copy says so. Shown on
 * the brand pages and at the foot of every price guide — the two places a
 * visitor reads a price and leaves with nothing.
 */
export default function PriceWatch({
  topic,
  source,
  tone = 'light',
}: {
  /** What they will hear about, e.g. "Felicity prices". */
  topic: string;
  /** Where the signup happened, e.g. "brand:felicity". */
  source: string;
  tone?: 'light' | 'dark';
}) {
  const [whatsapp, setWhatsapp] = useState('');
  const [hp, setHp] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<FieldErrors>({});
  const { toast } = useToast();
  const dark = tone === 'dark';
  const uid = source.replace(/[^a-z0-9]/gi, '-');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'submitting') return;
    const wa = whatsapp.trim();
    const next: FieldErrors = {};
    if (!wa) next.whatsapp = 'WhatsApp number is required.';
    else if (!isPhone(wa)) next.whatsapp = 'That number looks short — e.g. 0803 000 0000.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setStatus('submitting');
    try {
      const res = await fetch('/api/notify-me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp: wa, topic, source, hp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        if (data?.fields) setErrors(data.fields as FieldErrors);
        setStatus('error');
        return;
      }
      setStatus('success');
      toast("You're on the list — we'll message you when prices change.", 'success');
    } catch {
      setStatus('error');
      toast('Network error — check your connection and try again.', 'error');
    }
  }

  const box = dark
    ? 'bg-slate-900 border-slate-800 text-white'
    : 'bg-white border-[#E2E8F0] text-[#0A0F1E]';
  const muted = dark ? 'text-slate-300' : 'text-[#64748B]';

  return (
    <section className={`rounded-2xl border p-5 ${box}`} aria-labelledby={`pw-${uid}`}>
      <div className="flex items-center gap-2 mb-1">
        <BellRing className="w-4 h-4 text-amber-500 flex-shrink-0" aria-hidden="true" />
        <h3 id={`pw-${uid}`} className="font-heading font-bold text-base">
          Not buying yet?
        </h3>
      </div>

      {status === 'success' ? (
        <p className={`flex items-start gap-2 text-sm mt-2 ${muted}`}>
          <CheckCircle2 className="w-4 h-4 text-[#059669] flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Done. When we next re-check {topic}, someone from our team will message you on WhatsApp with what
            changed.
          </span>
        </p>
      ) : (
        <>
          <p className={`text-sm mb-3 ${muted}`}>
            We re-check {topic} by hand. Leave your WhatsApp number and we&apos;ll message you when they change
            &mdash; a person, not an automated alert. Tell us to stop any time.
          </p>
          <form onSubmit={handleSubmit} noValidate className="flex flex-col sm:flex-row gap-2">
            {/* Honeypot — hidden from humans, bait for scripts. */}
            <input
              type="text"
              name="hp"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />
            <label htmlFor={`pw-wa-${uid}`} className="sr-only">
              WhatsApp number
            </label>
            <input
              id={`pw-wa-${uid}`}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={whatsapp}
              onChange={(e) => {
                setWhatsapp(e.target.value);
                if (errors.whatsapp) setErrors({});
                if (status === 'error') setStatus('idle');
              }}
              placeholder="WhatsApp, e.g. 0803 000 0000"
              aria-invalid={!!errors.whatsapp}
              aria-describedby={errors.whatsapp ? `pw-err-${uid}` : undefined}
              className={`flex-1 min-w-0 bg-white border rounded-lg px-4 py-2.5 text-sm text-[#0A0F1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#F59E0B] transition-colors ${
                errors.whatsapp ? 'border-rose-400' : 'border-[#E2E8F0]'
              }`}
            />
            <button
              type="submit"
              disabled={status === 'submitting'}
              className={`rounded-lg px-4 py-2.5 font-heading font-bold text-sm transition-colors min-h-[44px] ${
                status === 'submitting'
                  ? 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                  : 'bg-[#F59E0B] text-[#0A0F1E] hover:bg-[#D97706]'
              }`}
            >
              {status === 'submitting' ? 'Saving...' : 'Message me'}
            </button>
          </form>
          {errors.whatsapp && (
            <p id={`pw-err-${uid}`} className="text-rose-500 text-xs mt-1">
              {errors.whatsapp}
            </p>
          )}
          {status === 'error' && !errors.whatsapp && (
            <p className="flex items-start gap-2 text-xs mt-2 text-rose-500">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                We couldn&apos;t save that just now &mdash; that&apos;s on us. Try again, or{' '}
                <a
                  href={whatsappLink(`Hi SolarBuilders, please message me when ${topic} change.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold"
                >
                  message us on WhatsApp
                </a>
                .
              </span>
            </p>
          )}
        </>
      )}
    </section>
  );
}
