import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import type { PublicPartnerProfile } from '@/lib/partners';

/**
 * The verified badge (L2). One component, used on the directory, the profile and
 * anywhere else a partner is named, so the claim is always the same and always
 * traceable to the checks that were actually done. Links to the profile, which
 * is where the evidence lives — the badge itself claims nothing.
 */
export default function VerifiedBadge({
  partner,
  linked = true,
  size = 'md',
}: {
  partner: Pick<PublicPartnerProfile, 'slug' | 'name' | 'scope' | 'verifiedUntil'>;
  linked?: boolean;
  size?: 'sm' | 'md';
}) {
  const iconCls = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const textCls = size === 'sm' ? 'text-[11px]' : 'text-xs';
  const inner = (
    <span
      className={`inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full px-2.5 py-0.5 font-medium ${textCls}`}
      title={`Verified by SolarBuilders.ng: ${partner.scope}`}
    >
      <ShieldCheck className={`${iconCls} text-emerald-600`} />
      Verified
    </span>
  );
  if (!linked) return inner;
  return (
    <Link href={`/partners/${partner.slug}`} className="inline-flex hover:opacity-80 transition-opacity" aria-label={`${partner.name} — verified partner profile`}>
      {inner}
    </Link>
  );
}
