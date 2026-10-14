'use client';

import { PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  ChevronRight,
  Fuel,
  GraduationCap,
  Home,
  KeyRound,
  Laptop,
  Minus,
  Package,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Store,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import Logo from '@/components/ui/Logo';
import {
  buildQuote,
  formatNaira,
  formatRange,
  INVERTER_TIER_LABEL,
  quoteUrl,
  type TierKey,
} from '@/lib/quote';
import {
  CUSTOM_KIT_NAME,
  DEFAULT_HOURS_OFF,
  HOURS_OFF,
  PERSONAS,
  PICK_APPLIANCES,
  SIZE_ORDER,
  generatorFuelPerMonth,
  gridForHoursOff,
  kitName,
  presetWatts,
  toQuoteAppliances,
  type PersonaKey,
} from '@/lib/find-personas';
import { presetAppliance } from '@/lib/appliances';
import { rememberQuote } from '@/lib/quote-access';
import { track } from '@/lib/track';

// ─────────────────────────────────────────────────────────
// URL STATE — every screen is a URL, so the phone's back button works and a
// result can be reopened: /find?p=family&h=12&s=result
// ─────────────────────────────────────────────────────────

type Step = 'who' | 'pick' | 'hours' | 'result';
type Who = PersonaKey | 'pick';

interface FlowState {
  step: Step;
  who: Who | null;
  picks: Record<string, number>;
  hours: number;
  tier: TierKey;
}

const INITIAL: FlowState = { step: 'who', who: null, picks: {}, hours: DEFAULT_HOURS_OFF, tier: 'standard' };
const PERSONA_KEYS = new Set<string>(PERSONAS.map((p) => p.key));
const PICK_IDS = new Set(PICK_APPLIANCES.map((a) => a.id));

function parseState(search: string): FlowState {
  const q = new URLSearchParams(search);
  const p = q.get('p');
  const who: Who | null = p === 'pick' || (p && PERSONA_KEYS.has(p)) ? (p as Who) : null;
  const picks: Record<string, number> = {};
  for (const pair of (q.get('a') ?? '').split(',')) {
    const [id, n] = pair.split(':');
    const qty = Math.min(99, Math.max(0, Math.round(Number(n))));
    if (PICK_IDS.has(id) && qty > 0) picks[id] = qty;
  }
  const h = Number(q.get('h'));
  const hours = HOURS_OFF.some((o) => o.hours === h) ? h : DEFAULT_HOURS_OFF;
  const t = q.get('t');
  const tier: TierKey = t === 'budget' || t === 'premium' ? t : 'standard';
  const s = q.get('s');
  let step: Step = s === 'pick' || s === 'hours' || s === 'result' ? s : 'who';
  // A step that needs an earlier answer falls back to the first screen.
  if (step !== 'who' && !who) step = 'who';
  if (step === 'pick' && who !== 'pick') step = 'who';
  if ((step === 'hours' || step === 'result') && who === 'pick' && Object.keys(picks).length === 0) step = 'pick';
  return { step, who, picks, hours, tier };
}

function toSearch(s: FlowState): string {
  const q = new URLSearchParams();
  if (s.step !== 'who') q.set('s', s.step);
  if (s.who) q.set('p', s.who);
  if (s.who === 'pick') {
    const a = Object.entries(s.picks)
      .filter(([, n]) => n > 0)
      .map(([id, n]) => `${id}:${n}`)
      .join(',');
    if (a) q.set('a', a);
  }
  if (s.step === 'hours' || s.step === 'result') q.set('h', String(s.hours));
  if (s.step === 'result' && s.tier !== 'standard') q.set('t', s.tier);
  const str = q.toString();
  return str ? `?${str}` : '';
}

const STEP_NUMBER: Record<Step, number> = { who: 1, pick: 1, hours: 2, result: 3 };

const PERSONA_ICON: Record<Who, LucideIcon> = {
  students: GraduationCap,
  techbros: Laptop,
  renters: KeyRound,
  shops: Store,
  family: Users,
  duplex: Home,
  offices: Briefcase,
  pick: SlidersHorizontal,
};

// ─────────────────────────────────────────────────────────
// RADIO TILES — a real radiogroup: one tab stop, arrows move and select,
// Enter/Space confirm.
// ─────────────────────────────────────────────────────────

function useRadioKeys<T>(values: T[], selected: T | null, onSelect: (v: T) => void, onConfirm?: (v: T) => void) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    // Up/down follow the grid as laid out (2 columns on phones, 3 wider).
    const parent = e.currentTarget.parentElement;
    const cols = parent ? getComputedStyle(parent).gridTemplateColumns.split(' ').length || 1 : 1;
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % values.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + values.length) % values.length;
    else if (e.key === 'ArrowDown') next = Math.min(values.length - 1, i + cols);
    else if (e.key === 'ArrowUp') next = Math.max(0, i - cols);
    else if ((e.key === 'Enter' || e.key === ' ') && onConfirm) {
      e.preventDefault();
      onConfirm(values[i]);
      return;
    }
    if (next >= 0) {
      e.preventDefault();
      onSelect(values[next]);
      refs.current[next]?.focus();
    }
  };
  const tabIndex = (i: number) => {
    const sel = selected === null ? -1 : values.indexOf(selected);
    return (sel === -1 ? i === 0 : i === sel) ? 0 : -1;
  };
  return { refs, onKeyDown, tabIndex };
}

