'use client';

import { useState } from 'react';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { CheckCircle, ArrowRight, ArrowLeft, Zap } from 'lucide-react';

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara'
];

const SERVICE_TYPES = [
  { id: 'full_install', label: 'Full Installation', emoji: '🔧' },
  { id: 'prebuilt', label: 'Pre-built Bundles', emoji: '📦' },
  { id: 'parts', label: 'Parts Supply', emoji: '🔩' },
  { id: 'repair', label: 'Repair & Maintenance', emoji: '🛠️' },
];

const SYSTEM_SIZES = ['1–2kVA', '3–5kVA', '5–10kVA', '10kVA+'];

const PRICING_TIERS = [
  {
    name: 'Free Listing',
    price: 0,
    period: 'forever',
    features: [
      'Profile page on SolarBuilders.ng',
      'WhatsApp CTA on your listing',
      'Appear in marketplace results',
      'Unlimited enquiries',
    ],
    cta: 'Get Started Free',
    highlight: false,
  },
  {
    name: 'Nexprove Verified',
    price: 15000,
    period: 'per year',
    features: [
      'Everything in Free',
      'Nexprove Verified badge',
      'Priority placement in results',
      'Verification call with our team',
      'Increased trust = more conversions',
    ],
    cta: 'Get Verified — ₦15,000/yr',
    highlight: true,
    badge: '🔥 Most Popular',
  },
  {
    name: 'Featured Listing',
    price: 8000,
    period: 'per month',
    features: [
      'Everything in Verified',
      'Featured spot on homepage',
      'Top of marketplace results',
      'Featured in Calculator results',
      'Premium builder spotlight',
    ],
    cta: 'Get Featured — ₦8,000/mo',
    highlight: false,
  },
];

