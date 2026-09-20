'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { whatsappLink } from '@/lib/site';
import { useToast } from '@/components/ui/Toast';
import { CheckCircle, ArrowRight, ArrowLeft, MessageCircle, ShieldCheck, Wrench, Store, Users, Factory } from 'lucide-react';

const STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara',
];

const KINDS = [
  { id: 'installer', label: 'Installer', icon: Wrench, blurb: 'You fit, wire and commission systems on site.' },
  { id: 'vendor', label: 'Vendor / retailer', icon: Store, blurb: 'You sell equipment from stock.' },
  { id: 'manufacturer', label: 'Manufacturer / distributor', icon: Factory, blurb: 'You supply at trade or distributor terms.' },
  { id: 'both', label: 'Installer and vendor', icon: Users, blurb: 'You supply the equipment and install it too.' },
] as const;
type Kind = (typeof KINDS)[number]['id'] | '';

const SERVICES = [
  { id: 'full_install', label: 'Full installation', hint: 'Design, mounting, wiring, commissioning' },
  { id: 'repair', label: 'Repair & maintenance', hint: 'Faults, upgrades, battery swaps' },
  { id: 'parts', label: 'Equipment supply', hint: 'Inverters, batteries, panels, BOS' },
  { id: 'prebuilt', label: 'Pre-built packages', hint: 'Bundled kits with published prices' },
  { id: 'survey', label: 'Site survey & design', hint: 'Load audit, roof and cable plan' },
];

/** The API stores years as a number; these buckets map to honest values. */
const YEARS_OPTIONS = [
  { label: 'Less than 1 year', value: 0 },
  { label: '1–3 years', value: 2 },
  { label: '3–5 years', value: 4 },
  { label: '5+ years', value: 6 },
];

/** Kept in step with SYSTEM_SIZES in lib/partners.ts — the exact dashes matter. */
const SYSTEM_SIZES = ['1–2kVA', '3–5kVA', '5–10kVA', '10kVA+'];


/**
 * The four ticks, verbatim (L12). This wording is the deal — it is what the
 * partner agrees to, so it must match what we email on approval and what
 * /verified promises customers. Change it here, change it there too.
 */
const AGREEMENTS = [
  {
    key: 'verification' as const,
    title: 'Verification',
    text: 'I consent to SolarBuilders.ng verifying the business, technical and reference information I have provided — including calling my referees, checking my CAC number, and reviewing installation evidence. I understand that approval, the verified badge and any listing are conditional on this verification being true, and that the badge may be withdrawn if it later proves false.',
  },
  {
    key: 'commission' as const,
    title: 'Commission on referred jobs',
    text: 'For any customer SolarBuilders.ng refers to me who goes on to buy equipment through SolarBuilders.ng, I agree that SolarBuilders.ng earns a referral commission on that equipment order, as set out in the rate confirmed in writing for each job. I will not ask the customer to bypass SolarBuilders.ng on a referred job.',
  },
  {
    key: 'nonCircumvention' as const,
    title: 'Non-circumvention',
    text: 'For twelve months from any introduction made through SolarBuilders.ng, I will not approach that customer or vendor directly to transact the same or a similar job outside SolarBuilders.ng, and I will not use SolarBuilders.ng quotes, bills of materials or supplier contacts to do so.',
  },
  {
    key: 'data' as const,
    title: 'Data handling',
    text: "I consent to SolarBuilders.ng storing and processing the information in this application — including my CAC number, referees' contact details, installation photos and bank details — for the purposes of assessing my application, running referred jobs, and paying me. I understand anything published on the public site will exclude my phone number, email address, CAC document, references and bank details, and that I can ask in writing for my data to be deleted.",
  },
];

interface FormData {
  kind: Kind;
  businessName: string;
  contactName: string;
  email: string;
  whatsapp: string;
  city: string;
  state: string;
  yearsInBusiness: string;
  website: string;
  instagram: string;
  services: string[];
  systemSizes: string[];
  coverageStates: string[];
  coverageCities: string;
  brandsCarried: string;
  monthlyCapacity: string;
  maxTravelKm: string;
  cacNumber: string;
  cacDocUrl: string;
  installs: { site: string; city: string; size: string; year: string; photoUrl: string }[];
  refs: { name: string; phone: string; project: string }[];
  warrantyMonths: string;
  warrantyTerms: string;
  priceListUrl: string;
  tradeTerms: string;
  leadTimeDays: string;
  moq: string;
  rmaTerms: string;
  note: string;
  agreements: Record<'verification' | 'commission' | 'nonCircumvention' | 'data', boolean>;
}

