'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, AlertTriangle } from 'lucide-react';
import { isEmail, isPhone, type FieldErrors } from '@/lib/validation';
import { useToast } from '@/components/ui/Toast';

const FAQ_ITEMS = [
  {
    q: 'Who actually installs my system?',
    a: 'An installer we have vetted: CAC registration, three past installations with photos, two customer references we call, and a written workmanship warranty. We manage them until commissioning — see How We Vet.',
  },
  {
    q: 'Is it free to use?',
    a: 'Completely free for homeowners and businesses. Always will be.',
  },
  {
    q: 'How does the calculator work?',
    a: 'You pick the appliances you want to power and how many hours a day you use them. It sizes the inverter, lithium battery and panels, then prices every item from live Nigerian listings and gives you a quote code you can download and send to us.',
  },
  {
    q: 'Can I get solar for my business?',
    a: 'Yes. Run the calculator with your office or shop load (10kVA and up is common) and send us the quote code — we source 3-phase Deye, Solis or Victron systems and installers who do commercial work.',
  },
  {
    q: 'I am an installer or vendor. Can I work with you?',
    a: null, // link to /for-builders
  },
  {
    q: 'What happens after I send my quote code on WhatsApp?',
    a: 'We confirm current prices with the vendor, adjust for your roof, location and anything you already own, and give you a final number including workmanship. You pay the vendor and installer directly; our sourcing fee is agreed in writing first.',
  },
];

export default function ContactClient() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [hp, setHp] = useState('');
  const { toast } = useToast();

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
    if (status === 'submitting') return;

    // Per-field validation — the same rules the server enforces (lib/validation).
    const next: FieldErrors = {};
    const n = name.trim();
    const em = email.trim();
    const msg = message.trim();
    const ph = phone.trim();
    if (n.length < 2) next.name = n ? 'Name must be at least 2 characters.' : 'Name is required.';
    if (!em) next.email = 'Email is required.';
    else if (!isEmail(em)) next.email = "That email doesn't look right — check for typos.";
    if (ph && !isPhone(ph)) next.phone = 'That number looks short — e.g. 0803 000 0000.';
    if (msg.length < 10) next.message = msg ? 'Please write at least 10 characters so we can help.' : 'Message is required.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setStatus('submitting');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: n,
          email: em,
          phone: ph || undefined,
          message: msg,
          hp,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        if (data?.fields) setErrors(data.fields as FieldErrors);
        setStatus('error');
        return;
      }
      setStatus('success');
      toast("Message sent — we'll get back to you shortly.", 'success');
    } catch {
      setStatus('error');
      toast('Network error — check your connection and try again.', 'error');
    }
  }

  return (
    <>
      {/* FAQ */}
      <div className="space-y-3 mb-12">
        <h2 className="font-heading font-bold text-[#0A0F1E] text-2xl mb-4">Frequently Asked Questions</h2>
        {FAQ_ITEMS.map((item, i) => (
          <div key={i} className="rounded-xl border border-[#E2E8F0] overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
              <span className="font-heading font-semibold text-[#0A0F1E] text-sm pr-4">{item.q}</span>
              <ChevronDown className={`w-4 h-4 text-[#94A3B8] flex-shrink-0 transition-transform ${openIndex === i ? 'rotate-180' : ''}`} />
            </button>
            {openIndex === i && (
              <div className="px-5 pb-4">
                {item.a ? (
                  <p className="text-[#64748B] text-sm leading-relaxed">{item.a}</p>
                ) : (
                  <p className="text-sm">
                    <Link href="/for-builders" className="text-[#B45309] font-semibold hover:underline">
                      See how we work with installers and vendors →
                    </Link>
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact Form */}
      <div className="rounded-2xl border border-[#E2E8F0] p-6">
        <h2 className="font-heading font-bold text-[#0A0F1E] text-2xl mb-4">Send us a message</h2>

        {status === 'success' ? (
          <div className="text-center py-6">
            <p className="text-[#059669] font-heading font-semibold text-lg mb-1">Message sent!</p>
            <p className="text-[#64748B] text-sm">We&apos;ll get back to you shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
              <label htmlFor="contact-name" className="block text-sm font-medium text-[#0A0F1E] mb-1">Name *</label>
              <input
                id="contact-name"
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); clearError('name'); }}
                placeholder="Your name"
                aria-invalid={!!errors.name}
                className={`w-full bg-white border rounded-lg px-4 py-3 text-[#0A0F1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#F59E0B] transition-colors ${errors.name ? 'border-rose-400' : 'border-[#E2E8F0]'}`}
              />
              {errors.name && <p className="text-rose-600 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium text-[#0A0F1E] mb-1">Email *</label>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); clearError('email'); }}
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                className={`w-full bg-white border rounded-lg px-4 py-3 text-[#0A0F1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#F59E0B] transition-colors ${errors.email ? 'border-rose-400' : 'border-[#E2E8F0]'}`}
              />
              {errors.email && <p className="text-rose-600 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="contact-phone" className="block text-sm font-medium text-[#0A0F1E] mb-1">Phone (optional)</label>
              <input
                id="contact-phone"
                type="tel"
                value={phone}
                onChange={e => { setPhone(e.target.value); clearError('phone'); }}
                placeholder="+234 803 000 0000"
                aria-invalid={!!errors.phone}
                className={`w-full bg-white border rounded-lg px-4 py-3 text-[#0A0F1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#F59E0B] transition-colors ${errors.phone ? 'border-rose-400' : 'border-[#E2E8F0]'}`}
              />
              {errors.phone && <p className="text-rose-600 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label htmlFor="contact-message" className="block text-sm font-medium text-[#0A0F1E] mb-1">Message *</label>
              <textarea
                id="contact-message"
                value={message}
                onChange={e => { setMessage(e.target.value); clearError('message'); }}
                placeholder="How can we help?"
                rows={4}
                aria-invalid={!!errors.message}
                className={`w-full bg-white border rounded-lg px-4 py-3 text-[#0A0F1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#F59E0B] transition-colors resize-none ${errors.message ? 'border-rose-400' : 'border-[#E2E8F0]'}`}
              />
              {errors.message && <p className="text-rose-600 text-xs mt-1">{errors.message}</p>}
            </div>

            {status === 'error' && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-rose-700 text-sm">
                  We couldn&apos;t send your message just now — that&apos;s on us, not you. Try again, or
                  reach us on WhatsApp and we&apos;ll pick it up from there.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className={`w-full py-3 rounded-lg font-heading font-bold text-base transition-colors ${
                status !== 'submitting'
                  ? 'bg-[#F59E0B] text-[#0A0F1E] hover:bg-[#D97706]'
                  : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
              }`}
            >
              {status === 'submitting' ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
