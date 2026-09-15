'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { HEADLINE_PACKAGES, PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { whatsappLink } from '@/lib/site';
import { CheckCircle, ArrowRight, ArrowLeft, Wrench, Store, Factory, MessageCircle, ShieldCheck, Zap } from 'lucide-react';

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara',
];

const BUSINESS_TYPES = [
  { id: 'installer', label: 'Installer' },
  { id: 'vendor', label: 'Vendor / distributor' },
  { id: 'manufacturer', label: 'Manufacturer / distributor' },
  { id: 'both', label: 'Both installer and vendor' },
] as const;
type BusinessType = (typeof BUSINESS_TYPES)[number]['id'] | '';

const SERVICE_TYPES = [
  { id: 'full_install', label: 'Full installation', hint: 'Design, mounting, wiring, commissioning' },
  { id: 'repair', label: 'Repair & maintenance', hint: 'Faults, upgrades, battery swaps' },
  { id: 'parts', label: 'Equipment supply', hint: 'Inverters, batteries, panels, BOS' },
  { id: 'prebuilt', label: 'Pre-built packages', hint: 'Bundled kits with published prices' },
];

const SYSTEM_SIZES = ['1–2kVA', '3–5kVA', '5–10kVA', '10kVA+'];

const INSTALLER_CHECKS = [
  'CAC registration (business name or company)',
  'Three past installations, with photos',
  'Two customer references we can call',
  'A written workmanship warranty',
];

const VENDOR_CHECKS = [
  'A public price list or catalogue we can link to',
  'CAC registration',
  'A phone number that gets answered',
  'A heads-up when your prices move',
];

const SUPPLIER_CHECKS = [
  'A trade or distributor price list, per SKU',
  'Warranty and RMA terms in writing',
  'Lead time from order to delivery in Lagos or Abuja',
  'Who handles a failed unit, and how long a swap takes',
  'Minimum order quantity, if you have one',
];

const JOB_FLOW = [
  {
    step: '01',
    title: 'Customer builds a quote',
    text: 'They size their system on our calculator and get an itemised bill of materials with a quote code. They send it to us by email or WhatsApp.',
  },
  {
    step: '02',
    title: 'We confirm prices and survey the site',
    text: 'We call the vendor to confirm current prices, then arrange a site survey. The installer joins the survey.',
  },
  {
    step: '03',
    title: 'Equipment delivered, installer installs',
    text: 'We buy from the vendor and get it delivered. The installer does the job and sends photos from site on WhatsApp as they go.',
  },
  {
    step: '04',
    title: 'Commissioning and paperwork',
    text: 'Commissioning checklist, warranty paperwork, handover. Then the next job.',
  },
];

const FAQ = [
  {
    q: 'Does it cost anything?',
    a: 'No. There is no listing fee and no application fee. There is no badge to buy and no featured spot to pay for. If someone asks you for money in our name, it is not us.',
  },
  {
    q: 'How do I get paid as an installer?',
    a: 'Labour and commissioning are agreed per job, in writing, before you start. Equipment is bought from the vendor, not through you, so your quote is for the work only.',
  },
  {
    q: 'Which cities do you cover?',
    a: 'Most quotes come from Lagos, Abuja, Port Harcourt, Kano and Enugu, but a quote can come from anywhere in Nigeria. Tell us where you actually work and we match jobs to that.',
  },
  {
    q: 'What if my prices change?',
    a: 'Tell us on WhatsApp. Every price on the site carries the date we saw it, and we confirm by phone before a customer pays, so a stale listing hurts nobody. It does get pulled, though.',
  },
  {
    q: 'Can I be both an installer and a vendor?',
    a: 'Yes. Plenty of Nigerian solar businesses are. Pick "Both installer and vendor" on the form.',
  },
  {
    q: 'I manufacture or import equipment. Can I supply you?',
    a: 'That is a new programme and we are opening it now, so be aware you would be among the first. What we need to start: a trade price list, your warranty and RMA terms in writing, lead time to Lagos or Abuja, and who handles a failed unit. We do not hold stock, so we order per job and you fulfil.',
  },
  {
    q: 'What happens after I apply?',
    a: 'We reply by email or WhatsApp. Installers: have your CAC number, three install photos and two reference numbers ready. Vendors: send your current price list or catalogue link. Manufacturers and distributors: send the trade price list, warranty and RMA terms, and your lead times.',
  },
];

interface FormData {
  businessType: BusinessType;
  businessName: string;
  contactEmail: string;
  whatsapp: string;
  city: string;
  state: string;
  yearsInBusiness: string;
  services: string[];
  systemSizes: string[];
  startingPrice: string;
  bio: string;
  instagram: string;
}