const EMPTY: FormData = {
  kind: '',
  businessName: '',
  contactName: '',
  email: '',
  whatsapp: '',
  city: '',
  state: '',
  yearsInBusiness: '',
  website: '',
  instagram: '',
  services: [],
  systemSizes: [],
  coverageStates: [],
  coverageCities: '',
  brandsCarried: '',
  monthlyCapacity: '',
  maxTravelKm: '',
  cacNumber: '',
  cacDocUrl: '',
  installs: [
    { site: '', city: '', size: '', year: '', photoUrl: '' },
    { site: '', city: '', size: '', year: '', photoUrl: '' },
    { site: '', city: '', size: '', year: '', photoUrl: '' },
  ],
  refs: [
    { name: '', phone: '', project: '' },
    { name: '', phone: '', project: '' },
  ],
  warrantyMonths: '',
  warrantyTerms: '',
  priceListUrl: '',
  tradeTerms: '',
  leadTimeDays: '',
  moq: '',
  rmaTerms: '',
  note: '',
  agreements: { verification: false, commission: false, nonCircumvention: false, data: false },
};

// ── Draft persistence ───────────────────────────────────────────────────────
// The application is ~30 fields across four steps; a refresh or an accidental
// back-swipe must not cost an applicant their progress. We persist as they
// type (debounced) and restore on mount. sessionStorage is deliberate: it is
// per-tab, so two applicants sharing one laptop never write into each other's
// forms. Cleared on success.
const DRAFT_KEY = 'solar_partner_draft_v1';

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v !== 'function' && typeof v === 'object' && !Array.isArray(v);
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.slice(0, 2000) : '';
}

/** Merge a saved draft into EMPTY, keeping only values shaped like the form. */
function hydrateDraft(saved: unknown, base: FormData): FormData | null {
  if (!isPlainObject(saved)) return null;
  const draft = { ...base };
  for (const key of Object.keys(base) as (keyof FormData)[]) {
    if (key === 'installs' || key === 'refs' || key === 'agreements') continue;
    const value = saved[key];
    const cur = base[key];
    if (Array.isArray(cur)) {
      if (Array.isArray(value)) {
        (draft as Record<string, unknown>)[key] = value.filter((v) => typeof v === 'string');
      }
    } else if (typeof cur === 'string' && typeof value === 'string') {
      (draft as Record<string, unknown>)[key] = (value as string).slice(0, 2000);
    }
  }
  if (Array.isArray(saved.installs)) {
    const rows = saved.installs.filter(isPlainObject);
    if (rows.length === base.installs.length) {
      draft.installs = rows.map((r) => ({
        site: str(r.site),
        city: str(r.city),
        size: str(r.size),
        year: str(r.year),
        photoUrl: str(r.photoUrl),
      }));
    }
  }
  if (Array.isArray(saved.refs)) {
    const rows = saved.refs.filter(isPlainObject);
    if (rows.length === base.refs.length) {
      draft.refs = rows.map((r) => ({
        name: str(r.name),
        phone: str(r.phone),
        project: str(r.project),
      }));
    }
  }
  if (isPlainObject(saved.agreements)) {
    for (const k of ['verification', 'commission', 'nonCircumvention', 'data'] as const) {
      if (typeof saved.agreements[k] === 'boolean') draft.agreements[k] = saved.agreements[k];
    }
  }
  return draft;
}

function draftHasContent(f: FormData): boolean {
  return (
    f.kind !== '' ||
    f.services.length > 0 ||
    f.systemSizes.length > 0 ||
    f.coverageStates.length > 0 ||
    f.businessName.trim() !== '' ||
    f.contactName.trim() !== '' ||
    f.email.trim() !== '' ||
    f.whatsapp.trim() !== '' ||
    f.note.trim() !== ''
  );
}

