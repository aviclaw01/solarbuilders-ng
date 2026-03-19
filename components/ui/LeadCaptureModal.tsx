'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara',
];

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

export default function LeadCaptureModal() {
  const [show, setShow] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');
  const [state, setState] = useState('');
  const [systemSize, setSystemSize] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  useEffect(() => {
    if (isDismissed()) return;
    const timer = setTimeout(() => setShow(true), 45000);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setDismissed();
    setShow(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!whatsapp.trim() || !state || !systemSize) return;
    setStatus('submitting');
    try {
      await fetch('/api/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp: whatsapp.trim(), state, systemSize }),
      });
    } catch {
      // still show success — lead was attempted
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
      <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0A0F1E] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {status === 'success' ? (
          <div className="text-center py-4">
            <p className="text-[#059669] font-heading font-bold text-xl mb-2">Got it!</p>
            <p className="text-[#64748B]">Check WhatsApp — we&apos;ll send you options shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h2 className="font-heading font-extrabold text-[#0A0F1E] text-2xl mb-1">
                Get matched with a verified builder
              </h2>
              <p className="text-[#64748B] text-sm">
                Tell us your location and what you need — we&apos;ll point you to the right builders.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0A0F1E] mb-1">WhatsApp number</label>
              <input
                type="tel"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder="+234 803 000 0000"
                className="w-full bg-white border border-[#E2E8F0] rounded-lg px-4 py-3 text-[#0A0F1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#F59E0B] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0A0F1E] mb-1">State</label>
              <select
                value={state}
                onChange={e => setState(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] rounded-lg px-4 py-3 text-[#0A0F1E] focus:outline-none focus:border-[#F59E0B] transition-colors"
              >
                <option value="">Select your state</option>
                {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0A0F1E] mb-1">System size needed</label>
              <select
                value={systemSize}
                onChange={e => setSystemSize(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] rounded-lg px-4 py-3 text-[#0A0F1E] focus:outline-none focus:border-[#F59E0B] transition-colors"
              >
                <option value="">Select size</option>
                {SYSTEM_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <button
              type="submit"
              disabled={!whatsapp.trim() || !state || !systemSize || status === 'submitting'}
              className={`w-full py-3 rounded-lg font-heading font-bold text-base transition-colors ${
                whatsapp.trim() && state && systemSize && status !== 'submitting'
                  ? 'bg-[#F59E0B] text-[#0A0F1E] hover:bg-[#D97706]'
                  : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
              }`}
            >
              {status === 'submitting' ? 'Sending...' : 'Get My Recommendations'}
            </button>

            <button
              type="button"
              onClick={dismiss}
              className="w-full text-[#94A3B8] text-sm hover:text-[#64748B] transition-colors"
            >
              No thanks, I&apos;ll browse myself
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
