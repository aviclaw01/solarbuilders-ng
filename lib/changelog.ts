/**
 * The /changelog content, as data.
 *
 * One entry per shipped change the public can actually notice. Newest first —
 * the page renders this array in order. An entry that has shipped goes here the
 * moment it is live, never before: this page is a promise only in the past
 * tense. The date format is intentionally plain (month + day), and dates are
 * strings, not Date objects, so this file stays importable from anywhere.
 */
export interface ChangelogEntry {
  /** ISO date (yyyy-mm-dd) — the day it shipped. */
  date: string;
  title: string;
  /** One short paragraph, plain words, no jargon. */
  description: string;
  /** What kind of thing changed — shown as a chip. */
  tag: 'new' | 'improvement' | 'fix';
  /** Optional link — usually the page that changed. */
  href?: string;
  hrefLabel?: string;
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-09-16',
    title: 'Partner applications are open',
    description:
      'Installers, vendors and manufacturers can now apply to work with us in one four-step form. Every application gets a reference number you can use to check its status at any time.',
    tag: 'new',
    href: '/for-builders',
    hrefLabel: 'Apply to work with us',
  },
  {
    date: '2026-09-16',
    title: 'Check your application status',
    description:
      'Applied to work with us? Enter your reference and the email you applied with, and see exactly where your application is — received, under review, or approved — without calling anyone.',
    tag: 'new',
    href: '/partners/status',
    hrefLabel: 'Check an application',
  },
  {
    date: '2026-09-16',
    title: 'The verified-partner directory is live',
    description:
      'A public directory of the partners who passed our checks — CAC, past installs, references we called, a written warranty. Nobody buys a place on it, and a badge is re-checked yearly.',
    tag: 'new',
    href: '/partners',
    hrefLabel: 'See verified partners',
  },
  {
    date: '2026-09-15',
    title: 'How we vet, in public',
    description:
      'The four checks every installer passes before we put them on a customer build — and what we do on every job from price confirmation to commissioning — written down in one place.',
    tag: 'improvement',
    href: '/verified',
    hrefLabel: 'Read how we vet',
  },
];

export const CHANGELOG_TAG_META: Record<ChangelogEntry['tag'], { label: string; chip: string }> = {
  new: { label: 'New', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  improvement: { label: 'Improvement', chip: 'bg-sky-50 text-sky-700 border-sky-200' },
  fix: { label: 'Fix', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
};

/** A human date from the ISO string, e.g. "16 September 2026". */
export function changelogDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
