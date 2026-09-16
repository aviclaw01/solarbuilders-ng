'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Banknote, ChevronDown, ExternalLink } from 'lucide-react';
import { GENERATOR_MONTHLY_BENCHMARK, repaymentOptions } from '@/lib/finance';
import { formatNaira, formatNairaShort } from '@/lib/quote';
import { track } from '@/lib/track';

interface Props {
  amount: number;
  quoteCode: string;
  tier: string;
}

export default function FinanceOptions({ amount, quoteCode, tier }: Props) {
  const [open, setOpen] = useState(false);
  const options = repaymentOptions(amount);
  const best = options[0];
  if (!best) return null;

  return (
    <div className="mt-3 bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
      <button
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) track('finance_open', { quoteCode, tier, amount });
        }}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-[#F8FAFC] transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
            <Banknote className="w-4 h-4 text-[#B45309]" />
          </span>
          <span>
            <span className="block font-heading font-bold text-[#0A0F1E] text-sm">
              Can&apos;t pay {formatNairaShort(amount)} at once?
            </span>
            <span className="block text-[#64748B] text-xs mt-0.5">
              From about {formatNaira(best.monthly)}/month over {best.months} months
            </span>
          </span>
        </span>
        <ChevronDown className={`w-4 h-4 text-[#94A3B8] flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-4 pb-4">
          <div className="space-y-2">
            {options.map((o) => (
              <div key={o.lender.slug} className="border border-[#E2E8F0] rounded-xl p-3">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div>
                    <p className="font-heading font-bold text-[#0A0F1E] text-sm">{o.lender.name}</p>
                    <p className="text-[11px] text-[#64748B]">
                      {o.lender.rateMinPctPerMonth}–{o.lender.rateMaxPctPerMonth}%/month · up to{' '}
                      {formatNairaShort(o.lender.maxAmount)} · {o.lender.termMinMonths}–{o.lender.termMaxMonths} months
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-heading font-extrabold text-[#B45309] text-base leading-tight">
                      {formatNaira(o.monthly)}
                    </p>
                    <p className="text-[10px] text-[#64748B]">/month × {o.months}</p>
                  </div>
                </div>
                <p className="text-[11px] text-[#64748B] leading-snug">{o.lender.note}</p>
                {o.shortfall > 0 && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 mt-2 leading-snug">
                    Covers {formatNairaShort(o.financed)} of this build — you would still need{' '}
                    {formatNairaShort(o.shortfall)} in cash.
                  </p>
                )}
                <a
                  href={o.lender.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  onClick={() => track('finance_click', { quoteCode, tier, amount, lender: o.lender.slug })}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:underline mt-2"
                >
                  Check your eligibility <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-[#64748B] leading-snug mt-3">
            For comparison, a Lagos home running a generator six hours a day spends around{' '}
            {formatNaira(GENERATOR_MONTHLY_BENCHMARK)} a month on fuel and servicing.
          </p>
          <p className="text-[11px] text-[#64748B] leading-snug mt-2">
            Illustration only, using each lender&apos;s lowest advertised rate and longest term, flat monthly interest on
            the full amount. Your rate depends on your own credit assessment, and a reducing-balance loan costs less.{' '}
            <strong>We are not a lender and we earn nothing from these links</strong> — confirm terms with the lender
            before you commit. <Link href="/blog/solar-loans-nigeria" className="text-amber-700 hover:underline">Full comparison</Link>.
          </p>
        </div>
      )}
    </div>
  );
}
