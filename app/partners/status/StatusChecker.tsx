'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle, Clock, ShieldCheck, Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface StatusData {
  businessName: string;
  ref: string;
  kind: string;
  status: string;
  statusLabel: string;
  applicantLine: string;
  nextStep: string;
  submittedAt: string;
  verifiedAt: string | null;
  verifiedUntil: string | null;
  scope: string | null;
  rejectedReason: string | null;
  suspendedReason: string | null;
  infoRequested: string[];
  portalIssued: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  submitted: 'bg-amber-50 border-amber-200',
  under_review: 'bg-sky-50 border-sky-200',
  info_requested: 'bg-indigo-50 border-indigo-200',
  approved: 'bg-emerald-50 border-emerald-200',
  rejected: 'bg-slate-100 border-slate-200',
  suspended: 'bg-rose-50 border-rose-200',
};

const STATUS_ICONS: Record<string, typeof CheckCircle> = {
  submitted: Clock,
  under_review: Search,
  info_requested: AlertCircle,
  approved: ShieldCheck,
  rejected: AlertCircle,
  suspended: AlertCircle,
};

export default function StatusChecker() {
  const [ref, setRef] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<StatusData | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ref.trim() || !email.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/partner-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: ref.trim(), email: email.trim() }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; data?: StatusData; error?: string };
      if (res.ok && body.ok && body.data) {
        setData(body.data);
        setError('');
      } else {
        setError(body.error || 'Something went wrong. Try again.');
      }
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="ref" className="block text-sm font-medium text-slate-900 mb-2">Reference</label>
          <input
            id="ref"
            type="text"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="e.g. SB-7K3F-9QZ"
            autoComplete="off"
            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-400 transition-colors min-h-[44px]"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-900 mb-2">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="The email you applied with"
            autoComplete="email"
            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-400 transition-colors min-h-[44px]"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="font-heading w-full bg-slate-900 text-white py-4 rounded-full font-bold text-lg hover:bg-slate-800 transition-colors min-h-[56px] disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Checking…' : 'Check status'}
        </button>
      </form>
      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      )}
      {data && <StatusResult data={data} />}
    </div>
  );
}

function StatusResult({ data }: { data: StatusData }) {
  const Icon = STATUS_ICONS[data.status] ?? Clock;
  const style = STATUS_STYLES[data.status] ?? STATUS_STYLES.submitted;
  return (
    <div className={`mt-8 border rounded-2xl p-6 ${style}`}>
      <div className="flex items-center gap-3 mb-4">
        <Icon className="w-6 h-6 text-slate-700" />
        <div>
          <p className="font-heading font-bold text-slate-900">{data.businessName}</p>
          <p className="text-slate-500 text-xs">Ref {data.ref}</p>
        </div>
      </div>
      <p className="font-heading font-semibold text-slate-900 mb-2">{data.statusLabel}</p>
      <p className="text-slate-700 text-sm leading-relaxed mb-2">{data.applicantLine}</p>
      <p className="text-slate-600 text-sm leading-relaxed">{data.nextStep}</p>

      {data.infoRequested.length > 0 && (
        <div className="mt-4 bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-900 mb-2">What we still need from you:</p>
          <ul className="space-y-1">
            {data.infoRequested.map((item) => (
              <li key={item} className="flex items-start gap-2 text-slate-700 text-sm">
                <CheckCircle className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.status === 'approved' && data.scope && (
        <div className="mt-4 bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-900 mb-1">What we verified</p>
          <p className="text-slate-700 text-sm">{data.scope}</p>
          {data.verifiedUntil && (
            <p className="text-slate-500 text-xs mt-2">Verification valid until {data.verifiedUntil}.</p>
          )}
          {data.portalIssued && (
            <p className="text-slate-500 text-xs mt-2">Your portal link is in your email. Check spam if you cannot see it.</p>
          )}
        </div>
      )}

      {data.status === 'rejected' && data.rejectedReason && (
        <div className="mt-4 bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-900 mb-1">Why</p>
          <p className="text-slate-700 text-sm leading-relaxed">{data.rejectedReason}</p>
        </div>
      )}

      {data.status === 'suspended' && data.suspendedReason && (
        <div className="mt-4 bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-900 mb-1">Why</p>
          <p className="text-slate-700 text-sm leading-relaxed">{data.suspendedReason}</p>
        </div>
      )}

      {data.status === 'approved' && (
        <Link
          href="/partners"
          className="inline-flex items-center gap-1 text-slate-700 text-sm mt-4 underline underline-offset-4 hover:text-slate-900"
        >
          See your public profile <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