/** Build the JSON body the API expects (camelCase, exactly what validateApplication reads). */
function toPayload(f: FormData, hp = '') {
  const doesInstallWork = f.kind === 'installer' || f.kind === 'both';
  const doesSupply = f.kind === 'vendor' || f.kind === 'manufacturer' || f.kind === 'both';
  return {
    kind: f.kind,
    businessName: f.businessName.trim(),
    contactName: f.contactName.trim(),
    email: f.email.trim(),
    whatsapp: f.whatsapp.trim(),
    city: f.city.trim(),
    state: f.state,
    yearsInBusiness: f.yearsInBusiness === '' ? '' : Number(f.yearsInBusiness),
    website: f.website.trim(),
    instagram: f.instagram.trim(),
    services: f.services,
    systemSizes: f.systemSizes,
    coverageStates: f.coverageStates,
    coverageCities: f.coverageCities.split(',').map((c) => c.trim()).filter(Boolean),
    brandsCarried: f.brandsCarried.trim(),
    monthlyCapacity: f.monthlyCapacity.trim(),
    maxTravelKm: f.maxTravelKm.trim(),
    cacNumber: f.cacNumber.trim(),
    cacDocUrl: f.cacDocUrl.trim(),
    installs: doesInstallWork
      ? f.installs
          .filter((i) => i.site.trim() || i.photoUrl.trim())
          .map((i) => ({ site: i.site.trim(), city: i.city.trim(), size: i.size.trim(), year: i.year.trim(), photoUrl: i.photoUrl.trim() }))
      : [],
    refs: doesInstallWork
      ? f.refs.filter((r) => r.name.trim() || r.phone.trim()).map((r) => ({ name: r.name.trim(), phone: r.phone.trim(), project: r.project.trim() }))
      : [],
    warrantyMonths: f.warrantyMonths.trim(),
    warrantyTerms: f.warrantyTerms.trim(),
    priceListUrl: doesSupply ? f.priceListUrl.trim() : '',
    tradeTerms: doesSupply ? f.tradeTerms.trim() : '',
    leadTimeDays: doesSupply ? f.leadTimeDays.trim() : '',
    moq: doesSupply ? f.moq.trim() : '',
    rmaTerms: doesSupply ? f.rmaTerms.trim() : '',
    note: f.note.trim(),
    agreeVerification: f.agreements.verification,
    agreeCommission: f.agreements.commission,
    agreeNonCircumvention: f.agreements.nonCircumvention,
    agreeData: f.agreements.data,
    hp,
  };
}

const STEP_HINTS = [
  'Tell us who you are. About five minutes, nothing to pay.',
  'What do you actually do? Pick everything that applies.',
  'The evidence behind the badge. Three installs with photo links, two referees, a written warranty — whatever you skip, we will ask for.',
  'The four things you are agreeing to. Read them.',
];

const STEP_TITLES = ['Your business', 'What you do', 'What we check', 'Terms'];

const INPUT =
  'w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-400 transition-colors min-h-[44px]';
const LABEL = 'block text-sm font-medium text-slate-900 mb-2';

