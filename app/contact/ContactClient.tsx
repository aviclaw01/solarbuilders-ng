'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

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
