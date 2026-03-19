'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: 'How do I know a builder is legitimate?',
    a: 'Every builder on SolarBuilders.ng has been manually reviewed by the Nexprove team. We check their experience, past projects, equipment quality, and customer history before they go live.',
  },
  {
    q: 'Is it free to use?',
    a: 'Completely free for homeowners and businesses. Always will be.',
  },
  {
    q: 'How does the calculator work?',
    a: 'You select the appliances you want to power and how many hours per day you use them. The calculator computes your total load and recommends the right system size and estimated cost range.',
  },
  {
    q: 'Can I get solar for my business?',
    a: 'Yes. Filter by Commercial on the marketplace. We have builders who specialise in office, retail, and industrial systems from 10kVA upwards.',
  },
  {
    q: 'I want to list my company as a builder.',
    a: null, // link to /for-builders
  },
  {
    q: 'What happens after I contact a builder on WhatsApp?',
    a: 'You speak directly — no middleman. Discuss your needs, get a quote, negotiate terms. SolarBuilders.ng takes no commission.',
  },
];

export default function ContactClient() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setStatus('submitting');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          message: message.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
    } catch {
      setStatus('error');
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
                    <Link href="/for-builders" className="text-[#F59E0B] font-semibold hover:underline">
                      Apply to list your business →
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0A0F1E] mb-1">Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-white border border-[#E2E8F0] rounded-lg px-4 py-3 text-[#0A0F1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#F59E0B] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0A0F1E] mb-1">Email *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white border border-[#E2E8F0] rounded-lg px-4 py-3 text-[#0A0F1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#F59E0B] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0A0F1E] mb-1">Phone (optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+234 803 000 0000"
                className="w-full bg-white border border-[#E2E8F0] rounded-lg px-4 py-3 text-[#0A0F1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#F59E0B] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0A0F1E] mb-1">Message *</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="How can we help?"
                rows={4}
                className="w-full bg-white border border-[#E2E8F0] rounded-lg px-4 py-3 text-[#0A0F1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#F59E0B] transition-colors resize-none"
              />
            </div>

            {status === 'error' && (
              <p className="text-red-500 text-sm">Something went wrong, please try again.</p>
            )}

            <button
              type="submit"
              disabled={!name.trim() || !email.trim() || !message.trim() || status === 'submitting'}
              className={`w-full py-3 rounded-lg font-heading font-bold text-base transition-colors ${
                name.trim() && email.trim() && message.trim() && status !== 'submitting'
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