export default function WorkWithUsClient({ navbar, footer }: { navbar: React.ReactNode; footer: React.ReactNode }) {
  const [activeSection, setActiveSection] = useState<'landing' | 'signup'>('landing');
  const [step, setStep] = useState(1);
  const [sent, setSent] = useState<{ ref: string; stored: boolean; emailed: boolean } | null>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [serverError, setServerError] = useState('');
  const [hp, setHp] = useState('');
  const [formData, setFormData] = useState<FormData>(EMPTY);
  const { toast } = useToast();
  // Guards draft restore: without it, a mount-effect refire after hydration
  // would clobber whatever the applicant has typed since.
  const draftLoaded = useRef(false);

  const updateForm = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateInstall = (index: number, key: 'site' | 'city' | 'size' | 'year' | 'photoUrl', value: string) => {
    setFormData((prev) => ({ ...prev, installs: prev.installs.map((inst, i) => (i === index ? { ...inst, [key]: value } : inst)) }));
  };

  const updateRef = (index: number, key: 'name' | 'phone' | 'project', value: string) => {
    setFormData((prev) => ({ ...prev, refs: prev.refs.map((r, i) => (i === index ? { ...r, [key]: value } : r)) }));
  };

  const toggleList = (key: 'services' | 'systemSizes' | 'coverageStates') => (value: string) => {
    setFormData((prev) => {
      const list = prev[key];
      return { ...prev, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] };
    });
  };

  const toggleService = toggleList('services');
  const toggleSize = toggleList('systemSizes');
  const toggleCoverage = toggleList('coverageStates');

  const toggleAgreement = (key: keyof FormData['agreements']) => {
    setFormData((prev) => ({ ...prev, agreements: { ...prev.agreements, [key]: !prev.agreements[key] } }));
  };

  const kindIsInstaller = formData.kind === 'installer' || formData.kind === 'both';
  const kindIsVendor = formData.kind === 'vendor' || formData.kind === 'both';

  // ── Draft persistence (sessionStorage) ────────────────────────────────
  // Restore once on mount, then save as the applicant types (debounced).
  // Cleared on successful submit. sessionStorage is deliberate: per-tab, so
  // two applicants sharing one laptop never write into each other's forms.
  useEffect(() => {
    if (draftLoaded.current) return;
    draftLoaded.current = true;
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as unknown;
      const draft = hydrateDraft(saved, EMPTY);
      if (draft && draftHasContent(draft)) {
        setFormData(draft);
        setActiveSection('signup');
        toast('We restored your draft application.', 'info');
      }
    } catch {
      // Corrupt or unusable draft — ignore, start clean.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (sent) return; // success clears the draft; don't immediately re-save it
    const t = setTimeout(() => {
      try {
        if (draftHasContent(formData)) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
      } catch {
        // Storage full/blocked — persistence is best-effort.
      }
    }, 400);
    return () => clearTimeout(t);
  }, [formData, sent]);

  const step1Valid =
    formData.kind && formData.businessName.trim() && formData.contactName.trim() && formData.email.trim() && formData.whatsapp.trim() && formData.city.trim() && formData.state && formData.yearsInBusiness;
  const step2Valid = formData.services.length > 0 && formData.systemSizes.length > 0;
  const step4Valid = Object.values(formData.agreements).every(Boolean);
  const canAdvance = step === 1 ? Boolean(step1Valid) : step === 2 ? step2Valid : step === 3 ? true : step4Valid;

  const submit = async () => {
    if (!canAdvance || status === 'sending') return;
    setStatus('sending');
    setServerError('');
    try {
      const res = await fetch('/api/partner-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload(formData, hp)),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        ref?: string;
        stored?: boolean;
        emailed?: boolean;
        error?: string;
      };
      if (res.ok && body.ok) {
        try {
          sessionStorage.removeItem(DRAFT_KEY);
        } catch {
          // Best-effort cleanup.
        }
        setSent({ ref: body.ref ?? '', stored: Boolean(body.stored), emailed: Boolean(body.emailed) });
        setStatus('idle');
        return;
      }
      setServerError(body.error || 'We could not send that. Try again, or message us on WhatsApp.');
      toast('The application could not be sent — see what needs fixing below.', 'error');
      setStatus('error');
    } catch {
      setServerError('Network error. Check your connection and try again, or message us on WhatsApp.');
      toast('Network error — check your connection and try again.', 'error');
      setStatus('error');
    }
  };

  const kindLabel = KINDS.find((k) => k.id === formData.kind)?.label ?? 'partner';

  if (sent) {
    return <SentScreen sent={sent} kindLabel={kindLabel} businessName={formData.businessName} navbar={navbar} footer={footer} />;
  }

  if (activeSection === 'signup') {
    return (
      <div className="min-h-screen bg-white">
        {navbar}
        <main className="max-w-xl mx-auto px-6 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="font-heading font-semibold text-slate-900">
                Step {step} of 4: {STEP_TITLES[step - 1]}
              </span>
              <span className="text-slate-500 text-sm">{Math.round((step / 4) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }} />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-slate-800 text-sm">{STEP_HINTS[step - 1]}</p>
          </div>

          {step === 1 && <StepBusiness formData={formData} updateForm={updateForm} />}
          {step === 2 && (
            <StepWhat formData={formData} updateForm={updateForm} toggleService={toggleService} toggleSize={toggleSize} toggleCoverage={toggleCoverage} />
          )}
          {step === 3 && (
            <StepChecks formData={formData} updateForm={updateForm} updateInstall={updateInstall} updateRef={updateRef} kindIsInstaller={kindIsInstaller} kindIsVendor={kindIsVendor} />
          )}
          {step === 4 && <StepTerms formData={formData} toggleAgreement={toggleAgreement} />}

          {/* Honeypot — hidden from humans, bait for scripts. Never give it a
              label or autocomplete; a filled field means bot. */}
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

          {status === 'error' && serverError && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              {serverError}{' '}
              <a
                href={whatsappLink(`Hi SolarBuilders, I want to work with you as a ${kindLabel}. Business: ${formData.businessName}, ${formData.city}, ${formData.state}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline underline-offset-4"
              >
                Message us on WhatsApp
              </a>{' '}
              if it keeps failing.
            </div>
          )}

          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={() => (step > 1 ? setStep(step - 1) : setActiveSection('landing'))}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-semibold py-4 px-4 transition-colors min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            {step < 4 ? (
              <button
                type="button"
                disabled={!canAdvance}
                onClick={() => setStep(step + 1)}
                className="flex-1 font-heading bg-slate-900 text-white py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors min-h-[56px] disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                Continue <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!canAdvance || status === 'sending'}
                onClick={submit}
                className="flex-1 font-heading bg-amber-500 text-white py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors min-h-[56px] disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {status === 'sending' ? 'Sending…' : 'Submit application'} {status !== 'sending' && <ArrowRight className="w-5 h-5" />}
              </button>
            )}
          </div>
        </main>
        {footer}
      </div>
    );
  }

  return <Landing navbar={navbar} footer={footer} onStart={() => setActiveSection('signup')} />;
}

interface StepProps {
  formData: FormData;
  updateForm: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}

function StepBusiness({ formData: f, updateForm }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <span className={LABEL}>I am a… *</span>
        <div className="space-y-2">
          {KINDS.map((k) => {
            const Icon = k.icon;
            const on = f.kind === k.id;
            return (
              <button
                key={k.id}
                type="button"
                aria-pressed={on}
                onClick={() => updateForm('kind', k.id)}
                className={`w-full p-4 rounded-xl border-2 text-left flex items-start gap-3 transition-all min-h-[56px] ${on ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white hover:border-amber-300'}`}
              >
                <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${on ? 'text-amber-600' : 'text-slate-400'}`} />
                <span>
                  <span className="font-heading font-semibold text-slate-900 text-sm block">{k.label}</span>
                  <span className="text-slate-500 text-xs">{k.blurb}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor="businessName" className={LABEL}>Business name *</label>
        <input id="businessName" type="text" value={f.businessName} onChange={(e) => updateForm('businessName', e.target.value)} placeholder="As registered with CAC" className={INPUT} />
      </div>

      <div>
        <label htmlFor="contactName" className={LABEL}>Your name and role *</label>
        <input id="contactName" type="text" value={f.contactName} onChange={(e) => updateForm('contactName', e.target.value)} placeholder="Adaeze Okafor, managing director" className={INPUT} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="email" className={LABEL}>Email *</label>
          <input id="email" type="email" value={f.email} onChange={(e) => updateForm('email', e.target.value)} placeholder="info@yourcompany.ng" className={INPUT} />
        </div>
        <div>
          <label htmlFor="whatsapp" className={LABEL}>WhatsApp *</label>
          <input id="whatsapp" type="tel" value={f.whatsapp} onChange={(e) => updateForm('whatsapp', e.target.value)} placeholder="+234 803 000 0000" className={INPUT} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="city" className={LABEL}>City *</label>
          <input id="city" type="text" value={f.city} onChange={(e) => updateForm('city', e.target.value)} placeholder="Ikeja" className={INPUT} />
        </div>
        <div>
          <label htmlFor="state" className={LABEL}>State *</label>
          <select id="state" value={f.state} onChange={(e) => updateForm('state', e.target.value)} className={INPUT}>
            <option value="">Select state</option>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="years" className={LABEL}>Years in business *</label>
        <select id="years" value={f.yearsInBusiness} onChange={(e) => updateForm('yearsInBusiness', e.target.value)} className={INPUT}>
          <option value="">Select one</option>
          {YEARS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="website" className={LABEL}>Website (optional)</label>
          <input id="website" type="text" value={f.website} onChange={(e) => updateForm('website', e.target.value)} placeholder="yourcompany.ng" className={INPUT} />
        </div>
        <div>
          <label htmlFor="instagram" className={LABEL}>Instagram (optional)</label>
          <input id="instagram" type="text" value={f.instagram} onChange={(e) => updateForm('instagram', e.target.value)} placeholder="@yourcompany" className={INPUT} />
        </div>
      </div>
    </div>
  );
}

function StepWhat({
  formData: f,
  updateForm,
  toggleService,
  toggleSize,
  toggleCoverage,
}: StepProps & {
  toggleService: (v: string) => void;
  toggleSize: (v: string) => void;
  toggleCoverage: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <span className={LABEL}>What do you offer? *</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SERVICES.map((s) => {
            const on = f.services.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggleService(s.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all min-h-[44px] ${on ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white hover:border-amber-300'}`}
              >
                <p className="font-heading font-semibold text-slate-900 text-sm">{s.label}</p>
                <p className="text-slate-500 text-xs mt-1">{s.hint}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className={LABEL}>System sizes you handle *</span>
        <div className="flex flex-wrap gap-2">
          {SYSTEM_SIZES.map((size) => {
            const on = f.systemSizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                aria-pressed={on}
                onClick={() => toggleSize(size)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors min-h-[44px] ${on ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-900'}`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className={LABEL}>Where do you work?</span>
        <p className="text-slate-500 text-xs mb-2">Home state first, then any other state you actually cover.</p>
        <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto border border-slate-200 rounded-lg p-3">
          {STATES.map((s) => {
            const on = f.coverageStates.includes(s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={on}
                onClick={() => toggleCoverage(s)}
                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors min-h-[36px] ${on ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-900'}`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor="coverageCities" className={LABEL}>Cities / towns you cover (optional)</label>
        <input id="coverageCities" type="text" value={f.coverageCities} onChange={(e) => updateForm('coverageCities', e.target.value)} placeholder="Ikeja, Lekki, Ibadan" className={INPUT} />
        <p className="text-slate-500 text-xs mt-1">Comma-separated. We use this to route jobs that are close to you.</p>
      </div>

      <div>
        <label htmlFor="brandsCarried" className={LABEL}>Brands you carry or install (optional)</label>
        <input id="brandsCarried" type="text" value={f.brandsCarried} onChange={(e) => updateForm('brandsCarried', e.target.value)} placeholder="Growatt, Pylontech, Jinko…" className={INPUT} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="monthlyCapacity" className={LABEL}>Jobs per month you can take (optional)</label>
          <input id="monthlyCapacity" type="number" inputMode="numeric" value={f.monthlyCapacity} onChange={(e) => updateForm('monthlyCapacity', e.target.value)} placeholder="4" className={INPUT} />
          <p className="text-slate-500 text-xs mt-1">We use this to pace how many jobs we route to you.</p>
        </div>
        <div>
          <label htmlFor="maxTravelKm" className={LABEL}>How far you will travel, km (optional)</label>
          <input id="maxTravelKm" type="number" inputMode="numeric" value={f.maxTravelKm} onChange={(e) => updateForm('maxTravelKm', e.target.value)} placeholder="80" className={INPUT} />
        </div>
      </div>
    </div>
  );
}

interface StepChecksProps {
  formData: FormData;
  updateForm: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  updateInstall: (index: number, key: 'site' | 'city' | 'size' | 'year' | 'photoUrl', value: string) => void;
  updateRef: (index: number, key: 'name' | 'phone' | 'project', value: string) => void;
  kindIsInstaller: boolean;
  kindIsVendor: boolean;
}

function StepChecks({ formData: f, updateForm, updateInstall, updateRef, kindIsInstaller, kindIsVendor }: StepChecksProps) {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="cacNumber" className={LABEL}>CAC number *</label>
        <input id="cacNumber" type="text" value={f.cacNumber} onChange={(e) => updateForm('cacNumber', e.target.value)} placeholder="BN 1234567 or RC 1234567" className={INPUT} />
        <p className="text-slate-500 text-xs mt-1">Business name or company registration. We check this against the CAC registry.</p>
      </div>

      <div>
        <label htmlFor="cacDocUrl" className={LABEL}>Link to your CAC certificate or status report (optional)</label>
        <input id="cacDocUrl" type="url" value={f.cacDocUrl} onChange={(e) => updateForm('cacDocUrl', e.target.value)} placeholder="https://drive.google.com/…" className={INPUT} />
        <p className="text-slate-500 text-xs mt-1">Speeds things up. Any document-sharing link works. We do not publish it.</p>
      </div>

      {kindIsInstaller && (
        <>
          <div>
            <p className={LABEL}>Three past installations *</p>
            <p className="text-slate-500 text-xs mb-2">Site, city, size, year — and a photo link for each. We open every photo. This is the main thing we check.</p>
            <div className="space-y-3">
              {f.installs.map((inst, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <p className="text-xs font-semibold text-slate-500 mb-2">Installation {i + 1}</p>
                  <input type="text" value={inst.site} onChange={(e) => updateInstall(i, 'site', e.target.value)} placeholder="Site or customer name" className={`${INPUT} mb-2`} />
                  <div className="grid grid-cols-3 gap-2">
                    <input type="text" value={inst.city} onChange={(e) => updateInstall(i, 'city', e.target.value)} placeholder="City" className={INPUT} />
                    <input type="text" value={inst.size} onChange={(e) => updateInstall(i, 'size', e.target.value)} placeholder="Size" className={INPUT} />
                    <input type="text" value={inst.year} onChange={(e) => updateInstall(i, 'year', e.target.value)} placeholder="Year" className={INPUT} />
                  </div>
                  <input type="url" value={inst.photoUrl} onChange={(e) => updateInstall(i, 'photoUrl', e.target.value)} placeholder="Photo link (optional)" className={`${INPUT} mt-2`} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className={LABEL}>Two references we can call *</p>
            <p className="text-slate-500 text-xs mb-2">A past customer or a supplier who has seen your work. We call before approval.</p>
            <div className="space-y-3">
              {f.refs.map((r, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <p className="text-xs font-semibold text-slate-500 mb-2">Reference {i + 1}</p>
                  <input type="text" value={r.name} onChange={(e) => updateRef(i, 'name', e.target.value)} placeholder="Name" className={`${INPUT} mb-2`} />
                  <input type="tel" value={r.phone} onChange={(e) => updateRef(i, 'phone', e.target.value)} placeholder="Phone" className={`${INPUT} mb-2`} />
                  <input type="text" value={r.project} onChange={(e) => updateRef(i, 'project', e.target.value)} placeholder="What they engaged you for" className={INPUT} />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="warrantyMonths" className={LABEL}>Workmanship warranty, months *</label>
              <input id="warrantyMonths" type="number" inputMode="numeric" value={f.warrantyMonths} onChange={(e) => updateForm('warrantyMonths', e.target.value)} placeholder="12" className={INPUT} />
            </div>
            <div>
              <label htmlFor="warrantyTerms" className={LABEL}>Warranty terms, spelled out *</label>
              <input id="warrantyTerms" type="text" value={f.warrantyTerms} onChange={(e) => updateForm('warrantyTerms', e.target.value)} placeholder="Covers wiring faults, free return visit" className={INPUT} />
            </div>
          </div>
        </>
      )}

      {kindIsVendor && (
        <>
          <div>
            <label htmlFor="priceListUrl" className={LABEL}>Link to your price list or catalogue</label>
            <input id="priceListUrl" type="url" value={f.priceListUrl} onChange={(e) => updateForm('priceListUrl', e.target.value)} placeholder="https://…" className={INPUT} />
            <p className="text-slate-500 text-xs mt-1">The badge for vendors is built on a current, public price list we can link to.</p>
          </div>

          <div>
            <label htmlFor="tradeTerms" className={LABEL}>Trade terms</label>
            <textarea id="tradeTerms" value={f.tradeTerms} onChange={(e) => updateForm('tradeTerms', e.target.value)} placeholder="Payment on delivery, discount from 5 units…" rows={2} className={`${INPUT} resize-none`} />
            <p className="text-slate-500 text-xs mt-1">A price list link or written trade terms — at least one of the two is required.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="leadTimeDays" className={LABEL}>Lead time, days *</label>
              <input id="leadTimeDays" type="number" inputMode="numeric" value={f.leadTimeDays} onChange={(e) => updateForm('leadTimeDays', e.target.value)} placeholder="2" className={INPUT} />
              <p className="text-slate-500 text-xs mt-1">From order to delivery in your main city.</p>
            </div>
            <div>
              <label htmlFor="moq" className={LABEL}>Minimum order quantity (optional)</label>
              <input id="moq" type="number" inputMode="numeric" value={f.moq} onChange={(e) => updateForm('moq', e.target.value)} placeholder="1" className={INPUT} />
            </div>
          </div>

          <div>
            <label htmlFor="rmaTerms" className={LABEL}>Who handles a failed unit, and how long a swap takes *</label>
            <textarea id="rmaTerms" value={f.rmaTerms} onChange={(e) => updateForm('rmaTerms', e.target.value)} placeholder="Supplier swap within 7 days if the fault is not installer damage" rows={2} className={`${INPUT} resize-none`} />
          </div>
        </>
      )}

      <div>
        <label htmlFor="note" className={LABEL}>Anything we should know (optional)</label>
        <textarea id="note" value={f.note} onChange={(e) => updateForm('note', e.target.value)} placeholder="Certifications, partnerships, gaps in your coverage…" rows={3} maxLength={500} className={`${INPUT} resize-none`} />
      </div>
    </div>
  );
}

function StepTerms({ formData: f, toggleAgreement }: { formData: FormData; toggleAgreement: (key: keyof FormData['agreements']) => void }) {
  return (
    <div className="space-y-5">
      <p className="text-slate-600 text-sm leading-relaxed">
        Four things, all of them plain. Tick each one. None of them are optional, and the tick is recorded with the date.
      </p>
      {AGREEMENTS.map((a) => (
        <label key={a.key} className="block border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-amber-300 transition-colors">
          <span className="flex items-start gap-3">
            <input type="checkbox" checked={f.agreements[a.key]} onChange={() => toggleAgreement(a.key)} className="accent-amber-500 w-5 h-5 mt-1 flex-shrink-0" />
            <span>
              <span className="font-heading font-semibold text-slate-900 text-sm block mb-1">{a.title}</span>
              <span className="text-slate-600 text-sm leading-relaxed">{a.text}</span>
            </span>
          </span>
        </label>
      ))}
      <p className="text-slate-500 text-xs leading-relaxed">
        On commission: the rate is ours to set per job, confirmed to you in writing before you accept the job, and always on the equipment order we place — never a cut of your labour.
      </p>
    </div>
  );
}

function SentScreen({
  sent,
  kindLabel,
  businessName,
  navbar,
  footer,
}: {
  sent: { ref: string; stored: boolean; emailed: boolean };
  kindLabel: string;
  businessName: string;
  navbar: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {navbar}
      <main className="max-w-lg mx-auto px-6 py-16 text-center">
        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-7 h-7 text-amber-600" />
        </div>
        <h1 className="font-heading text-3xl font-extrabold text-slate-900 mb-4">Application received.</h1>
        {sent.ref && (
          <p className="text-slate-700 mb-2">
            Your reference is <span className="font-heading font-bold text-slate-900">{sent.ref}</span>. Keep it — you will need it, with the email you applied from, to{' '}
            <Link href="/partners/status" className="underline underline-offset-4 hover:text-slate-900">check your status</Link>.
          </p>
        )}
        <p className="text-slate-500 text-lg mb-8 leading-relaxed">
          We reply by email or WhatsApp. What happens next: we check your CAC, call your references, and review your installation evidence. If anything is missing we ask for it — nothing is decided silently.
        </p>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 text-left">
          <div className="space-y-3">
            {[
              'We check your CAC number against the registry',
              'We call your two references',
              'We look at your installation photos and warranty terms',
              'Approved partners get a portal link and go live on /partners',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-slate-700 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <a
          href={whatsappLink(`Hi SolarBuilders, I just applied as a ${kindLabel}. Business: ${businessName}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-heading w-full bg-[#25D366] text-white py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#22c55e] transition-colors min-h-[56px]"
        >
          <MessageCircle className="w-5 h-5" /> Message us on WhatsApp
        </a>
        <Link href="/partners" className="inline-flex items-center gap-1 text-slate-500 text-sm mt-6 hover:text-slate-900 underline-offset-4 hover:underline min-h-[44px]">
          See the partners already verified <ArrowRight className="w-4 h-4" />
        </Link>
      </main>
      {footer}
    </div>
  );
}

function Landing({ navbar, footer, onStart }: { navbar: React.ReactNode; footer: React.ReactNode; onStart: () => void }) {
  return (
    <div className="min-h-screen bg-white">
      {navbar}
      <main>
        <section className="max-w-3xl mx-auto px-6 pt-16 pb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 mb-6">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span className="text-amber-800 text-sm font-medium">For installers, vendors and suppliers</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
            Work that comes to you, not leads that vanish.
          </h1>
          <p className="text-slate-600 text-lg mb-8 leading-relaxed max-w-2xl mx-auto">
            We build the quote with the customer, place the equipment order, and route the job to a verified installer in their city. You get real work with real paperwork — and customers get someone they can trust with their roof.
          </p>
          <button
            onClick={onStart}
            className="font-heading bg-slate-900 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-800 transition-colors min-h-[56px] inline-flex items-center gap-2"
          >
            Apply to work with us <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-slate-500 text-sm mt-4">Five minutes. Nothing to pay.</p>
        </section>

        <section className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
            {[
              { icon: Wrench, title: 'Installers', text: 'Verified jobs routed to your city and your skill set. You quote the labour, we handle the equipment order.' },
              { icon: Store, title: 'Vendors & distributors', text: 'We buy from you at your listed prices and confirm every order by phone before a customer pays.' },
              { icon: Users, title: 'Suppliers & manufacturers', text: 'We order per job and you fulfil. Send us your trade list, warranty and RMA terms once and we work from those.' },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="border border-slate-200 rounded-2xl p-6">
                  <Icon className="w-6 h-6 text-amber-500 mb-3" />
                  <h3 className="font-heading font-bold text-slate-900 mb-2">{card.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{card.text}</p>
                </div>
              );
            })}
          </div>

          <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6 text-center">How a job actually runs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16">
            {[
              { step: '01', title: 'Customer builds a quote', text: 'They size their system on our calculator and get an itemised bill of materials with a quote code. They send it to us by email or WhatsApp.' },
              { step: '02', title: 'We confirm prices and survey the site', text: 'We call the vendor to confirm current prices, then arrange a site survey. The installer joins the survey.' },
              { step: '03', title: 'Equipment delivered, installer installs', text: 'We buy from the vendor and get it delivered. The installer does the job and sends photos from site on WhatsApp as they go.' },
              { step: '04', title: 'Commissioning and paperwork', text: 'Commissioning checklist, warranty paperwork, handover. Then the next job.' },
            ].map((step) => (
              <div key={step.step} className="border border-slate-200 rounded-2xl p-6">
                <span className="text-amber-500 font-heading font-bold text-sm">{step.step}</span>
                <h3 className="font-heading font-bold text-slate-900 mt-1 mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      {footer}
    </div>
  );
}