interface FormData {
  businessName: string;
  contactEmail: string;
  password: string;
  whatsapp: string;
  city: string;
  state: string;
  yearsInBusiness: string;
  services: string[];
  systemSizes: string[];
  startingPrice: string;
  bio: string;
  instagram: string;
  logo: File | null;
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export default function ForBuildersPage() {
  const [activeSection, setActiveSection] = useState<'landing' | 'signup'>('landing');
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    contactEmail: '',
    password: '',
    whatsapp: '',
    city: '',
    state: '',
    yearsInBusiness: '',
    services: [],
    systemSizes: [],
    startingPrice: '',
    bio: '',
    instagram: '',
    logo: null,
  });

  const updateForm = (key: keyof FormData, value: string | string[] | File | null) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleService = (id: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(id)
        ? prev.services.filter(s => s !== id)
        : [...prev.services, id]
    }));
  };

  const toggleSize = (size: string) => {
    setFormData(prev => ({
      ...prev,
      systemSizes: prev.systemSizes.includes(size)
        ? prev.systemSizes.filter(s => s !== size)
        : [...prev.systemSizes, size]
    }));
  };

  const step1Valid = formData.businessName && formData.contactEmail && formData.password.length >= 8 && formData.whatsapp && formData.city && formData.state && formData.yearsInBusiness;
  const step2Valid = formData.services.length > 0 && formData.systemSizes.length > 0;

  if (submitted) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-6">⚡</div>
          <h1 className="font-heading text-3xl font-extrabold text-[#0A0F1E] mb-4">
            You&apos;re live!
          </h1>
          <p className="text-[#64748B] text-lg mb-8 leading-relaxed">
            Your free listing is now on SolarBuilders.ng. Customers can find and contact you directly on WhatsApp.
          </p>
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 text-left">
            <h3 className="font-heading font-bold text-[#0A0F1E] mb-3">Next steps:</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#64748B] text-sm">
                <CheckCircle className="w-4 h-4 text-[#10B981]" />
                Share your profile link with customers
              </div>
              <div className="flex items-center gap-2 text-[#64748B] text-sm">
                <CheckCircle className="w-4 h-4 text-[#10B981]" />
                Add photos to get 3× more enquiries
              </div>
              <div className="flex items-center gap-2 text-[#64748B] text-sm">
                <CheckCircle className="w-4 h-4 text-[#10B981]" />
                Upgrade to Verified for priority placement
              </div>
            </div>
          </div>
          <a
            href={`https://wa.me/?text=${encodeURIComponent('I just listed my solar business on SolarBuilders.ng! Check out Nigeria\'s verified solar marketplace: https://solarbuildersng.com')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-heading w-full bg-[#25D366] text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#22c55e] transition-colors"
          >
            💬 Share on WhatsApp
          </a>
        </div>
        <Footer />
      </div>
    );
  }

  if (activeSection === 'signup') {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-8">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="font-heading font-semibold text-[#0A0F1E]">
                Step {step} of 2: {step === 1 ? 'Your Business' : 'Your Services'}
              </span>
              <span className="text-[#64748B] text-sm">{Math.round((step / 2) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div className="h-full bg-[#F59E0B] rounded-full transition-all duration-300" style={{ width: `${(step / 2) * 100}%` }} />
            </div>
          </div>

          {/* Bolt chip */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="text-2xl">⚡</span>
            <p className="text-[#0A0F1E] text-sm">
              {step === 1 && "Let's set up your profile. You'll be live in under 5 minutes."}
              {step === 2 && "What do you actually do? Select everything that applies."}
            </p>
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#0A0F1E] mb-2">Company name *</label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={e => updateForm('businessName', e.target.value)}
                  placeholder="SunPower Installations"
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-4 py-3 text-[#0A0F1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#F59E0B] transition-colors"
                />
                {formData.businessName && (
                  <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                    <p className="text-slate-500 text-xs mb-1">Your profile URL will be:</p>
                    <p className="font-mono text-sm text-amber-600">solarbuildersng.com/company/{toSlug(formData.businessName)}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0A0F1E] mb-2">Contact email *</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={e => updateForm('contactEmail', e.target.value)}
                  placeholder="info@sunpower.ng"
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-4 py-3 text-[#0A0F1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#F59E0B] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0A0F1E] mb-2">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => updateForm('password', e.target.value)}
                  placeholder="Min 8 characters"
                  minLength={8}
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-4 py-3 text-[#0A0F1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#F59E0B] transition-colors"
                />
                {formData.password.length > 0 && formData.password.length < 8 && (
                  <p className="text-red-400 text-xs mt-1">{8 - formData.password.length} more characters needed</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0A0F1E] mb-2">WhatsApp number *</label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={e => updateForm('whatsapp', e.target.value)}
                  placeholder="+234 803 000 0000"
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-4 py-3 text-[#0A0F1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#F59E0B] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#0A0F1E] mb-2">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => updateForm('city', e.target.value)}
                    placeholder="Lekki"
                    className="w-full bg-white border border-[#E2E8F0] rounded-lg px-4 py-3 text-[#0A0F1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#F59E0B] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0A0F1E] mb-2">State *</label>
                  <select
                    value={formData.state}
                    onChange={e => updateForm('state', e.target.value)}
                    className="w-full bg-white border border-[#E2E8F0] rounded-lg px-4 py-3 text-[#0A0F1E] focus:outline-none focus:border-[#F59E0B] transition-colors"
                  >
                    <option value="">Select state</option>
                    {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0A0F1E] mb-2">Company logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => updateForm('logo', e.target.files?.[0] || null)}
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-4 py-3 text-[#0A0F1E] file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0A0F1E] mb-2">Years in business *</label>
                <div className="space-y-2">
                  {['Less than 1 year', '1–3 years', '3–5 years', '5+ years'].map(opt => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="years"
                        value={opt}
                        checked={formData.yearsInBusiness === opt}
                        onChange={e => updateForm('yearsInBusiness', e.target.value)}
                        className="accent-[#F59E0B] w-4 h-4"
                      />
                      <span className="text-[#0A0F1E]">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#0A0F1E] mb-3">What do you offer? *</label>
                <div className="grid grid-cols-2 gap-3">
                  {SERVICE_TYPES.map(service => (
                    <button
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        formData.services.includes(service.id)
                          ? 'border-[#F59E0B] bg-[#FFFBEB]'
                          : 'border-[#E2E8F0] bg-white hover:border-[#F59E0B]/50'
                      }`}
                    >
                      <div className="text-2xl mb-2">{service.emoji}</div>
                      <p className="font-heading font-semibold text-[#0A0F1E] text-sm">{service.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0A0F1E] mb-3">System sizes you handle *</label>
                <div className="flex flex-wrap gap-2">
                  {SYSTEM_SIZES.map(size => (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        formData.systemSizes.includes(size)
                          ? 'bg-[#0A0F1E] text-white border-[#0A0F1E]'
                          : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#0A0F1E]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0A0F1E] mb-1">
                  Starting price for a 5kVA system (optional)
                </label>
                <p className="text-[#F59E0B] text-xs mb-2">Listings with prices get 2× more enquiries</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] font-semibold">₦</span>
                  <input
                    type="number"
                    value={formData.startingPrice}
                    onChange={e => updateForm('startingPrice', e.target.value)}
                    placeholder="680000"
                    className="w-full bg-white border border-[#E2E8F0] rounded-lg pl-8 pr-4 py-3 text-[#0A0F1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#F59E0B] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0A0F1E] mb-1">Brief description (optional)</label>
                <textarea
                  value={formData.bio}
                  onChange={e => updateForm('bio', e.target.value)}
                  placeholder="Lagos-based installer since 2019. 47 completed projects."
                  rows={3}
                  maxLength={150}
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-4 py-3 text-[#0A0F1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#F59E0B] transition-colors resize-none"
                />
                <p className="text-[#94A3B8] text-xs text-right">{formData.bio.length}/150</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 text-[#64748B] hover:text-[#0A0F1E] font-semibold py-4 px-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}

            {step < 2 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!step1Valid}
                className={`flex-1 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-colors ${
                  step1Valid
                    ? 'bg-[#F59E0B] text-[#0A0F1E] hover:bg-[#D97706]'
                    : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed opacity-50'
                }`}
              >
                Continue <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={async () => {
                  if (!step2Valid) return;
                  try {
                    await fetch('/api/builder-signup', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(formData),
                    });
                  } catch {}
                  setSubmitted(true);
                }}
                disabled={!step2Valid}
                className={`flex-1 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-colors ${
                  step2Valid
                    ? 'bg-[#F59E0B] text-[#0A0F1E] hover:bg-[#D97706]'
                    : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed opacity-50'
                }`}
              >
                List My Business Free →
              </button>
            )}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Landing page
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
      {/* Hero */}
      <section className="bg-white border-b border-[#E2E8F0] py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-white mb-4">
            Get more customers for your solar business.
          </h1>
          <p className="text-[#94A3B8] text-xl mb-8 leading-relaxed">
            Your next customer is searching &quot;solar installer Lagos&quot; right now.
            <br className="hidden md:block" />
            Are you showing up?
          </p>
          <button
            onClick={() => setActiveSection('signup')}
            className="font-heading inline-flex items-center gap-2 bg-[#F59E0B] text-[#0A0F1E] px-8 py-5 rounded-xl font-bold text-xl hover:bg-[#D97706] transition-colors"
          >
            <Zap className="w-6 h-6" fill="currentColor" />
            List Your Business — Free
          </button>
          <p className="text-[#64748B] text-sm mt-3">12 builders already listed in Lagos</p>
        </div>
      </section>

      {/* Why list */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-[#0A0F1E] text-center mb-12">
            Why builders choose SolarBuilders.ng
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                emoji: '🎯',
                title: 'Qualified leads, not tire-kickers',
                desc: 'Our calculator sends buyers to you only after they\'ve calculated their exact system need. They\'re ready to buy.',
              },
              {
                emoji: '✅',
                title: 'Verified badge = business edge',
                desc: 'In a market full of quacks, Nexprove Verified tells customers you\'re serious. It\'s the difference between being contacted and being ignored.',
              },
              {
                emoji: '🌍',
                title: 'Access to diaspora customers',
                desc: 'We actively market to Nigerians in London, Toronto, and Berlin. These customers have budget and urgency. You get them directly.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-4xl mb-4">{item.emoji}</div>
                <h3 className="font-heading font-bold text-[#0A0F1E] text-xl mb-2">{item.title}</h3>
                <p className="text-[#64748B]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-[#0A0F1E] text-center mb-4">
            Simple pricing
          </h2>
          <p className="text-center text-[#64748B] mb-12">Start free. Upgrade when the leads start flowing.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-xl p-6 relative ${
                  tier.highlight
                    ? 'bg-[#0A0F1E] border-2 border-[#F59E0B]'
                    : 'bg-white border border-[#E2E8F0]'
                } shadow-sm`}
              >
                {tier.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F59E0B] text-[#0A0F1E] text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    {tier.badge}
                  </span>
                )}

                <h3 className={`font-heading font-bold text-xl mb-2 ${tier.highlight ? 'text-white' : 'text-[#0A0F1E]'}`}>
                  {tier.name}
                </h3>
                <div className="mb-6">
                  {tier.price === 0 ? (
                    <span className={`font-heading text-3xl font-extrabold ${tier.highlight ? 'text-[#F59E0B]' : 'text-[#0A0F1E]'}`}>
                      Free
                    </span>
                  ) : (
                    <div>
                      <span className={`font-heading text-3xl font-extrabold ${tier.highlight ? 'text-[#F59E0B]' : 'text-[#0A0F1E]'}`}>
                        ₦{tier.price.toLocaleString()}
                      </span>
                      <span className={`text-sm ml-1 ${tier.highlight ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                        /{tier.period}
                      </span>
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {tier.features.map(feature => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${tier.highlight ? 'text-[#10B981]' : 'text-[#10B981]'}`} />
                      <span className={`text-sm ${tier.highlight ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => setActiveSection('signup')}
                  className={`w-full py-3 rounded-lg font-bold text-base transition-colors ${
                    tier.highlight
                      ? 'bg-[#F59E0B] text-[#0A0F1E] hover:bg-[#D97706]'
                      : 'border-2 border-[#F59E0B] text-[#F59E0B] hover:bg-[#F59E0B] hover:text-[#0A0F1E]'
                  }
                `}
                >
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      {/* Builder testimonials */}
      <section className="bg-white py-16 px-6 border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-heading font-extrabold text-slate-900 text-2xl md:text-3xl mb-8 text-center">
            What builders say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "Got my first enquiry within a week. The customer already knew their system size from the calculator — no education required, straight to quoting.",
                name: "Emeka O.",
                company: "SunTech Installs, Lagos",
                jobs: "63 jobs completed"
              },
              {
                quote: "Being Nexprove Verified changed how customers talk to me. They come in already trusting the process. My conversion rate doubled.",
                name: "Kola A.",
                company: "Brightfield Solar, Abuja",
                jobs: "41 jobs completed"
              },
              {
                quote: "The diaspora leads are gold. They already have the budget sorted — they just need a builder they can trust remotely.",
                name: "Chidi N.",
                company: "PH Solar Works, Port Harcourt",
                jobs: "28 jobs completed"
              }
            ].map((t, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6">
                <p className="text-slate-700 text-sm leading-relaxed italic mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-heading font-semibold text-slate-900 text-sm">{t.name}</p>
                  <p className="text-slate-500 text-xs">{t.company}</p>
                  <p className="text-amber-500 text-xs font-medium mt-1">{t.jobs}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-2xl font-bold text-[#0A0F1E] mb-8">Common questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'What does "Nexprove Verified" actually mean?',
                a: 'It means we\'ve reviewed your portfolio, called your customer references, and confirmed your location and business identity. Not just a checkbox — a real vetting call.',
              },
              {
                q: 'How do customers contact me?',
                a: 'Directly on WhatsApp. No forms, no middleware. Your WhatsApp number is on your profile and customers tap to message you directly.',
              },
              {
                q: 'What if I don\'t have portfolio photos yet?',
                a: 'You can still list, but photos get 3× more enquiries. We recommend any real job site photo over nothing. Even a finished panel-on-roof photo from your phone works.',
              },
              {
                q: 'How long does verification take?',
                a: 'We aim to call your references within 48 hours and activate your badge the same day if everything checks out.',
              },
            ].map(item => (
              <div key={item.q} className="bg-white rounded-xl p-5 shadow-sm">
                <h3 className="font-heading font-bold text-[#0A0F1E] mb-2">{item.q}</h3>
                <p className="text-[#64748B] text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-12 px-4 bg-[#0A0F1E]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading text-3xl font-bold text-white mb-4">
            Your next customer is ready. Are you listed?
          </h2>
          <button
            onClick={() => setActiveSection('signup')}
            className="font-heading inline-flex items-center gap-2 bg-[#F59E0B] text-[#0A0F1E] px-8 py-5 rounded-xl font-bold text-xl hover:bg-[#D97706] transition-colors"
          >
            List Your Business Free →
          </button>
        </div>
      </section>

      </main>
      <Footer />
    </div>
  );
}
