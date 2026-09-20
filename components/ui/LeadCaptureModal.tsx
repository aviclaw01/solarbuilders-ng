'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { NIGERIAN_STATES, isPhone, type FieldErrors } from '@/lib/validation';

const SYSTEM_SIZES = [
  'Not sure yet',
  '1–2kVA (small home)',
  '3–5kVA (medium home)',
  '5–10kVA (large home/office)',
  '10kVA+ (commercial)',
];

const LS_KEY = 'solar_lead_dismissed';
const EXPIRY_DAYS = 7;

function isDismissed(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem(LS_KEY);
  if (!val) return false;
  const ts = parseInt(val, 10);
  if (isNaN(ts)) return false;
  return Date.now() - ts < EXPIRY_DAYS * 24 * 60 * 60 * 1000;
}

function setDismissed() {
  localStorage.setItem(LS_KEY, Date.now().toString());
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

/** Per-field rules — the client twin of the server's validateFields rules. */
function fieldErrors(whatsapp: string, state: string, systemSize: string): FieldErrors {
  const errors: FieldErrors = {};
  const wa = whatsapp.trim();
  if (!wa) errors.whatsapp = 'WhatsApp number is required.';
  else if (!isPhone(wa)) errors.whatsapp = 'That number looks short — e.g. 0803 000 0000.';
  if (!state) errors.state = 'Pick your state.';
  if (!systemSize) errors.systemSize = 'Pick a system size.';
  return errors;
}

export default function LeadCaptureModal() {
  const [show, setShow] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');
  const [state, setState] = useState('');
  const [systemSize, setSystemSize] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [hp, setHp] = useState('');

  useEffect(() => {
    if (isDismissed()) return;
    const timer = setTimeout(() => setShow(true), 45000);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setDismissed();
    setShow(false);
  }

  function clearError(field: string) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = fieldErrors(whatsapp, state, systemSize);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || status === 'submitting') return;

    setStatus('submitting');
    try {
      const res = await fetch('/api/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp: whatsapp.trim(), state, systemSize, hp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        if (data?.fields) setErrors(data.fields as FieldErrors);
        setStatus('error');
        return;
      }
    } catch {
      setStatus('error');
      return;
    }
    setStatus('success');
    setTimeout(() => {
      setDismissed();
      setShow(false);
    }, 4000);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={dismiss} />
      <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-xl" role="dialog" aria-modal="true" aria-label="Get sizing help">
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-[#64748B] hover:text-[#0A0F1E] transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {status === 'success' ? (
          <div className="text-center py-4">
            <p className="text-[#059669] font-heading font-bold text-xl mb-2">Got it!</p>
            <p className="text-[#64748B]">Check WhatsApp — we&apos;ll send you options shortly.</p>
          </div>
        ) : status === 'error' ? (
          <div className="text-center py-4">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" aria-hidden="true" />
            <p className="font-heading font-bold text-[#0A0F1E] text-xl mb-2">That didn&apos;t send</p>
            <p className="text-[#64748B] text-sm mb-5">
              We couldn&apos;t reach the server just now — that&apos;s on us, not you. Your details are still here.
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="w-full py-3 rounded-lg font-heading font-bold text-base bg-[#F59E0B] text-[#0A0F1E] hover:bg-[#D97706] transition-colors"
            >
              Try again
            </button>
            <a
              href="https://wa.me/2349168394923"
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-3 text-[#64748B] text-sm hover:text-[#0A0F1E] transition-colors"
            >
              Or message us on WhatsApp instead
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <h2 className="font-heading font-extrabold text-[#0A0F1E] text-2xl mb-1">
                Want us to size it for you?
              </h2>
              <p className="text-[#64748B] text-sm">
                Tell us your location and roughly what you need — we&apos;ll reply on WhatsApp with real prices.
              </p>
            </div>

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

            <div>
              <label htmlFor="lead-whatsapp" className="block text-sm font-medium text-[#0A0F1E] mb-1">WhatsApp number</label>
              <input
                id="lead-whatsapp"
                type="tel"
                value={whatsapp}
                onChange={e => { setWhatsapp(e.target.value); clearError('whatsapp'); }}
                placeholder="+234 803 000 0000"
                aria-invalid={!!errors.whatsapp}
                className={`w-full bg-white border rounded-lg px-4 py-3 text-[#0A0F1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#F59E0B] transition-colors ${errors.whatsapp ? 'border-rose-400' : 'border-[#E2E8F0]'}`}
              />
              {errors.whatsapp && <p className="text-rose-600 text-xs mt-1">{errors.whatsapp}</p>}
            </div>

            <div>
              <label htmlFor="lead-state" className="block text-sm font-medium text-[#0A0F1E] mb-1">State</label>
              <select
                id="lead-state"
                value={state}
                onChange={e => { setState(e.target.value); clearError('state'); }}
                aria-invalid={!!errors.state}
                className={`w-full bg-white border rounded-lg px-4 py-3 text-[#0A0F1E] focus:outline-none focus:border-[#F59E0B] transition-colors ${errors.state ? 'border-rose-400' : 'border-[#E2E8F0]'}`}
              >
                <option value="">Select your state</option>
                {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.state && <p className="text-rose-600 text-xs mt-1">{errors.state}</p>}
            </div>

            <div>
              <label htmlFor="lead-size" className="block text-sm font-medium text-[#0A0F1E] mb-1">System size needed</label>
              <select
                id="lead-size"
                value={systemSize}
                onChange={e => { setSystemSize(e.target.value); clearError('systemSize'); }}
                aria-invalid={!!errors.systemSize}
                className={`w-full bg-white border rounded-lg px-4 py-3 text-[#0A0F1E] focus:outline-none focus:border-[#F59E0B] transition-colors ${errors.systemSize ? 'border-rose-400' : 'border-[#E2E8F0]'}`}
              >
                <option value="">Select size</option>
                {SYSTEM_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.systemSize && <p className="text-rose-600 text-xs mt-1">{errors.systemSize}</p>}
            </div>

            <button
              type="submit"
              disabled={status === 'submitting'}
              className={`w-full py-3 rounded-lg font-heading font-bold text-base transition-colors ${
                status !== 'submitting'
                  ? 'bg-[#F59E0B] text-[#0A0F1E] hover:bg-[#D97706]'
                  : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
              }`}
            >
              {status === 'submitting' ? 'Sending...' : 'Get My Recommendations'}
            </button>

            <button
              type="button"
              onClick={dismiss}
              className="w-full text-[#64748B] text-sm hover:text-[#64748B] transition-colors"
            >
              No thanks, I&apos;ll browse myself
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
