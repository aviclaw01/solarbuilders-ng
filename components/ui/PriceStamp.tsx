import Link from 'next/link';
import { PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';

/** One line of price provenance: when we checked, and where to read how. */
export default function PriceStamp({ className = '' }: { className?: string }) {
  return (
    <p className={`text-sm text-muted ${className}`}>
      Prices checked {PRICES_LAST_UPDATED_LABEL} from named Nigerian sellers ·{' '}
      <Link href="/how-it-works#pricing" className="font-semibold text-ink underline underline-offset-4 hover:text-sun-ink">
        how we price
      </Link>
    </p>
  );
}
