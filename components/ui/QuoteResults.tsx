'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Download, Image as ImageIcon, Share2, MessageCircle, Info, SlidersHorizontal } from 'lucide-react';
import {
  type Quote,
  type QuoteOptions,
  type TierKey,
  type TierOptions,
  type QuoteAppliance,
  type BatteryType,
  buildQuote,
  formatNaira,
  formatNairaShort,
  formatRange,
  quoteToText,
  quoteUrl,
} from '@/lib/quote';
import { INVERTER_BRANDS, PRICES_LAST_UPDATED_LABEL, type InverterTier } from '@/lib/prices';
import { brandSlugByName } from '@/lib/brands';
import { SITE_URL } from '@/lib/site';
import { track } from '@/lib/track';
import QuoteContactModal from './QuoteContactModal';
import FinanceOptions from './FinanceOptions';

interface Props {
  appliances: QuoteAppliance[];
  initialTier?: TierKey;
  initialOptions?: QuoteOptions;
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
  const lines = fitting.map((a) => `${a.qty > 1 ? `${a.qty}× ` : ''}${a.name}`);
  if (tier === 'premium') lines.push('Room to add more appliances later');
  return lines;
}

/** "5kVA 48V hybrid — Growatt / Luxpower" with brand names linked to /brands/<slug> */
function SpecWithBrands({ base, brands, fallback }: { base?: string; brands?: string[]; fallback: string }) {
  if (!base || !brands?.length) return <>{fallback}</>;
  return (
    <>
      {base} —{' '}
      {brands.map((b, i) => {
        const slug = brandSlugByName(b);
        return (
          <span key={b}>
            {slug ? (
              <Link href={`/brands/${slug}`} className="text-amber-600 hover:underline" target="_blank">
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

export default function QuoteResults({ appliances, initialTier = 'standard', initialOptions = {} }: Props) {
  const [tier, setTier] = useState<TierKey>(initialTier);
  const [options, setOptions] = useState<QuoteOptions>(initialOptions);
  const [busy, setBusy] = useState<'pdf' | 'png' | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showContact, setShowContact] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const quote: Quote = useMemo(() => buildQuote(appliances, options), [appliances, options]);
  const t = quote.tiers[tier];
  const canRun = whatYouCanRun(tier, quote.appliances, quote.peakWatts);
  const fileBase = `SolarBuilders-${quote.code}-${t.label}`;
  const customised = !!(t.options.inverterTier || t.options.battery);

  const setTierOption = (patch: TierOptions) =>
    setOptions((prev) => ({ ...prev, [tier]: { ...(prev[tier] ?? {}), ...patch } }));
  const resetTierOptions = () => setOptions((prev) => ({ ...prev, [tier]: {} }));

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const renderCanvas = useCallback(async () => {
    const { default: html2canvas } = await import('html2canvas');
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
  }, [renderCanvas, fileBase, quote.code, t.label, t.total.best]);

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
    } catch {
      showToast("Couldn't create PDF — try the image");
    } finally {
      setBusy(null);
    }
  }, [renderCanvas, fileBase, quote.code, t.label, t.total.best]);

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
  }, [quote, tier]);

  return (
    <div>
      {/* Tier switcher */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {TIER_ORDER.map((k) => {
          const tq = quote.tiers[k];
          const active = k === tier;
          return (
            <button
              key={k}
              onClick={() => setTier(k)}
              className={`rounded-2xl px-3 py-3 text-left transition-all border-2 ${
                active ? 'border-[#F59E0B] bg-[#FEF3C7]' : 'border-[#E2E8F0] bg-white hover:border-[#F59E0B]/50'
              }`}
            >
              <p className="text-xs text-[#64748B] font-medium">
                {tq.emoji} {tq.label}
                {k === 'standard' && <span className="ml-1 text-[10px] bg-[#F59E0B] text-[#0A0F1E] px-1.5 py-0.5 rounded-full font-bold">Popular</span>}
              </p>
              <p className="font-heading font-extrabold text-[#0A0F1E] text-base sm:text-lg leading-tight mt-0.5">
                {formatNairaShort(tq.total.best)}
              </p>
              <p className="text-[10px] text-[#94A3B8]">{tq.inverterKva}kVA · {tq.batteryKwh}kWh · {tq.panelCount} panels</p>
            </button>
          );
        })}
      </div>

      {/* Customise picker */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-heading font-semibold text-[#64748B] uppercase tracking-widest flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Customise {t.label}
          </p>
          {customised && (
            <button onClick={resetTierOptions} className="text-[11px] text-[#94A3B8] hover:text-[#0A0F1E] underline underline-offset-2">
              Reset to default
            </button>
          )}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] text-[#64748B] mb-1.5">Inverter class</p>
            <div className="flex gap-1.5">
              {INVERTER_CLASSES.map((c) => {
                const active = t.inverterTier === c.key;
                return (
                  <button
                    key={c.key}
                    onClick={() => setTierOption({ inverterTier: c.key })}
                    title={INVERTER_BRANDS[c.key].join(' / ')}
                    className={`flex-1 rounded-full px-2 py-2 text-xs font-semibold border transition-colors ${
                      active ? 'bg-[#0A0F1E] text-white border-[#0A0F1E]' : 'bg-white text-[#0A0F1E] border-[#E2E8F0] hover:border-[#F59E0B]'
                    }`}
                  >
                    {c.label}
                    <span className={`block text-[10px] font-normal ${active ? 'text-[#94A3B8]' : 'text-[#94A3B8]'}`}>
                      {INVERTER_BRANDS[c.key].slice(0, 2).join(' / ')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-[11px] text-[#64748B] mb-1.5">Battery</p>
            <div className="flex gap-1.5">
              {BATTERY_TYPES.map((b) => {
                const active = t.batteryType === b.key;
                return (
                  <button
                    key={b.key}
                    onClick={() => setTierOption({ battery: b.key })}
                    className={`flex-1 rounded-full px-2 py-2 text-xs font-semibold border transition-colors ${
                      active ? 'bg-[#0A0F1E] text-white border-[#0A0F1E]' : 'bg-white text-[#0A0F1E] border-[#E2E8F0] hover:border-[#F59E0B]'
                    }`}
                  >
                    {b.label}
                    <span className="block text-[10px] font-normal text-[#94A3B8]">{b.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Exportable quote card ─────────────────────────── */}
      <div ref={cardRef} className="bg-white rounded-2xl border-2 border-[#F59E0B] p-6 sm:p-8" style={{ fontFamily: 'inherit' }}>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="font-heading font-extrabold text-[#0A0F1E] text-lg leading-none">
              Solar<span className="text-[#F59E0B]">Builders</span>.ng
            </p>
            <p className="text-[#64748B] text-xs mt-1">
              Solar system estimate · {t.label} tier{customised ? ' · customised' : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-[#94A3B8] font-semibold">Quote code</p>
            <p className="font-mono font-bold text-[#0A0F1E] text-base">{quote.code}</p>
            <p className="text-[10px] text-[#94A3B8]">{quote.generatedAt}</p>
          </div>
        </div>

        <div className="bg-[#0A0F1E] rounded-2xl p-5 mb-5 text-white">
          <p className="text-[#94A3B8] text-xs mb-1">Estimated total, installed</p>
          <p className="font-heading font-extrabold text-[#F59E0B] text-3xl sm:text-4xl leading-tight">{formatNaira(t.total.best)}</p>
          <p className="text-[#94A3B8] text-sm mt-1">
            Typical range {formatRange(t.total)} · {t.tagline}
          </p>
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10 text-center">
            <div>
              <p className="font-heading font-bold text-white text-lg leading-tight">{t.inverterKva}kVA</p>
              <p className="text-[10px] text-[#94A3B8]">{t.inverterBrands[0]}-class inverter</p>
            </div>
            <div>
              <p className="font-heading font-bold text-white text-lg leading-tight">{t.batteryKwh}kWh</p>
              <p className="text-[10px] text-[#94A3B8]">{t.batteryType === 'tubular' ? 'Tubular' : 'Lithium'} · ~{t.autonomyHours}h backup</p>
            </div>
            <div>
              <p className="font-heading font-bold text-white text-lg leading-tight">{t.panelCount}×{t.panelWatts}W</p>
              <p className="text-[10px] text-[#94A3B8]">{t.arrayKwp}kWp panels</p>
            </div>
          </div>
        </div>

        <p className="text-xs font-heading font-semibold text-[#64748B] uppercase tracking-widest mb-2">What you need to buy</p>
        <div>
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col className="w-[52%]" />
              <col className="w-[16%]" />
              <col className="w-[32%]" />
            </colgroup>
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-[#94A3B8] border-b border-[#E2E8F0]">
                <th className="text-left font-semibold py-2 px-1">Item</th>
                <th className="text-right font-semibold py-2 px-1">Qty</th>
                <th className="text-right font-semibold py-2 px-1">Est. price</th>
              </tr>
            </thead>
            <tbody>
              {t.bom.map((l) => (
                <tr key={l.key} className="border-b border-[#F1F5F9] align-top">
                  <td className="py-2.5 px-1">
                    <p className="font-semibold text-[#0A0F1E]">{l.item}</p>
                    <p className="text-[11px] text-[#64748B] leading-snug">
                      <SpecWithBrands base={l.specBase} brands={l.brands} fallback={l.spec} />
                    </p>
                  </td>
                  <td className="py-2.5 px-1 text-right text-[#0A0F1E] text-xs sm:text-sm">
                    {l.qty}
                    <span className="hidden sm:inline"> {l.unit}{l.qty > 1 && l.unit !== 'lot' ? (l.unit === 'battery' ? 'ies' : 's') : ''}</span>
                  </td>
                  <td className="py-2.5 px-1 text-right">
                    <p className="font-semibold text-[#0A0F1E] text-xs sm:text-sm">{formatNaira(l.lineCost.best)}</p>
                    <p className="text-[10px] text-[#94A3B8]">{formatRange(l.lineCost)}</p>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="pt-3 px-1 font-heading font-bold text-[#0A0F1E]" colSpan={2}>Estimated total</td>
                <td className="pt-3 px-1 text-right font-heading font-extrabold text-[#F59E0B] text-lg whitespace-nowrap">{formatNaira(t.total.best)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {t.batteryType === 'tubular' && (
          <p className="mt-3 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 leading-snug">
            Tubular batteries cost less today but last 2–4 years and only use 50% of their capacity. Over 10 years you will
            typically buy 3–5 banks — usually more than one lithium pack. We show it because many homes still start here.
          </p>
        )}

        <div className="grid sm:grid-cols-2 gap-4 mt-5">
          <div>
            <p className="text-xs font-heading font-semibold text-[#64748B] uppercase tracking-widest mb-2">Runs at once</p>
            <ul className="space-y-1">
              {canRun.map((line, i) => (
                <li key={i} className="text-sm text-[#0A0F1E] flex items-start gap-2">
                  <span className="text-[#059669] mt-0.5">{line.startsWith('Room') ? '+' : '✓'}</span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-heading font-semibold text-[#64748B] uppercase tracking-widest mb-2">Your load</p>
            <p className="text-sm text-[#0A0F1E]">{(quote.peakWatts / 1000).toFixed(2)} kW peak · {quote.dailyKwh} kWh/day</p>
            <p className="text-sm text-[#0A0F1E] mt-1">{quote.appliances.length} appliance types</p>
            <p className="text-xs text-[#64748B] mt-2 leading-snug">{t.note}</p>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-[#E2E8F0] flex gap-2">
          <Info className="w-4 h-4 text-[#94A3B8] flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#64748B] leading-snug">
            Prices are based on Nigerian market rates as of <strong>{PRICES_LAST_UPDATED_LABEL}</strong> (Lagos/Abuja retail
            and wholesale listings). Costs may have gone up or down since — brand, location, roof type and transport
            all change the final figure. This is an estimate to help you budget, not a binding quote. Send us code{' '}
            <strong className="font-mono">{quote.code}</strong> and we&apos;ll confirm current prices and connect you with a
            vetted installer.
          </p>
        </div>
        <p className="text-[10px] text-[#94A3B8] mt-3 text-center">
          {SITE_URL.replace(/^https?:\/\//, '')}/calculator · quote <span className="font-mono">{quote.code}</span>
        </p>
      </div>

      {/* ── Actions ───────────────────────────────────────── */}
      <div className="mt-5 space-y-3">
        <button
          onClick={() => {
            track('quote_form_open', { quoteCode: quote.code, tier: t.label, amount: t.total.best });
            setShowContact(true);
          }}
          className="w-full bg-[#25D366] hover:bg-[#22c55e] text-white py-4 rounded-full font-heading font-bold text-lg flex items-center justify-center gap-2 transition-colors"
        >
          <MessageCircle className="w-5 h-5" /> Get this system built
        </button>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={downloadPdf} disabled={busy !== null} className="flex items-center justify-center gap-1.5 border-2 border-[#E2E8F0] hover:border-[#F59E0B] text-[#0A0F1E] py-3 rounded-full text-sm font-semibold transition-colors disabled:opacity-50">
            <Download className="w-4 h-4" /> {busy === 'pdf' ? 'Saving…' : 'PDF'}
          </button>
          <button onClick={downloadPng} disabled={busy !== null} className="flex items-center justify-center gap-1.5 border-2 border-[#E2E8F0] hover:border-[#F59E0B] text-[#0A0F1E] py-3 rounded-full text-sm font-semibold transition-colors disabled:opacity-50">
            <ImageIcon className="w-4 h-4" /> {busy === 'png' ? 'Saving…' : 'Image'}
          </button>
          <button onClick={share} className="flex items-center justify-center gap-1.5 border-2 border-[#E2E8F0] hover:border-[#F59E0B] text-[#0A0F1E] py-3 rounded-full text-sm font-semibold transition-colors">
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>
      </div>

      <FinanceOptions amount={t.total.best} quoteCode={quote.code} tier={t.label} />

      {showContact && <QuoteContactModal quote={quote} tier={tier} onClose={() => setShowContact(false)} />}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#0A0F1E] text-white px-5 py-3 rounded-full text-sm font-medium shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