const INPUT =
  'w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-400 transition-colors min-h-[44px]';
const LABEL = 'block text-sm font-medium text-slate-900 mb-2';

function fmtMillions(n: number) {
  return `₦${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
}

export default function WorkWithUsClient() {
  const [activeSection, setActiveSection] = useState<'landing' | 'signup'>('landing');
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [formData, setFormData] = useState<FormData>({
    businessType: '',
    businessName: '',
    contactEmail: '',
    whatsapp: '',
    city: '',
    state: '',
    yearsInBusiness: '',
    services: [],
    systemSizes: [],
    startingPrice: '',
    bio: '',
    instagram: '',
  });

  const updateForm = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleService = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(id) ? prev.services.filter((s) => s !== id) : [...prev.services, id],
    }));
  };

  const toggleSize = (size: string) => {
    setFormData((prev) => ({
      ...prev,
      systemSizes: prev.systemSizes.includes(size) ? prev.systemSizes.filter((s) => s !== size) : [...prev.systemSizes, size],
    }));
  };

  const step1Valid =
    formData.businessType && formData.businessName && formData.contactEmail && formData.whatsapp && formData.city && formData.state && formData.yearsInBusiness;
  const step2Valid = formData.services.length > 0 && formData.systemSizes.length > 0;

  const typeLabel = BUSINESS_TYPES.find((t) => t.id === formData.businessType)?.label ?? 'installer, vendor or supplier';

  const submit = async () => {
    if (!step2Valid || status === 'sending') return;
    setStatus('sending');
    try {
      const res = await fetch('/api/builder-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('send failed');
      setSubmitted(true);
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  };

  if (submitted) {
    const isInstaller = formData.businessType === 'installer' || formData.businessType === 'both';
    const isVendor = formData.businessType === 'vendor' || formData.businessType === 'both';
    const isSupplier = formData.businessType === 'manufacturer';
    const readyList = [
      ...(isInstaller ? ['Your CAC number', 'Photos of three past installations', 'Phone numbers for two past customers', 'Your workmanship warranty terms'] : []),
      ...(isVendor ? ['Your current price list or catalogue link', 'The phone number we should call to confirm a price'] : []),
      ...(isSupplier ? ['Your trade / distributor price list, per SKU', 'Warranty and RMA terms in writing', 'Lead time from order to delivery in Lagos or Abuja', 'Minimum order quantity, if you have one'] : []),
    ];
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="max-w-lg mx-auto px-6 py-16 text-center">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-7 h-7 text-amber-600" />
          </div>
          <h1 className="font-heading text-3xl font-extrabold text-slate-900 mb-4">Application received.</h1>
          <p className="text-slate-500 text-lg mb-8 leading-relaxed">
            We reply by email or WhatsApp. To move quickly, have these ready:
          </p>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 text-left">
            <div className="space-y-3">
              {readyList.map((item) => (
                <div key={item} className="flex items-start gap-2 text-slate-700 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <a
            href={whatsappLink(`Hi SolarBuilders, I just applied to work with you (${typeLabel}). Business: ${formData.businessName}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-heading w-full bg-[#25D366] text-white py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#22c55e] transition-colors min-h-[56px]"
          >
            <MessageCircle className="w-5 h-5" /> Message us on WhatsApp
          </a>
          <Link href="/brands" className="inline-flex items-center gap-1 text-slate-500 text-sm mt-6 hover:text-slate-900 underline-offset-4 hover:underline min-h-[44px]">
            See the brands and vendors we already list <ArrowRight className="w-4 h-4" />
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (activeSection === 'signup') {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="max-w-xl mx-auto px-6 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="font-heading font-semibold text-slate-900">
                Step {step} of 2: {step === 1 ? 'Your business' : 'What you do'}
              </span>
              <span className="text-slate-500 text-sm">{Math.round((step / 2) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full transition-all duration-300" style={{ width: `${(step / 2) * 100}%` }} />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-slate-800 text-sm">
              {step === 1 && 'Tell us who you are. This takes about five minutes and there is nothing to pay.'}
              {step === 2 && 'What do you actually do? Pick everything that applies.'}
            </p>
          </div>

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="businessType" className={LABEL}>I am a *</label>
                <select
                  id="businessType"
                  value={formData.businessType}
                  onChange={(e) => updateForm('businessType', e.target.value as BusinessType)}
                  className={INPUT}
                >
                  <option value="">Select one</option>
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="businessName" className={LABEL}>Business name *</label>
                <input
                  id="businessName"
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => updateForm('businessName', e.target.value)}
                  placeholder="As registered with CAC"
                  className={INPUT}
                />
              </div>

              <div>
                <label htmlFor="contactEmail" className={LABEL}>Contact email *</label>
                <input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => updateForm('contactEmail', e.target.value)}
                  placeholder="info@yourcompany.ng"
                  className={INPUT}
                />
              </div>

              <div>
                <label htmlFor="whatsapp" className={LABEL}>WhatsApp number *</label>
                <input
                  id="whatsapp"
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => updateForm('whatsapp', e.target.value)}
                  placeholder="+234 803 000 0000"
                  className={INPUT}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="city" className={LABEL}>City *</label>
                  <input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateForm('city', e.target.value)}
                    placeholder="Ikeja"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label htmlFor="state" className={LABEL}>State *</label>
                  <select
                    id="state"
                    value={formData.state}
                    onChange={(e) => updateForm('state', e.target.value)}
                    className={INPUT}
                  >
                    <option value="">Select state</option>
                    {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <span className={LABEL}>Years in business *</span>
                <div className="space-y-2">
                  {['Less than 1 year', '1–3 years', '3–5 years', '5+ years'].map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                      <input
                        type="radio"
                        name="years"
                        value={opt}
                        checked={formData.yearsInBusiness === opt}
                        onChange={(e) => updateForm('yearsInBusiness', e.target.value)}
                        className="accent-amber-500 w-4 h-4"
                      />
                      <span className="text-slate-900">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <span className={`${LABEL} mb-3`}>What do you offer? *</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SERVICE_TYPES.map((service) => {
                    const on = formData.services.includes(service.id);
                    return (
                      <button
                        key={service.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleService(service.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all min-h-[44px] ${
                          on ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white hover:border-amber-300'
                        }`}
                      >
                        <p className="font-heading font-semibold text-slate-900 text-sm">{service.label}</p>
                        <p className="text-slate-500 text-xs mt-1">{service.hint}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className={`${LABEL} mb-3`}>System sizes you handle *</span>
                <div className="flex flex-wrap gap-2">
                  {SYSTEM_SIZES.map((size) => {
                    const on = formData.systemSizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleSize(size)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors min-h-[44px] ${
                          on ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-900'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="startingPrice" className={`${LABEL} mb-1`}>
                  Your typical price for a 5kVA / 10kWh job (optional)
                </label>
                <p className="text-slate-500 text-xs mb-2">
                  Installers: labour and commissioning. Vendors: the package price. Manufacturers and distributors: your trade price. Helps us match you to the right jobs; we do not publish it.
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">₦</span>
                  <input
                    id="startingPrice"
                    type="number"
                    inputMode="numeric"
                    value={formData.startingPrice}
                    onChange={(e) => updateForm('startingPrice', e.target.value)}
                    placeholder="Amount in naira"
                    className={`${INPUT} pl-8`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="instagram" className={`${LABEL} mb-1`}>Website or Instagram (optional)</label>
                <input
                  id="instagram"
                  type="text"
                  value={formData.instagram}
                  onChange={(e) => updateForm('instagram', e.target.value)}
                  placeholder="yourcompany.ng or @yourcompany"
                  className={INPUT}
                />
              </div>

              <div>
                <label htmlFor="bio" className={`${LABEL} mb-1`}>Brief description (optional)</label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => updateForm('bio', e.target.value)}
                  placeholder="Where you work, brands you know well, anything we should know."
                  rows={3}
                  maxLength={150}
                  className={`${INPUT} resize-none`}
                />
                <p className="text-slate-400 text-xs text-right">{formData.bio.length}/150</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              We could not send that. Try again, or{' '}
              <a
                href={whatsappLink(`Hi SolarBuilders, I want to work with you as a ${typeLabel}. Business: ${formData.businessName}, ${formData.city}, ${formData.state}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline underline-offset-4"
              >
                message us on WhatsApp
              </a>{' '}
              with your details.
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-semibold py-4 px-4 transition-colors min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveSection('landing')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-semibold py-4 px-4 transition-colors min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}

            {step < 2 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!step1Valid}
                className={`flex-1 py-4 rounded-full font-heading font-bold text-lg flex items-center justify-center gap-2 transition-colors min-h-[56px] ${
                  step1Valid ? 'bg-amber-400 text-slate-900 hover:bg-amber-500' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Continue <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={!step2Valid || status === 'sending'}
                className={`flex-1 py-4 rounded-full font-heading font-bold text-lg flex items-center justify-center gap-2 transition-colors min-h-[56px] ${
                  step2Valid && status !== 'sending' ? 'bg-amber-400 text-slate-900 hover:bg-amber-500' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {status === 'sending' ? 'Sending…' : 'Send application →'}
              </button>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="bg-white border-b border-slate-100 px-6 py-14 md:py-20">
          <div className="max-w-6xl mx-auto">
            <span className="text-amber-500 text-sm font-semibold tracking-wide uppercase">Work with us</span>
            <h1 className="font-heading font-extrabold text-slate-900 text-4xl md:text-5xl mt-3 mb-4 max-w-3xl">
              Installers, vendors, manufacturers: we bring the demand.
            </h1>
            <p className="text-slate-500 text-lg max-w-2xl">
              SolarBuilders.ng turns a customer&apos;s load into an itemised, priced bill of materials with a quote code.
              By the time they say go, they know the kVA, the kWh, the panel count and the budget. We confirm today&apos;s
              price, buy the equipment ourselves and put a vetted installer on the job. No listing fees, no badges to buy.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <button
                type="button"
                onClick={() => setActiveSection('signup')}
                className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-full px-6 py-3 font-semibold text-sm transition-colors min-h-[44px]"
              >
                <Zap className="w-4 h-4" fill="currentColor" /> Apply to work with us
              </button>
              <Link
                href="/verified"
                className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-400 text-slate-700 rounded-full px-6 py-3 font-semibold text-sm transition-colors min-h-[44px]"
              >
                <ShieldCheck className="w-4 h-4" /> How we vet
              </Link>
            </div>
          </div>
        </section>

        {/* Three audiences */}
        <section className="px-6 py-14">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 flex flex-col">
              <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
                <Wrench className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-amber-500 text-xs font-semibold tracking-wide uppercase">For installers</span>
              <h2 className="font-heading font-extrabold text-slate-900 text-2xl mt-2 mb-4">
                Jobs that arrive with a BOM, a budget and the equipment.
              </h2>
              <ul className="space-y-3 mb-6">
                {[
                  'The customer comes to you already sized and priced. Inverter, battery, panels and BOS are agreed before you see the site.',
                  'We source and deliver the equipment from vendors on our brands page. You quote labour and commissioning only.',
                  'Labour is agreed per job, in writing, before you start.',
                  'We stay on the job with you: site survey, photos via WhatsApp, commissioning checklist, warranty paperwork.',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-slate-600 text-sm leading-relaxed">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-slate-50 rounded-xl p-4 mt-auto">
                <p className="font-heading font-semibold text-slate-900 text-sm mb-2">What we check before your first job</p>
                <ul className="space-y-1.5">
                  {INSTALLER_CHECKS.map((c) => (
                    <li key={c} className="text-slate-600 text-sm flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/verified" className="inline-flex items-center gap-1 text-amber-600 text-sm font-semibold mt-3 hover:underline underline-offset-4 min-h-[44px]">
                  Full vetting checklist <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 flex flex-col">
              <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
                <Store className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-amber-500 text-xs font-semibold tracking-wide uppercase">For vendors and distributors</span>
              <h2 className="font-heading font-extrabold text-slate-900 text-2xl mt-2 mb-4">
                Your catalogue and prices in front of buyers who already have a BOM.
              </h2>
              <ul className="space-y-3 mb-6">
                {[
                  'Free listing on our brands page: your models, your prices, with the date we saw them.',
                  'We no longer publish vendor phone numbers or shop links. Buyers come through us, so the enquiry you get is a real order, not a price-check call.',
                  'We buy from listed vendors for customer builds, and we confirm the price with you before the customer pays.',
                  'No fee and no ranking to pay for. Stale prices get pulled, so tell us when they move.',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-slate-600 text-sm leading-relaxed">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-slate-50 rounded-xl p-4 mt-auto">
                <p className="font-heading font-semibold text-slate-900 text-sm mb-2">What we ask for</p>
                <ul className="space-y-1.5">
                  {VENDOR_CHECKS.map((c) => (
                    <li key={c} className="text-slate-600 text-sm flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/brands" className="inline-flex items-center gap-1 text-amber-600 text-sm font-semibold mt-3 hover:underline underline-offset-4 min-h-[44px]">
                  See who is already listed <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 flex flex-col">
              <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
                <Factory className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-amber-500 text-xs font-semibold tracking-wide uppercase">For manufacturers and distributors</span>
              <h2 className="font-heading font-extrabold text-slate-900 text-2xl mt-2 mb-4">
                Give us trade pricing. We put your product in front of buyers who already know what they need.
              </h2>
              <ul className="space-y-3 mb-6">
                {[
                  'Our traffic comes from people searching what solar costs in Nigeria. They arrive specified: inverter kVA, battery kWh, panel count, and a budget they have already accepted.',
                  'We quote your product into those builds by name, and when the customer says go we place the order ourselves. One buyer to deal with instead of fifty.',
                  'We want trade or distributor pricing. You fulfil. We do not hold stock, we do not run a warehouse, and we buy per job.',
                  'Straight with you: this is a new programme. We are talking to our first suppliers now, so there is no roster to show you yet.',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-slate-600 text-sm leading-relaxed">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-slate-50 rounded-xl p-4 mt-auto">
                <p className="font-heading font-semibold text-slate-900 text-sm mb-2">What we need from you</p>
                <ul className="space-y-1.5">
                  {SUPPLIER_CHECKS.map((c) => (
                    <li key={c} className="text-slate-600 text-sm flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/brands" className="inline-flex items-center gap-1 text-amber-600 text-sm font-semibold mt-3 hover:underline underline-offset-4 min-h-[44px]">
                  See the equipment we already price <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Job sizes */}
        <section className="px-6 py-14 bg-slate-50 border-y border-slate-100">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-heading font-extrabold text-slate-900 text-2xl md:text-3xl mb-2">The size of job that comes through</h2>
            <p className="text-slate-500 mb-6 max-w-2xl">
              Installed ranges from our calculator, {PRICES_LAST_UPDATED_LABEL} prices. Equipment plus labour, before site-specific extras.
            </p>
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
              {HEADLINE_PACKAGES.map((p) => (
                <div key={p.label} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-5 py-4">
                  <div>
                    <p className="font-heading font-semibold text-slate-900">{p.label}</p>
                    <p className="text-slate-500 text-sm">{p.powers}</p>
                  </div>
                  <p className="font-heading font-bold text-slate-900 whitespace-nowrap">
                    {fmtMillions(p.low)} – {fmtMillions(p.high)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How a job flows */}
        <section className="px-6 py-14">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-heading font-extrabold text-slate-900 text-2xl md:text-3xl mb-8">How a job flows</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {JOB_FLOW.map(({ step: n, title, text }) => (
                <div key={n} className="bg-white rounded-2xl border border-slate-200 p-6">
                  <span className="font-heading font-black text-slate-200 text-3xl leading-none">{n}</span>
                  <h3 className="font-heading font-bold text-slate-900 text-lg mt-3 mb-2">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Straight talk */}
        <section className="px-6 pb-14">
          <div className="max-w-6xl mx-auto bg-slate-900 rounded-3xl p-8 md:p-12">
            <h2 className="font-heading font-extrabold text-white text-2xl md:text-3xl mb-6">Straight talk</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { t: 'Nothing to buy here', d: 'No listing fee, no verified badge, no featured spot. Anyone selling you one in our name is not us.' },
                { t: 'We do not hold stock', d: 'We buy per job from distributors we hold trade terms with, at a price we confirm before the customer pays. Nothing sits in a warehouse.' },
                { t: 'We do not send unchecked installers', d: 'CAC, three past installs, two references, a written warranty. Every time.' },
              ].map(({ t, d }) => (
                <div key={t}>
                  <h3 className="font-heading font-bold text-amber-400 text-lg mb-2">{t}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-6 pb-14">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading font-extrabold text-slate-900 text-2xl md:text-3xl mb-8">Common questions</h2>
            <div className="space-y-4">
              {FAQ.map((item) => (
                <div key={item.q} className="bg-white rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-heading font-bold text-slate-900 mb-2">{item.q}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="px-6 pb-20">
          <div className="max-w-6xl mx-auto bg-amber-400 rounded-3xl p-8 md:p-12 text-center">
            <h2 className="font-heading font-extrabold text-slate-900 text-2xl md:text-3xl mb-3">Ready to work with us?</h2>
            <p className="text-slate-800 max-w-xl mx-auto mb-6">Five-minute form. We reply by email or WhatsApp.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => setActiveSection('signup')}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full px-8 py-4 font-heading font-bold transition-colors min-h-[56px]"
              >
                Apply to work with us <ArrowRight className="w-5 h-5" />
              </button>
              <a
                href={whatsappLink('Hi SolarBuilders, I am an installer / vendor / manufacturer and want to work with you on customer builds.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 rounded-full px-8 py-4 font-heading font-bold transition-colors min-h-[56px]"
              >
                <MessageCircle className="w-5 h-5" /> WhatsApp us
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
