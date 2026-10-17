'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Download,
  Image as ImageIcon,
  Share2,
  MessageCircle,
  Info,
  SlidersHorizontal,
  ChevronDown,
  HardHat,
  Link2,
  Eye,
  Zap,
  BatteryCharging,
  Sun,
  Check,
  Plus,
  Phone,
} from 'lucide-react';
import {
  type BomLine,
  type GridSupply,
  type Quote,
  type QuoteOptions,
  type TierKey,
  type TierOptions,
  type QuoteAppliance,
  type BatteryType,
  BACKUP_HOURS,
  GRID_SUPPLY,
  GROWTH_ALLOWANCE,
  buildQuote,
  formatNaira,
  formatNairaShort,
  formatRange,
  quoteToText,
  quoteUrl,
} from '@/lib/quote';
import { INVERTER_BRANDS, PRICES_LAST_UPDATED_LABEL, type InverterTier } from '@/lib/prices';
import { BRAND_SLUG_BY_NAME } from '@/lib/brand-slugs';
import { SITE_URL } from '@/lib/site';
import { track, withCampaign } from '@/lib/track';
import WhatsAppLink from './WhatsAppLink';
import { rememberQuote } from '@/lib/quote-access';
import { useToast } from '@/components/ui/Toast';
import QuoteContactModal from './QuoteContactModal';
import BuildRequestModal from './BuildRequestModal';
import FinanceOptions from './FinanceOptions';
import SizingSheet from './SizingSheet';
import AdjustSystem from './AdjustSystem';
import type { LiteCatalogue } from '@/lib/catalogue-lite';

interface Props {
  appliances: QuoteAppliance[];
  initialTier?: TierKey;
  initialOptions?: QuoteOptions;
  grid: GridSupply;
  /** Hours the system must run with no grid; unset = sized by the grid band */
  backupHours?: number;
  onBackupHoursChange: (h: number) => void;
  /** priced brand listings, so a brand the buyer picks is priced off its own listing */
  catalogue?: LiteCatalogue;
  /** false → installer brief: everything except our prices */
  priced: boolean;
  /** true when this browser generated the quote; its codes are remembered */
  owner: boolean;
  /** viewer may see prices but is previewing the installer brief */
  onShowPrices?: () => void;
  /** Came from this brand's page — the main ask becomes a coded build request */
  brand?: { slug: string; name: string };
}

const TIER_ORDER: TierKey[] = ['budget', 'standard', 'premium'];
const INVERTER_CLASSES: { key: InverterTier; label: string }[] = [
  { key: 'budget', label: 'Budget' },
  { key: 'mid', label: 'Mid' },
  { key: 'premium', label: 'Premium' },
];
const BATTERY_TYPES: { key: BatteryType; label: string; hint: string }[] = [
  { key: 'lithium', label: 'Lithium', hint: '10+ yrs' },
  { key: 'tubular', label: 'Tubular', hint: '2–4 yrs, cheaper' },
];

/** What this tier can run at once — budget covers 60% of the load, greedy by size. */
function whatYouCanRun(tier: TierKey, appliances: QuoteAppliance[], peakWatts: number): string[] {
  let fitting = appliances;
  if (tier === 'budget') {
    let remaining = peakWatts * 0.6;
    fitting = [];
    for (const a of [...appliances].sort((x, y) => y.watts * y.qty - x.watts * x.qty)) {
      const load = a.watts * a.qty;
      if (load <= remaining) {
        fitting.push(a);
        remaining -= load;
      }
    }
  }
  return fitting.map((a) => `${a.qty > 1 ? `${a.qty}× ` : ''}${a.name}`);
}

/** "5kVA 48V hybrid — Growatt / Luxpower" with brand names linked to /brands/<slug> */
function SpecWithBrands({ base, brands, fallback }: { base?: string; brands?: string[]; fallback: string }) {
  if (!base || !brands?.length) return <>{fallback}</>;
  return (
    <>
      {base} —{' '}
      {brands.map((b, i) => {
        const slug = BRAND_SLUG_BY_NAME[b.toLowerCase()];
        return (
          <span key={b}>
            {slug ? (
              <Link href={`/brands/${slug}`} className="text-amber-700 hover:underline" target="_blank">
                {b}
              </Link>
            ) : (
              b
            )}
            {i < brands.length - 1 ? ' / ' : ''}
          </span>
        );
      })}
    </>
  );
}