const TILE =
  'focus-ring rounded-card border text-left transition-[background-color,border-color,box-shadow,color] duration-150 motion-reduce:transition-none';

// ─────────────────────────────────────────────────────────

export default function FindClient() {
  const router = useRouter();
  const [state, setState] = useState<FlowState>(INITIAL);
  /** How many screens this flow has pushed onto history — the ← button pops them. */
  const depth = useRef(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    setState(parseState(window.location.search));
    const onPop = () => {
      depth.current = Math.max(0, depth.current - 1);
      setState(parseState(window.location.search));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = useCallback((next: FlowState, mode: 'push' | 'replace' = 'push') => {
    const url = `${window.location.pathname}${toSearch(next)}`;
    if (mode === 'push') {
      window.history.pushState(null, '', url);
      depth.current += 1;
    } else {
      window.history.replaceState(null, '', url);
    }
    setState(next);
  }, []);

  // Move focus to the new screen's heading so keyboard and screen-reader users
  // land on the question, not on a button that no longer exists.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
    window.scrollTo({ top: 0 });
  }, [state.step]);

  function back() {
    if (depth.current > 0) {
      window.history.back();
      return;
    }
    const prev: Step =
      state.step === 'result' ? 'hours' : state.step === 'hours' ? (state.who === 'pick' ? 'pick' : 'who') : 'who';
    if (state.step === 'who') router.push('/');
    else go({ ...state, step: prev }, 'replace');
  }

  // ── Step 1
  function choosePersona(who: Who) {
    track('find_persona', { placement: who });
    go({ ...state, who, tier: 'standard', step: who === 'pick' ? 'pick' : 'hours' });
  }

  // ── The quote, straight from the engine
  const appliances = useMemo(() => {
    if (!state.who) return [];
    if (state.who === 'pick') return toQuoteAppliances(Object.entries(state.picks).map(([id, qty]) => ({ id, qty })));
    return toQuoteAppliances(PERSONAS.find((p) => p.key === state.who)!.items);
  }, [state.who, state.picks]);

  const grid = gridForHoursOff(state.hours);
  const quote = useMemo(
    () => (state.step === 'result' && appliances.length > 0 ? buildQuote(appliances, {}, grid) : null),
    [state.step, appliances, grid],
  );

  const tracked = useRef('');
  useEffect(() => {
    if (!quote) return;
    // The visitor generated this quote, so the calculator shows them its prices.
    rememberQuote(quote.code);
    const key = `${quote.code}:${state.tier}`;
    if (tracked.current === key) return;
    tracked.current = key;
    const t = quote.tiers[state.tier];
    track('quote_generated', { quoteCode: quote.code, tier: t.label, amount: t.total.best, placement: 'find' });
  }, [quote, state.tier]);

  const stepNo = STEP_NUMBER[state.step];
  const persona = PERSONAS.find((p) => p.key === state.who);
  const baseName = persona?.kitName ?? CUSTOM_KIT_NAME;

  const pickCount = Object.values(state.picks).reduce((s, n) => s + n, 0);

  function chooseKit() {
    if (!quote) return;
    const t = quote.tiers[state.tier];
    track('cart_add', { quoteCode: quote.code, tier: t.label, amount: t.total.best, placement: 'find' });
    router.push(`/cart?q=${quote.payload}&tier=${state.tier}&grid=${quote.grid}`);
  }

  // ── Sticky bottom action per step
  let cta: ReactNode = null;
  if (state.step === 'pick') {
    cta = (
      <button
        type="button"
        disabled={pickCount === 0}
        onClick={() => go({ ...state, step: 'hours' })}
        className="btn btn-sun btn-lg w-full disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
      >
        Next: hours without light <ArrowRight className="w-5 h-5" aria-hidden="true" />
      </button>
    );
  } else if (state.step === 'hours') {
    cta = (
      <button
        type="button"
        onClick={() => {
          track('find_hours', { placement: `${state.hours}h` });
          go({ ...state, step: 'result' });
        }}
        className="btn btn-sun btn-lg w-full"
      >
        See my kit <ArrowRight className="w-5 h-5" aria-hidden="true" />
      </button>
    );
  } else if (state.step === 'result' && quote) {
    cta = (
      <button type="button" onClick={chooseKit} className="btn btn-sun btn-lg w-full">
        Choose this kit <ArrowRight className="w-5 h-5" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div className="min-h-dvh bg-sky text-ink">
      <a
        href="#find-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:px-3 focus:py-2 focus:rounded-control"
      >
        Skip to content
      </a>

      <div className={`mx-auto w-full px-4 ${state.step === 'result' ? 'max-w-5xl' : 'max-w-xl'}`}>
        {/* Top bar */}
        <header className="flex items-center justify-between h-16">
          <Link href="/" className="focus-ring rounded-control" aria-label="SolarBuilders.ng home">
            <Logo variant="horizontal" size="md" colorMode="light" />
          </Link>
          <Link
            href="/"
            aria-label="Close and go to the homepage"
            className="focus-ring w-11 h-11 -mr-2 rounded-full flex items-center justify-center text-ink-soft hover:text-ink hover:bg-white transition-colors duration-150"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </Link>
        </header>

        <div className={state.step === 'result' ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10' : ''}>
          <div>
            {/* Progress */}
            <div className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center mt-1">
              <button
                type="button"
                onClick={back}
                aria-label={state.step === 'who' ? 'Back to the homepage' : 'Back one step'}
                className="focus-ring w-11 h-11 rounded-control bg-white border border-line flex items-center justify-center hover:border-ink transition-colors duration-150"
              >
                <ArrowLeft className="w-5 h-5" aria-hidden="true" />
              </button>
              <p className="text-center text-sm font-semibold text-ink-soft" aria-live="polite">
                Step {stepNo} of 3
              </p>
              <span />
            </div>
            <div
              className="grid grid-cols-3 gap-1.5 mt-4"
              role="progressbar"
              aria-label="Progress"
              aria-valuemin={1}
              aria-valuemax={3}
              aria-valuenow={stepNo}
            >
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className={`h-1.5 rounded-full transition-colors duration-200 motion-reduce:transition-none ${
                    n <= stepNo ? 'bg-ink' : 'bg-line'
                  }`}
                />
              ))}
            </div>

            <main id="find-main" key={state.step} className="find-step pt-8 pb-36">
              {state.step === 'who' && (
                <WhoStep
                  headingRef={headingRef}
                  selected={state.who}
                  onSelect={(who) => setState((s) => ({ ...s, who }))}
                  onConfirm={choosePersona}
                />
              )}
              {state.step === 'pick' && (
                <PickStep
                  headingRef={headingRef}
                  picks={state.picks}
                  onChange={(picks) => go({ ...state, picks }, 'replace')}
                />
              )}
              {state.step === 'hours' && (
                <HoursStep
                  headingRef={headingRef}
                  hours={state.hours}
                  onSelect={(hours) => go({ ...state, hours }, 'replace')}
                />
              )}
              {state.step === 'result' && quote && (
                <ResultStep
                  headingRef={headingRef}
                  quote={quote}
                  tier={state.tier}
                  baseName={baseName}
                  hours={state.hours}
                  running={
                    persona
                      ? persona.items.map((i) => ({ id: i.id, qty: i.qty, label: i.label }))
                      : Object.entries(state.picks).map(([id, qty]) => ({
                          id,
                          qty,
                          label: PICK_APPLIANCES.find((a) => a.id === id)?.label,
                        }))
                  }
                  onTier={(tier) => go({ ...state, tier }, 'replace')}
                  onRestart={() => go({ ...INITIAL })}
                />
              )}
            </main>
          </div>

          {state.step === 'result' && quote && (
            <aside className="hidden lg:block pt-[6.375rem]">
              <InTheBox quote={quote} tier={state.tier} />
            </aside>
          )}
        </div>
      </div>

      {cta && (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur border-t border-line">
          <div
            className={`mx-auto w-full px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${
              state.step === 'result' ? 'max-w-5xl lg:pr-[24.5rem]' : 'max-w-xl'
            }`}
          >
            {cta}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// STEPS
// ─────────────────────────────────────────────────────────

interface HeadingProps {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}

function Question({ headingRef, children, sub }: HeadingProps & { children: ReactNode; sub?: string }) {
  return (
    <>
      <h1 ref={headingRef} tabIndex={-1} className="font-heading font-extrabold text-title outline-none">
        {children}
      </h1>
      {sub && <p className="text-muted mt-2">{sub}</p>}
    </>
  );
}

function WhoStep({
  headingRef,
  selected,
  onSelect,
  onConfirm,
}: HeadingProps & { selected: Who | null; onSelect: (w: Who) => void; onConfirm: (w: Who) => void }) {
  const tiles: { key: Who; label: string }[] = [
    ...PERSONAS.map((p) => ({ key: p.key as Who, label: p.label })),
    { key: 'pick', label: "I'll pick appliances" },
  ];
  const keys = tiles.map((t) => t.key);
  const radio = useRadioKeys(keys, selected, onSelect, onConfirm);
  const hint =
    selected === 'pick'
      ? 'Count your own appliances on the next screen.'
      : PERSONAS.find((p) => p.key === selected)?.hint;

  return (
    <>
      <Question headingRef={headingRef} sub="Pick the closest match.">
        What should it keep running?
      </Question>
      <div role="radiogroup" aria-label="Who is it for" className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
        {tiles.map((t, i) => {
          const Icon = PERSONA_ICON[t.key];
          const on = selected === t.key;
          return (
            <button
              key={t.key}
              ref={(el) => {
                radio.refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={radio.tabIndex(i)}
              onKeyDown={(e) => radio.onKeyDown(e, i)}
              onClick={() => onConfirm(t.key)}
              className={`${TILE} min-h-[7.5rem] p-4 flex flex-col justify-between gap-3 ${
                on ? 'bg-ink border-ink text-white' : 'bg-white border-line hover:border-ink'
              }`}
            >
              <span
                className={`w-10 h-10 rounded-full flex items-center justify-center ${on ? 'bg-sun text-ink' : 'bg-sun-wash text-sun-ink'}`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <span className="font-heading font-bold text-[15px] leading-tight">{t.label}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-4 min-h-[1.5rem] text-sm text-ink-soft" aria-live="polite">
        {hint ?? ''}
      </p>
    </>
  );
}

function PickStep({
  headingRef,
  picks,
  onChange,
}: HeadingProps & { picks: Record<string, number>; onChange: (p: Record<string, number>) => void }) {
  const set = (id: string, n: number) => {
    const next = { ...picks };
    if (n <= 0) delete next[id];
    else next[id] = Math.min(99, n);
    onChange(next);
  };
  return (
    <>
      <Question headingRef={headingRef} sub="Count what should work when there's no light.">
        What will you run?
      </Question>
      <ul className="mt-6 grid gap-2 sm:grid-cols-2">
        {PICK_APPLIANCES.map((a) => {
          const qty = picks[a.id] ?? 0;
          return (
            <li
              key={a.id}
              className={`flex items-center justify-between gap-3 rounded-card border bg-white px-4 py-3 transition-colors duration-150 ${
                qty > 0 ? 'border-ink' : 'border-line'
              }`}
            >
              <div className="min-w-0">
                <p className="font-heading font-bold text-[15px] leading-tight">{a.label}</p>
                <p className="text-sm text-muted">{presetWatts(a.id)}W each</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => set(a.id, qty - 1)}
                  disabled={qty === 0}
                  aria-label={`One fewer ${a.label}`}
                  className="focus-ring w-11 h-11 rounded-full border border-line flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:border-ink"
                >
                  <Minus className="w-4 h-4" aria-hidden="true" />
                </button>
                <span className="w-7 text-center font-heading font-bold tabular-nums" aria-live="polite">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => set(a.id, qty + 1)}
                  aria-label={`One more ${a.label}`}
                  className="focus-ring w-11 h-11 rounded-full bg-ink text-white flex items-center justify-center hover:bg-ink-soft"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-sm text-muted">
        More appliances?{' '}
        <Link href="/calculator" className="font-semibold text-ink underline underline-offset-4">
          Use the full calculator
        </Link>
      </p>
    </>
  );
}

function HoursStep({ headingRef, hours, onSelect }: HeadingProps & { hours: number; onSelect: (h: number) => void }) {
  const values = HOURS_OFF.map((h) => h.hours);
  const radio = useRadioKeys(values, hours, onSelect);
  const fuel = generatorFuelPerMonth(hours);
  return (
    <>
      <Question headingRef={headingRef} sub="In a normal day. We size the battery for it.">
        How long is light usually off?
      </Question>
      <div role="radiogroup" aria-label="Hours without light a day" className="grid grid-cols-3 gap-3 mt-6">
        {HOURS_OFF.map((h, i) => {
          const on = h.hours === hours;
          return (
            <button
              key={h.hours}
              ref={(el) => {
                radio.refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={radio.tabIndex(i)}
              onKeyDown={(e) => radio.onKeyDown(e, i)}
              onClick={() => onSelect(h.hours)}
              className={`${TILE} min-h-[6rem] px-2 py-4 flex flex-col items-center justify-center text-center ${
                on ? 'bg-ink border-ink text-white' : 'bg-white border-line hover:border-ink'
              }`}
            >
              <span className={`font-heading font-extrabold text-3xl tabular-nums ${on ? 'text-sun' : ''}`}>
                {h.hours}h
              </span>
              <span className={`text-xs mt-1 leading-tight text-center text-balance ${on ? 'text-white/80' : 'text-muted'}`}>{h.label}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-6 rounded-card bg-sun-wash border border-sun/40 p-5" aria-live="polite">
        <p className="text-sm font-semibold text-ink-soft">On a 3kVA generator, that&apos;s about</p>
        <p className="font-heading font-extrabold text-3xl mt-1 tabular-nums">
          {formatNaira(fuel)} <span className="text-base font-semibold text-ink-soft">a month</span>
        </p>
        <p className="text-sm text-ink-soft mt-1">in petrol alone.</p>
      </div>
    </>
  );
}

interface RunningItem {
  id: string;
  qty: number;
  label?: string;
}

function ResultStep({
  headingRef,
  quote,
  tier,
  baseName,
  hours,
  running,
  onTier,
  onRestart,
}: HeadingProps & {
  quote: ReturnType<typeof buildQuote>;
  tier: TierKey;
  baseName: string;
  hours: number;
  running: RunningItem[];
  onTier: (t: TierKey) => void;
  onRestart: () => void;
}) {
  const t = quote.tiers[tier];
  const fuel = generatorFuelPerMonth(hours);
  const isMatch = tier === 'standard';
  const exactHref = quoteUrl(quote, tier, '');
  const others = SIZE_ORDER.filter((k) => k !== tier);

  return (
    <>
      <p
        className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-heading font-bold ${
          isMatch ? 'bg-sun text-ink' : 'bg-white border border-line text-ink-soft'
        }`}
      >
        <Sparkles className="w-4 h-4" aria-hidden="true" />
        {isMatch ? 'Your match' : tier === 'budget' ? 'Smaller size' : 'Bigger size'}
      </p>
      <h1 ref={headingRef} tabIndex={-1} className="font-heading font-extrabold text-title mt-4 outline-none">
        {kitName(baseName, tier)}
      </h1>
      <p className="text-ink-soft mt-2">
        {t.inverterKva}kVA + {t.batteryKwh}kWh + {t.panelCount} panels · {t.tagline}
      </p>

      {/* Price card */}
      <section aria-label="Kit price" className="on-dark mt-6 rounded-panel bg-night text-white p-5 sm:p-7">
        <p className="text-sm text-white/70">Kit price</p>
        <p className="font-heading font-extrabold text-[2.5rem] leading-none tracking-tight mt-1 tabular-nums">
          {formatNaira(t.total.best)}
        </p>
        <p className="text-sm text-white/70 mt-2">+ installation, about {formatRange(t.labourRef)}</p>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="rounded-card bg-night-soft p-4">
            <p className="font-heading font-bold text-xl sm:text-2xl text-sun tabular-nums whitespace-nowrap">{t.inverterKva} kVA</p>
            <p className="text-xs text-white/70 mt-0.5">power at once</p>
          </div>
          <div className="rounded-card bg-night-soft p-4">
            <p className="font-heading font-bold text-xl sm:text-2xl text-sun tabular-nums whitespace-nowrap">{t.batteryKwh} kWh</p>
            <p className="text-xs text-white/70 mt-0.5">stored for the night</p>
          </div>
        </div>
        {/* The fuel figure is for a 3kVA generator (lib/energy-costs.ts) — only
            honest for kits that would otherwise need one that size or bigger. */}
        {t.inverterKva >= 3 && (
          <p className="mt-3 flex items-center gap-3 rounded-card bg-leaf px-4 py-3 text-sm font-semibold">
            <Fuel className="w-5 h-5 shrink-0" aria-hidden="true" />
            Replaces about {formatNaira(fuel)} a month of generator petrol
          </p>
        )}
      </section>

      {/* Keeps these running */}
      <section aria-labelledby="running-h" className="mt-4 rounded-card bg-white border border-line p-5">
        <h2 id="running-h" className="text-sm font-semibold text-muted">
          Keeps these running
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
          {running.map((r) => (
            <li key={r.id} className="flex items-start gap-2 text-[15px]">
              <Check className="w-4 h-4 mt-1 shrink-0 text-leaf" aria-hidden="true" />
              <span>
                {r.qty > 1 && <span className="tabular-nums">{r.qty}× </span>}
                {r.label ?? presetAppliance(r.id)?.name ?? r.id}
              </span>
            </li>
          ))}
        </ul>
        {tier === 'budget' && <p className="mt-3 text-sm text-muted">{t.note}</p>}
      </section>

      {/* Other sizes */}
      <section aria-labelledby="sizes-h" className="mt-8">
        <h2 id="sizes-h" className="font-heading font-bold text-lg">
          Other sizes
        </h2>
        <ul className="mt-3 grid gap-2">
          {others.map((k) => {
            const o = quote.tiers[k];
            return (
              <li key={k}>
                <button
                  type="button"
                  onClick={() => onTier(k)}
                  className="focus-ring w-full flex items-center justify-between gap-3 rounded-card bg-white border border-line px-4 py-3.5 text-left hover:border-ink transition-colors duration-150"
                >
                  <span className="min-w-0">
                    <span className="block font-heading font-bold">
                      {kitName(baseName, k)}
                      {k === 'standard' && <span className="ml-2 text-xs font-semibold text-sun-ink">Your match</span>}
                    </span>
                    <span className="block text-sm text-muted">
                      {o.inverterKva}kVA · {o.batteryKwh}kWh · {INVERTER_TIER_LABEL[o.inverterTier].toLowerCase()}
                    </span>
                  </span>
                  <span className="flex items-center gap-1 shrink-0 font-heading font-bold tabular-nums">
                    {formatNaira(o.total.best)}
                    <ChevronRight className="w-4 h-4 text-muted" aria-hidden="true" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-6 lg:hidden">
        <InTheBox quote={quote} tier={tier} compact />
      </div>

      <div className="mt-6 grid gap-3">
        <Link href={exactHref} className="btn btn-outline w-full">
          Get an exact quote for my house
        </Link>
        <button
          type="button"
          onClick={onRestart}
          className="focus-ring mx-auto text-sm font-semibold text-muted underline underline-offset-4 hover:text-ink min-h-[44px] px-3 rounded-control"
        >
          Start over
        </button>
      </div>
    </>
  );
}

function InTheBox({
  quote,
  tier,
  compact = false,
}: {
  quote: ReturnType<typeof buildQuote>;
  tier: TierKey;
  compact?: boolean;
}) {
  const t = quote.tiers[tier];
  const equipment = t.bom.filter((l) => l.group === 'equipment');
  const body = (
    <ul className="grid gap-3">
      {equipment.map((l) => (
        <li key={l.key} className="flex gap-3">
          <span className="w-10 h-10 rounded-control bg-sun-wash text-sun-ink flex items-center justify-center shrink-0 font-heading font-bold text-sm tabular-nums">
            {l.qty}×
          </span>
          <span className="min-w-0 text-sm">
            <span className="block font-semibold text-ink">{l.item}</span>
            <span className="block text-muted">{l.specBase ?? l.spec}</span>
          </span>
        </li>
      ))}
      <li className="flex gap-3">
        <span className="w-10 h-10 rounded-control bg-sky flex items-center justify-center shrink-0">
          <Package className="w-4 h-4 text-muted" aria-hidden="true" />
        </span>
        <span className="text-sm">
          <span className="block font-semibold text-ink">Mounting, cables & protection</span>
          <span className="block text-muted">Breakers, surge protection, changeover, earthing</span>
        </span>
      </li>
    </ul>
  );
  if (compact) {
    return (
      <details className="group rounded-card bg-white border border-line">
        <summary className="focus-ring cursor-pointer list-none flex items-center justify-between px-5 py-4 rounded-card font-heading font-bold">
          What&apos;s in the box
          <ChevronRight className="w-4 h-4 text-muted transition-transform duration-150 group-open:rotate-90 motion-reduce:transition-none" aria-hidden="true" />
        </summary>
        <div className="px-5 pb-5">{body}</div>
      </details>
    );
  }
  return (
    <section aria-labelledby="box-h" className="rounded-card bg-white border border-line p-5 shadow-soft">
      <h2 id="box-h" className="text-sm font-semibold text-muted mb-4">
        What&apos;s in the box
      </h2>
      {body}
      <p className="mt-4 pt-4 border-t border-line text-xs text-muted">
        Prices checked {PRICES_LAST_UPDATED_LABEL}.
      </p>
    </section>
  );
}
