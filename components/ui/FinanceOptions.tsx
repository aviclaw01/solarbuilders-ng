'use client';

import { Banknote, MessageCircle } from 'lucide-react';
import { formatNaira } from '@/lib/quote';
import WhatsAppLink from './WhatsAppLink';

interface Props {
  amount: number;
  quoteCode: string;
  tier: string;
}

/**
 * Pay-in-parts prompt.
 *
 * This used to show monthly repayments and lender terms (lib/finance.ts). None
 * of them had a primary source in research/ and no lender is a partner, so a
 * naira instalment figure here would be invented. Until a real financing
 * partner exists, the honest offer is: ask us, and we tell you what is
 * actually available today. Do not reintroduce monthly figures without a
 * sourced partner agreement.
 */
export default function FinanceOptions({ amount, quoteCode, tier }: Props) {
  const text =
    `Hi SolarBuilders, I'd like to pay in parts for quote ${quoteCode} (${tier}, equipment ${formatNaira(amount)}). ` +
    `What instalment options are available right now?`;

  return (
    <WhatsAppLink
      text={text}
      placement="finance"
      quoteCode={quoteCode}
      className="mt-3 flex items-center gap-3 bg-white border border-[#E2E8F0] rounded-2xl p-4 text-left hover:bg-[#F8FAFC] transition-colors"
    >
      <span className="w-9 h-9 rounded-full bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
        <Banknote className="w-4 h-4 text-[#B45309]" aria-hidden="true" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-heading font-bold text-[#0A0F1E] text-sm">Want to pay in parts?</span>
        <span className="block text-[#64748B] text-xs mt-0.5">Ask on WhatsApp for current instalment options</span>
      </span>
      <MessageCircle className="w-4 h-4 text-emerald-700 flex-shrink-0" aria-hidden="true" />
    </WhatsAppLink>
  );
}