function unitLabel(l: BomLine): string {
  if (l.qty === 1 || ['lot', 'm', 'kVA'].includes(l.unit)) return l.unit;
  if (l.unit === 'battery') return 'batteries';
  if (l.unit === 'box') return 'boxes';
  return `${l.unit}s`;
}

const GROUPS: { key: BomLine['group']; title: string }[] = [
  { key: 'equipment', title: 'Main equipment' },
  { key: 'bos', title: 'Protection, cabling & mounting' },
  { key: 'contingency', title: 'Allowance' },
];

function BackupPicker({ hours, grid, onChange }: { hours?: number; grid: GridSupply; onChange: (h: number) => void }) {
  return (
    <fieldset className="mb-5">
      <legend className="text-sm font-heading font-semibold text-slate-900 mb-1">How long must it run with no grid?</legend>
      {!hours && (
        <p className="text-xs text-slate-500 mb-2">
          Now sized for {GRID_SUPPLY.find((g) => g.key === grid)?.hint ?? 'some grid'}. Pick the hours you need.
        </p>
      )}
      <div className="grid grid-cols-5 gap-2 mt-2">
        {BACKUP_HOURS.map((h) => {
          const active = h === hours;
          return (
            <label
              key={h}
              className={`cursor-pointer rounded-xl border px-2 py-2.5 text-center transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-slate-900 ${
                active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900 hover:border-amber-400'
              }`}
            >
              <input type="radio" name="backup" value={h} checked={active} onChange={() => onChange(h)} className="sr-only" />
              <span className="block text-sm font-semibold">{h === 24 ? 'All day' : `${h}h`}</span>
              <span className={`block text-[10px] ${active ? 'text-slate-300' : 'text-slate-500'}`}>{h === 24 ? '24h' : 'no grid'}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function SystemStats({ t }: { t: Quote['tiers'][TierKey] }) {
  const stats = [
    { icon: Zap, value: `${t.inverterKva}kVA`, label: `${t.inverterBrands[0]}-class inverter` },
    { icon: BatteryCharging, value: `${t.batteryKwh}kWh`, label: `${t.batteryType === 'tubular' ? 'Tubular' : 'Lithium'} · ~${t.autonomyHours}h backup` },
    { icon: Sun, value: `${t.panelCount}×${t.panelWatts}W`, label: `${t.arrayKwp}kWp of panels` },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map(({ icon: Icon, value, label }) => (
        <div key={label} className="rounded-xl bg-white/5 px-2 py-3 text-center">
          <Icon className="w-4 h-4 mx-auto text-amber-400 mb-1" aria-hidden="true" />
          <p className="font-heading font-bold text-white text-base sm:text-lg leading-tight">{value}</p>
          <p className="text-[10px] sm:text-[11px] text-slate-400 leading-snug">{label}</p>
        </div>
      ))}
    </div>
  );
}

export default function QuoteResults({
  appliances,
  initialTier = 'standard',
  initialOptions = {},
  grid,
  backupHours,
  onBackupHoursChange,
  catalogue,
  priced,
  owner,
  onShowPrices,
  brand,
}: Props) {
  const [tier, setTier] = useState<TierKey>(initialTier);
  const [options, setOptions] = useState<QuoteOptions>(initialOptions);
  const [busy, setBusy] = useState<'pdf' | 'png' | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const { toast: showToast } = useToast();
  const [showContact, setShowContact] = useState(false);
  const [showBuild, setShowBuild] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  /**
   * Top of funnel. Every conversion ratio this site reports divides by
   * `quote_generated`, so it must count each quote once. The code changes with
   * the standard tier's options and the grid answer, so a Set counts each code
   * once and returning to one already seen does not count it again.
   */
  const trackedQuoteCodes = useRef<Set<string>>(new Set());

  const quote: Quote = useMemo(
    () => buildQuote(appliances, options, grid, backupHours, catalogue),
    [appliances, options, grid, backupHours, catalogue],
  );
  const t = quote.tiers[tier];

  useEffect(() => {
    if (owner) rememberQuote(quote.code);
  }, [owner, quote.code]);

  useEffect(() => {
    if (trackedQuoteCodes.current.has(quote.code)) return;
    trackedQuoteCodes.current.add(quote.code);
    track('quote_generated', { quoteCode: quote.code, tier: t.label, amount: priced ? t.total.best : 0 });
  }, [quote.code, t.label, t.total.best, priced]);

  const canRun = whatYouCanRun(tier, quote.appliances, quote.peakWatts);
  const fileBase = `SolarBuilders-${quote.code}-${t.label}${priced ? '' : '-brief'}`;
  const customised = Object.values(t.options).some((v) => v !== undefined);
  const briefUrl = `${quoteUrl(quote, tier, SITE_URL)}&view=brief`;
  /** The quote code lets the owner match the chat to the quote. */
  const waQuoteText =
    `Hi SolarBuilders, quote ${quote.code}: ${t.label} ${t.inverterKva}kVA, equipment ${formatNaira(t.total.best)} ` +
    `(prices checked ${PRICES_LAST_UPDATED_LABEL}). ${withCampaign(quoteUrl(quote, tier, SITE_URL), 'quote_card')}`;

  const setTierOption = (patch: TierOptions) =>
    setOptions((prev) => ({ ...prev, [tier]: { ...(prev[tier] ?? {}), ...patch } }));
  const resetTierOptions = () => setOptions((prev) => ({ ...prev, [tier]: {} }));

  const renderCanvas = useCallback(async () => {
    const { default: html2canvas } = await import('html2canvas-pro');
    if (!cardRef.current) throw new Error('no card');
    return html2canvas(cardRef.current, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
  }, []);

  const downloadPng = useCallback(async () => {
    setBusy('png');
    try {
      const canvas = await renderCanvas();
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `${fileBase}.png`;
      a.click();
      track('quote_download', { quoteCode: quote.code, tier: t.label, amount: t.total.best, format: 'png' });
      showToast('Image saved');
    } catch {
      showToast("Couldn't create image — try the PDF");
    } finally {
      setBusy(null);
    }
  }, [renderCanvas, fileBase, quote.code, t.label, t.total.best, showToast]);

  const downloadPdf = useCallback(async () => {
    setBusy('pdf');
    try {
      const [canvas, { jsPDF }] = await Promise.all([renderCanvas(), import('jspdf')]);
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgW = pageW - margin * 2;
      const imgH = (canvas.height * imgW) / canvas.width;
      const img = canvas.toDataURL('image/jpeg', 0.92);
      let y = margin;
      let remaining = imgH;
      while (remaining > 0) {
        pdf.addImage(img, 'JPEG', margin, y, imgW, imgH);
        remaining -= pageH - margin * 2;
        if (remaining > 0) {
          pdf.addPage();
          y -= pageH - margin * 2;
        }
      }
      pdf.save(`${fileBase}.pdf`);
      track('quote_download', { quoteCode: quote.code, tier: t.label, amount: t.total.best, format: 'pdf' });
      showToast('PDF saved');
    } catch (err) {
      console.error('[quote] PDF export failed:', err);
      showToast("Couldn't create PDF — try the image");
    } finally {
      setBusy(null);
    }
  }, [renderCanvas, fileBase, quote.code, t.label, t.total.best, showToast]);

  const share = useCallback(async () => {
    track('quote_share', { quoteCode: quote.code, tier: quote.tiers[tier].label });
    const text = quoteToText(quote, tier, SITE_URL);
    const url = quoteUrl(quote, tier, SITE_URL);
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: `Solar quote ${quote.code}`, text, url });
        return;
      } catch {
        /* fall through */
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast('Quote copied to clipboard');
    } catch {
      showToast("Couldn't copy");
    }
  }, [quote, tier, showToast]);

  const copyInstallerLink = useCallback(async () => {
    track('quote_share', { quoteCode: quote.code, tier: t.label, format: 'installer_brief' });
    const text =
      `Solar job brief ${quote.code}: ${t.inverterKva}kVA inverter, ${t.batteryKwh}kWh ${t.batteryType} battery, ` +
      `${t.panelCount}×${t.panelWatts}W panels. Full list (no prices) — please send your quote:\n${briefUrl}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Installer link copied — it shows the job, not our prices');
    } catch {
      showToast("Couldn't copy");
    }
  }, [quote.code, t, briefUrl, showToast]);

  const lines = t.bom.filter((l) => l.group !== 'excluded');

  return (
    <div>
      {!priced && (
        <div className="mb-5 rounded-2xl border border-sky-200 bg-sky-50 p-4 flex gap-3">
          <HardHat className="w-5 h-5 text-sky-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm text-sky-900">
            <p className="font-semibold">Installer brief — prices hidden</p>
            <p className="text-sky-800 mt-0.5">
              This is what the customer needs. Please price it yourself and send your quote quoting code{' '}
              <span className="font-mono font-semibold">{quote.code}</span>.
            </p>
            {onShowPrices && (
              <button onClick={onShowPrices} className="mt-2 inline-flex items-center gap-1 text-sky-900 font-semibold underline underline-offset-2">
                <Eye className="w-4 h-4" /> Show my prices
              </button>
            )}
          </div>
        </div>
      )}

      {priced && <BackupPicker hours={backupHours} grid={grid} onChange={onBackupHoursChange} />}

      {/* Tier switcher */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {TIER_ORDER.map((k) => {
          const tq = quote.tiers[k];
          const active = k === tier;
          return (
            <button
              key={k}
              onClick={() => setTier(k)}
              aria-pressed={active}
              className={`relative rounded-2xl px-3 py-3 text-left transition-all border ${
                active ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500' : 'border-slate-200 bg-white hover:border-amber-300'
              }`}
            >
              {k === 'standard' && (
                <span className="absolute -top-2 right-2 text-[10px] bg-amber-500 text-slate-900 px-1.5 py-0.5 rounded-full font-bold">
                  Recommended
                </span>
              )}
              <p className="text-xs text-slate-500 font-medium">{tq.label}</p>
              <p className="font-heading font-extrabold text-slate-900 text-base sm:text-lg leading-tight mt-0.5">
                {priced ? formatNairaShort(tq.total.best) : `${tq.inverterKva}kVA`}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-500">
                {priced ? `${tq.inverterKva}kVA · ` : ''}
                {tq.batteryKwh}kWh · {tq.panelCount} panels
              </p>
            </button>
          );
        })}
      </div>

      {priced && <AdjustSystem t={t} catalogue={catalogue} onChange={setTierOption} onReset={customised ? resetTierOptions : undefined} />}

      {/* Class and battery type — tucked away: most people should not need it */}
      {priced && (
        <div className="mb-5">
          <button
            onClick={() => setCustomOpen((o) => !o)}
            aria-expanded={customOpen}
            className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
          >
            <SlidersHorizontal className="w-4 h-4" /> Change inverter class or battery type
            <ChevronDown className={`w-4 h-4 transition-transform ${customOpen ? 'rotate-180' : ''}`} />
          </button>
          {customOpen && (
            <div className="mt-3 bg-sky border border-slate-200 rounded-2xl p-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] text-slate-500 mb-1.5">Inverter class</p>
                  <div className="flex gap-1.5">
                    {INVERTER_CLASSES.map((c) => {
                      const active = t.inverterTier === c.key;
                      return (
                        <button
                          key={c.key}
                          onClick={() => setTierOption({ inverterTier: c.key })}
                          className={`flex-1 rounded-xl px-2 py-2 text-xs font-semibold border transition-colors ${
                            active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-900 border-slate-200 hover:border-amber-400'
                          }`}
                        >
                          {c.label}
                          <span className={`block text-[10px] font-normal ${active ? 'text-slate-300' : 'text-slate-500'}`}>
                            {INVERTER_BRANDS[c.key].slice(0, 2).join(' / ')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 mb-1.5">Battery</p>
                  <div className="flex gap-1.5">
                    {BATTERY_TYPES.map((b) => {
                      const active = t.batteryType === b.key;
                      return (
                        <button
                          key={b.key}
                          onClick={() => setTierOption({ battery: b.key })}
                          className={`flex-1 rounded-xl px-2 py-2 text-xs font-semibold border transition-colors ${
                            active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-900 border-slate-200 hover:border-amber-400'
                          }`}
                        >
                          {b.label}
                          <span className={`block text-[10px] font-normal ${active ? 'text-slate-300' : 'text-slate-500'}`}>{b.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              {customised && (
                <button onClick={resetTierOptions} className="mt-3 text-[11px] text-slate-500 hover:text-slate-900 underline underline-offset-2">
                  Reset to recommended
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Exportable card ─────────────────────────────── */}
      <div ref={cardRef} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-8">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="font-heading font-extrabold text-slate-900 text-lg leading-none">
              Solar<span className="text-amber-700">Builders</span>.ng
            </p>
            <p className="text-slate-500 text-xs mt-1">
              {priced ? 'System estimate' : 'Job brief for installers'} · {t.label}
              {customised ? ' · customised' : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Quote code</p>
            <p className="font-mono font-bold text-slate-900 text-base">{quote.code}</p>
            <p className="text-[10px] text-slate-500">{quote.generatedAt}</p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-5 mb-6 text-white">
          {priced ? (
            <>
              <p className="text-slate-400 text-xs mb-1">Equipment &amp; materials, before installation</p>
              <p className="font-heading font-extrabold text-amber-400 text-3xl sm:text-4xl leading-tight">{formatNaira(t.total.best)}</p>
              <p className="text-slate-400 text-sm mt-1 mb-4">Typical range {formatRange(t.total)}</p>
            </>
          ) : (
            <p className="text-slate-300 text-sm mb-4">Recommended system ({t.label})</p>
          )}
          <SystemStats t={t} />
        </div>

        <p className="text-xs font-heading font-semibold text-slate-500 uppercase tracking-widest mb-2">Bill of materials</p>
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col className={priced ? 'w-[52%]' : 'w-[78%]'} />
            <col className={priced ? 'w-[16%]' : 'w-[22%]'} />
            {priced && <col className="w-[32%]" />}
          </colgroup>
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <th className="text-left font-semibold py-2 px-1">Item</th>
              <th className="text-right font-semibold py-2 px-1">Qty</th>
              {priced && <th className="text-right font-semibold py-2 px-1">Est. price</th>}
            </tr>
          </thead>
          {GROUPS.map((g) => {
            const rows = lines.filter((l) => l.group === g.key);
            if (!rows.length || (!priced && g.key === 'contingency')) return null;
            return (
              <tbody key={g.key}>
                <tr>
                  <td colSpan={priced ? 3 : 2} className="pt-4 pb-1 px-1 text-[11px] font-semibold text-amber-700">
                    {g.title}
                  </td>
                </tr>
                {rows.map((l) => (
                  <tr key={l.key} className="border-b border-slate-100 align-top">
                    <td className="py-2.5 px-1">
                      <p className="font-semibold text-slate-900">{l.item}</p>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        <SpecWithBrands base={l.specBase} brands={l.brands} fallback={l.spec} />
                      </p>
                    </td>
                    <td className="py-2.5 px-1 text-right text-slate-900 text-xs sm:text-sm">
                      {l.group === 'contingency' ? '—' : (
                        <>
                          {l.qty}
                          <span className="hidden sm:inline"> {unitLabel(l)}</span>
                        </>
                      )}
                    </td>
                    {priced && (
                      <td className="py-2.5 px-1 text-right">
                        <p className="font-semibold text-slate-900 text-xs sm:text-sm">{formatNaira(l.lineCost.best)}</p>
                        <p className="text-[10px] text-slate-500">{formatRange(l.lineCost)}</p>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            );
          })}
          {priced && (
            <tfoot>
              <tr>
                <td className="pt-3 px-1 font-heading font-bold text-slate-900" colSpan={2}>
                  Estimated total
                  <span className="block text-[11px] font-normal text-slate-500">excludes installation</span>
                </td>
                <td className="pt-3 px-1 text-right font-heading font-extrabold text-amber-700 text-lg whitespace-nowrap align-top">
                  {formatNaira(t.total.best)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>

        <div className="mt-4 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 flex gap-2.5">
          <HardHat className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-[12px] text-slate-600 leading-snug">
            <strong className="text-slate-900">Installation &amp; workmanship are not included.</strong>{' '}
            {priced
              ? `Your installer prices their own labour, transport and any site work. As a guide, Nigerian installers typically charge ${formatRange(t.labourRef)} for a system this size.`
              : 'Please include labour, transport and any site work in your quote.'}
          </p>
        </div>

        {t.batteryType === 'tubular' && (
          <p className="mt-3 text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 leading-snug">
            Tubular batteries cost less today but last 2–4 years and only use 50% of their capacity. Over 10 years you will
            typically buy 3–5 banks — usually more than one lithium pack.
          </p>
        )}

        <div className="grid sm:grid-cols-2 gap-5 mt-6">
          <div>
            <p className="text-xs font-heading font-semibold text-slate-500 uppercase tracking-widest mb-2">Runs at once</p>
            <ul className="space-y-1">
              {canRun.map((line, i) => (
                <li key={i} className="text-sm text-slate-900 flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  {line}
                </li>
              ))}
              {tier !== 'budget' && (
                <li className="text-sm text-slate-900 flex items-start gap-2">
                  <Plus className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  {tier === 'premium' ? 'Plenty of room to add appliances later' : 'About 20% spare for appliances you add later'}
                </li>
              )}
            </ul>
          </div>
          <div>
            <p className="text-xs font-heading font-semibold text-slate-500 uppercase tracking-widest mb-2">Load</p>
            <p className="text-sm text-slate-900">
              Stated: {(quote.peakWatts / 1000).toFixed(2)}kW peak · {quote.dailyKwh}kWh/day
            </p>
            <p className="text-sm text-slate-900 mt-1">
              Designed for: {(quote.designPeakWatts / 1000).toFixed(2)}kW · {quote.designDailyKwh}kWh/day
            </p>
            <p className="text-sm text-slate-900 mt-1">
              {quote.backupHours
                ? `Backup: ${quote.backupHours}h with no grid`
                : `Grid: ${GRID_SUPPLY.find((g) => g.key === quote.grid)?.label} (${GRID_SUPPLY.find((g) => g.key === quote.grid)?.hint})`}
            </p>
            <p className="text-xs text-slate-500 mt-2 leading-snug">
              We treat your list as the minimum and design {Math.round((GROWTH_ALLOWANCE - 1) * 100)}% above it, with the
              inverter never loaded past 80%. {t.note}
            </p>
          </div>
        </div>

        <SizingSheet quote={quote} t={t} />

        {!priced && (
          <div className="mt-6">
            <p className="text-xs font-heading font-semibold text-slate-500 uppercase tracking-widest mb-2">Appliances</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="text-left font-semibold py-1.5 px-1">Appliance</th>
                  <th className="text-right font-semibold py-1.5 px-1">Qty</th>
                  <th className="text-right font-semibold py-1.5 px-1">Watts</th>
                  <th className="text-right font-semibold py-1.5 px-1">Hours/day</th>
                </tr>
              </thead>
              <tbody>
                {quote.appliances.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100">
                    <td className="py-1.5 px-1 text-slate-900">{a.name}</td>
                    <td className="py-1.5 px-1 text-right">{a.qty}</td>
                    <td className="py-1.5 px-1 text-right">{a.watts}</td>
                    <td className="py-1.5 px-1 text-right">{a.hoursPerDay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {priced && (
          <div className="mt-6 pt-4 border-t border-slate-200 flex gap-2">
            <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-[11px] text-slate-500 leading-snug">
              Prices are Nigerian market rates as of <strong>{PRICES_LAST_UPDATED_LABEL}</strong> and{' '}
              <strong>may have changed</strong> — naira rates and stock move weekly. If an installer&apos;s figure comes in a
              bit above or below ours, that is normal: brand, location, roof and cable runs all shift it. Use this to budget
              and to check that what you&apos;re offered is complete, not as a binding price.
            </p>
          </div>
        )}
        <p className="text-[10px] text-slate-500 mt-3 text-center">
          {SITE_URL.replace(/^https?:\/\//, '')} · quote <span className="font-mono">{quote.code}</span>
        </p>
      </div>

      {/* ── Actions ───────────────────────────────────────── */}
      {priced ? (
        <div className="mt-5 space-y-3">
          {/* WhatsApp first: most buyers would rather chat than fill a form, and
              the whatsapp_click row carrying the quote code is the lead record.
              /find proved this pattern. */}
          {brand ? (
            <button
              onClick={() => {
                track('quote_form_open', { quoteCode: quote.code, tier: t.label, amount: t.total.best, placement: `brand_build:${brand.slug}` });
                setShowBuild(true);
              }}
              className="w-full bg-[#25D366] hover:brightness-95 text-ink py-4 rounded-full font-heading font-bold text-lg flex items-center justify-center gap-2 transition"
            >
              <MessageCircle className="w-5 h-5" aria-hidden="true" /> Get my system built
            </button>
          ) : (
            <WhatsAppLink
              text={waQuoteText}
              placement="quote_card"
              quoteCode={quote.code}
              className="w-full bg-[#25D366] hover:brightness-95 text-ink py-4 rounded-full font-heading font-bold text-lg flex items-center justify-center gap-2 transition"
            >
              <MessageCircle className="w-5 h-5" aria-hidden="true" /> Send this quote on WhatsApp
            </WhatsAppLink>
          )}
          <p className="text-[12px] text-slate-600 text-center -mt-1">
            Free. Nothing to pay now. A person replies on WhatsApp.
          </p>
          <button
            onClick={() => {
              track('quote_form_open', { quoteCode: quote.code, tier: t.label, amount: t.total.best });
              setShowContact(true);
            }}
            className="w-full flex items-center justify-center gap-2 border border-slate-300 hover:border-slate-900 text-slate-900 py-3 rounded-full text-sm font-semibold transition-colors"
          >
            <Phone className="w-4 h-4" aria-hidden="true" /> Or get a call back
          </button>
          <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 pt-1">
            <button onClick={copyInstallerLink} className="inline-flex items-center gap-1 px-2.5 min-h-[40px] rounded-full text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-white transition-colors">
              <Link2 className="w-3.5 h-3.5" aria-hidden="true" /> Copy installer link
            </button>
            <button onClick={downloadPdf} disabled={busy !== null} className="inline-flex items-center gap-1 px-2.5 min-h-[40px] rounded-full text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-white transition-colors disabled:opacity-50">
              <Download className="w-3.5 h-3.5" aria-hidden="true" /> {busy === 'pdf' ? 'Saving…' : 'PDF'}
            </button>
            <button onClick={downloadPng} disabled={busy !== null} className="inline-flex items-center gap-1 px-2.5 min-h-[40px] rounded-full text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-white transition-colors disabled:opacity-50">
              <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" /> {busy === 'png' ? 'Saving…' : 'Image'}
            </button>
            <button onClick={share} className="inline-flex items-center gap-1 px-2.5 min-h-[40px] rounded-full text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-white transition-colors">
              <Share2 className="w-3.5 h-3.5" aria-hidden="true" /> Share
            </button>
          </div>
          <p className="text-[11px] text-slate-500 text-center">
            Want independent quotes? The installer link shows installers what you need, not our prices, so you can
            compare their figure with ours.
          </p>
          <FinanceOptions amount={t.total.best} quoteCode={quote.code} tier={t.label} />
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button onClick={downloadPdf} disabled={busy !== null} className="flex items-center justify-center gap-1.5 border border-slate-200 hover:border-amber-400 text-slate-900 py-3 rounded-full text-sm font-semibold transition-colors disabled:opacity-50">
            <Download className="w-4 h-4" /> {busy === 'pdf' ? 'Saving…' : 'Download PDF'}
          </button>
          <Link href="/calculator" className="flex items-center justify-center gap-1.5 bg-sun hover:bg-sun-deep text-ink py-3 rounded-full text-sm font-semibold transition-colors">
            Price my own home
          </Link>
        </div>
      )}

      {showContact && <QuoteContactModal quote={quote} tier={tier} onClose={() => setShowContact(false)} />}
      {showBuild && brand && <BuildRequestModal quote={quote} tier={tier} brand={brand} onClose={() => setShowBuild(false)} />}
    </div>
  );
}
