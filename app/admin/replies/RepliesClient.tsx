'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, Search, Sparkles, X } from 'lucide-react';
import {
  HOUSE_RULES,
  REPLY_CARDS,
  SECTIONS,
  cardHaystack,
  matchesQuery,
  type ReplyCard,
  type SectionId,
} from '@/lib/reply-playbook';

const INDEXED = REPLY_CARDS.map((c) => ({ card: c, hay: cardHaystack(c) }));

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Wraps each query word in <mark> so the matching reply stands out. */
function Hl({ text, words }: { text: string; words: string[] }) {
  if (words.length === 0) return <>{text}</>;
  const re = new RegExp(`(${words.map(escapeRe).join('|')})`, 'gi');
  const parts = text.split(re);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="bg-amber-200/70 text-inherit rounded-sm px-0.5">
            {p}
          </mark>
        ) : (
          p
        ),
      )}
    </>
  );
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older Android WebViews: fall back to a hidden textarea.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<'idle' | 'ok' | 'fail'>('idle');
  return (
    <button
      type="button"
      onClick={async () => {
        setState((await copyText(text)) ? 'ok' : 'fail');
        setTimeout(() => setState('idle'), 1600);
      }}
      className={`shrink-0 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
        state === 'ok'
          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
          : 'border-slate-200 bg-white text-slate-700 hover:border-amber-400'
      }`}
    >
      {state === 'ok' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {state === 'ok' ? 'Copied' : state === 'fail' ? 'Select & copy' : 'Copy'}
    </button>
  );
}

function Card({ card, words }: { card: ReplyCard; words: string[] }) {
  return (
    <section id={card.id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3 scroll-mt-28">
      <header className="flex flex-wrap items-baseline gap-2">
        <h3 className="font-heading font-bold text-slate-900">
          <Hl text={card.title} words={words} />
        </h3>
        {card.chip && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">{card.chip}</span>
        )}
      </header>
      {card.context && (
        <p className="text-sm text-slate-500">
          <Hl text={card.context} words={words} />
        </p>
      )}

      <div className="space-y-2">
        {card.templates.map((t) => (
          <div key={t.label} className="rounded-xl rounded-bl-sm bg-emerald-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">{t.label}</p>
              <CopyButton text={t.text} />
            </div>
            <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-900">
              <Hl text={t.text} words={words} />
            </p>
          </div>
        ))}
      </div>

      {card.expect && card.expect.length > 0 && (
        <dl className="text-sm divide-y divide-dashed divide-slate-200 border-t border-dashed border-slate-200">
          {card.expect.map((e) => (
            <div key={e.if} className="grid gap-1 py-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] sm:gap-3">
              <dt className="font-semibold text-slate-800">
                <Hl text={e.if} words={words} />
              </dt>
              <dd className="text-slate-600">
                <Hl text={e.then} words={words} />
              </dd>
            </div>
          ))}
        </dl>
      )}
      {card.note && (
        <p className="text-sm text-slate-500 italic">
          <Hl text={card.note} words={words} />
        </p>
      )}
    </section>
  );
}

/** Placeholder for the AI drafter. Wired later; disabled on purpose for now. */
function AiDraftPanel() {
  return (
    <section aria-labelledby="ai-title" className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-slate-400" />
        <h2 id="ai-title" className="font-heading font-bold text-slate-500">
          Draft a reply with AI
        </h2>
        <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Coming soon</span>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Paste the customer&rsquo;s message and get a draft in our house style. Not switched on yet — use the search above.
      </p>
      <textarea
        disabled
        rows={3}
        placeholder="Paste the message you received…"
        className="mt-3 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-white/60 p-3 text-sm text-slate-400"
      />
      <button
        type="button"
        disabled
        className="mt-2 cursor-not-allowed rounded-xl bg-slate-300 px-4 py-2 text-sm font-semibold text-white"
      >
        Draft reply
      </button>
    </section>
  );
}

export default function RepliesClient() {
  const [query, setQuery] = useState('');
  const [section, setSection] = useState<SectionId | 'all'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" focuses search, like most search-first tools.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key === '/' && t?.tagName !== 'INPUT' && t?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const words = useMemo(() => query.toLowerCase().split(/\s+/).filter(Boolean), [query]);
  const results = useMemo(
    () =>
      INDEXED.filter(({ card, hay }) => (section === 'all' || card.section === section) && matchesQuery(hay, query)).map(
        (x) => x.card,
      ),
    [query, section],
  );

  return (
    <div className="space-y-6">
      <div className="sticky top-0 lg:top-0 z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-slate-50/95 backdrop-blur border-b border-slate-200">
        <label className="relative block">
          <span className="sr-only">Search replies</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search: price, warranty, Abuja, installer, repair…  (press /)"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-9 text-[15px] focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
            autoFocus
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </label>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {[{ id: 'all' as const, label: 'All' }, ...SECTIONS].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              aria-pressed={section === s.id}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                section === s.id ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'
              }`}
            >
              {s.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-500" aria-live="polite">
            {results.length} {results.length === 1 ? 'card' : 'cards'}
          </span>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          Nothing matches &ldquo;{query}&rdquo;. Try one word (e.g. &ldquo;price&rdquo;), or use the &ldquo;Hello / I have a question&rdquo; card and ask
          what they need.
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((c) => (
            <Card key={c.id} card={c} words={words} />
          ))}
        </div>
      )}

      <AiDraftPanel />

      <details className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <summary className="cursor-pointer font-heading font-bold text-slate-900">House rules</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {HOUSE_RULES.map((r) => (
            <div key={r.title} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="font-semibold text-slate-900 text-sm">{r.title}</p>
              <p className="text-sm text-slate-600">{r.body}</p>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
