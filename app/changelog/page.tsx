import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { CHANGELOG, CHANGELOG_TAG_META, changelogDate } from '@/lib/changelog';
import { SITE_URL } from '@/lib/site';
import { Sparkles, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Changelog — What We Shipped',
  description:
    'What changed on SolarBuilders.ng and when. New tools for customers, the partner programme opening up, and fixes — in plain words, newest first.',
  alternates: { canonical: `${SITE_URL}/changelog` },
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span className="text-amber-800 text-sm font-medium">Changelog</span>
          </div>
          <h1 className="font-heading text-4xl font-extrabold text-slate-900 mb-4">What changed, and when.</h1>
          <p className="text-slate-600 leading-relaxed">
            Everything here has already shipped. We write it in plain words because a changelog written to impress
            helps nobody — and because the site should be able to explain itself.
          </p>
        </div>

        <ol className="space-y-10">
          {CHANGELOG.map((entry) => {
            const meta = CHANGELOG_TAG_META[entry.tag];
            return (
              <li key={`${entry.date}-${entry.title}`} className="relative pl-8">
                <span className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-amber-400 ring-4 ring-amber-100" aria-hidden />
                <div className="flex items-center gap-3 mb-2">
                  <time dateTime={entry.date} className="text-slate-500 text-sm">
                    {changelogDate(entry.date)}
                  </time>
                  <span className={`text-xs font-medium border rounded-full px-2.5 py-0.5 ${meta.chip}`}>{meta.label}</span>
                </div>
                <h2 className="font-heading font-bold text-slate-900 text-lg mb-2">{entry.title}</h2>
                <p className="text-slate-600 text-sm leading-relaxed mb-3">{entry.description}</p>
                {entry.href && (
                  <Link
                    href={entry.href}
                    className="inline-flex items-center gap-1 text-slate-900 text-sm font-semibold underline underline-offset-4 hover:text-amber-600"
                  >
                    {entry.hrefLabel ?? 'See it'} <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </li>
            );
          })}
        </ol>

        <p className="text-slate-500 text-sm mt-16 leading-relaxed">
          Broken something? Found something we should fix first?{' '}
          <Link href="/contact" className="underline underline-offset-4 hover:text-slate-900">
            Tell us
          </Link>{' '}
          — changelogs are only honest if someone is reading.
        </p>
      </main>
      <Footer />
    </div>
  );
}
