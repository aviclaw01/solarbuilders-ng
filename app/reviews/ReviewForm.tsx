'use client';

import { useState } from 'react';
import { Star, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { isPhone, type FieldErrors } from '@/lib/validation';
import { useToast } from '@/components/ui/Toast';
import { whatsappLink } from '@/lib/site';

const RATING_LABEL = ['', 'Poor', 'Below expectations', 'Okay', 'Good', 'Excellent'];

/** Client twin of the rules in app/api/submit-review/route.ts. */
function validate(v: {
  authorName: string;
  whatsapp: string;
  location: string;
  installer: string;
  rating: number;
  reviewBody: string;
}): FieldErrors {
  const e: FieldErrors = {};
  if (v.authorName.length < 2) e.authorName = v.authorName ? 'Name must be at least 2 characters.' : 'Your name is required.';
  if (!v.whatsapp) e.whatsapp = 'WhatsApp number is required.';
  else if (!isPhone(v.whatsapp)) e.whatsapp = 'That number looks short — e.g. 0803 000 0000.';
  if (v.location && v.location.length < 2) e.location = 'Location must be at least 2 characters.';
  if (v.installer && v.installer.length < 2) e.installer = 'Installer must be at least 2 characters.';
  if (!v.rating) e.rating = 'Pick a rating from 1 to 5 stars.';
  if (v.reviewBody.length < 20)
    e.reviewBody = v.reviewBody ? 'Please write at least 20 characters.' : 'Tell us how it went.';
  return e;
}

const inputCls = (bad: boolean) =>
  `w-full bg-white border rounded-lg px-4 py-3 text-[#0A0F1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#F59E0B] transition-colors ${
    bad ? 'border-rose-400' : 'border-[#E2E8F0]'
  }`;

export default function ReviewForm() {
  const [authorName, setAuthorName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [location, setLocation] = useState('');
  const [installer, setInstaller] = useState('');
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [reviewBody, setReviewBody] = useState('');
  const [hp, setHp] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<FieldErrors>({});
  const { toast } = useToast();

  function clearError(field: string) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'submitting') return;
    const values = {
      authorName: authorName.trim(),
      whatsapp: whatsapp.trim(),
      location: location.trim(),
      installer: installer.trim(),
      rating,
      reviewBody: reviewBody.trim(),
    };
    const next = validate(values);
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setStatus('submitting');
    try {
      const res = await fetch('/api/submit-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          location: values.location || undefined,
          installer: values.installer || undefined,
          hp,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        if (data?.fields) setErrors(data.fields as FieldErrors);
        setStatus('error');
        return;
      }
      setStatus('success');
      toast('Thank you — your review is with our team.', 'success');
    } catch {
      setStatus('error');
      toast('Network error — check your connection and try again.', 'error');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center">
        <CheckCircle2 className="w-10 h-10 text-[#059669] mx-auto mb-3" aria-hidden="true" />
        <p className="font-heading font-bold text-[#0A0F1E] text-xl mb-1">Thank you</p>
        <p className="text-[#64748B] text-sm">
          A person on our team will read it. If anything needs fixing on your install, we&apos;ll message you on
          WhatsApp.
        </p>
      </div>
    );
  }

  const shown = hover || rating;

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-2xl border border-[#E2E8F0] bg-white p-6 space-y-5">
      {/* Honeypot — hidden from humans, bait for scripts. */}
      <input
        type="text"
        name="hp"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <fieldset>
        <legend className="block text-sm font-medium text-[#0A0F1E] mb-2">Your rating *</legend>
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating out of 5" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? 's' : ''} — ${RATING_LABEL[n]}`}
              onClick={() => {
                setRating(n);
                clearError('rating');
              }}
              onMouseEnter={() => setHover(n)}
              className="p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
            >
              <Star
                className={`w-8 h-8 transition-colors ${n <= shown ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#CBD5E1]'}`}
                aria-hidden="true"
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-[#64748B]">{shown ? RATING_LABEL[shown] : ''}</span>
        </div>
        {errors.rating && <p className="text-rose-600 text-xs mt-1">{errors.rating}</p>}
      </fieldset>

      <div>
        <label htmlFor="review-body" className="block text-sm font-medium text-[#0A0F1E] mb-1">
          How did it go? *
        </label>
        <textarea
          id="review-body"
          value={reviewBody}
          onChange={(e) => {
            setReviewBody(e.target.value);
            clearError('reviewBody');
          }}
          rows={5}
          maxLength={3000}
          placeholder="What did you get, how was the install, and how has it run since?"
          aria-invalid={!!errors.reviewBody}
          className={`${inputCls(!!errors.reviewBody)} resize-y`}
        />
        {errors.reviewBody && <p className="text-rose-600 text-xs mt-1">{errors.reviewBody}</p>}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="review-name" className="block text-sm font-medium text-[#0A0F1E] mb-1">
            Your name *
          </label>
          <input
            id="review-name"
            type="text"
            autoComplete="name"
            value={authorName}
            onChange={(e) => {
              setAuthorName(e.target.value);
              clearError('authorName');
            }}
            placeholder="e.g. Tunde A."
            aria-invalid={!!errors.authorName}
            className={inputCls(!!errors.authorName)}
          />
          {errors.authorName && <p className="text-rose-600 text-xs mt-1">{errors.authorName}</p>}
        </div>

        <div>
          <label htmlFor="review-whatsapp" className="block text-sm font-medium text-[#0A0F1E] mb-1">
            WhatsApp number * <span className="text-[#94A3B8] font-normal">(never shown)</span>
          </label>
          <input
            id="review-whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={whatsapp}
            onChange={(e) => {
              setWhatsapp(e.target.value);
              clearError('whatsapp');
            }}
            placeholder="0803 000 0000"
            aria-invalid={!!errors.whatsapp}
            className={inputCls(!!errors.whatsapp)}
          />
          {errors.whatsapp && <p className="text-rose-600 text-xs mt-1">{errors.whatsapp}</p>}
        </div>

        <div>
          <label htmlFor="review-location" className="block text-sm font-medium text-[#0A0F1E] mb-1">
            Area (optional)
          </label>
          <input
            id="review-location"
            type="text"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              clearError('location');
            }}
            placeholder="e.g. Gbagada, Lagos"
            aria-invalid={!!errors.location}
            className={inputCls(!!errors.location)}
          />
          {errors.location && <p className="text-rose-600 text-xs mt-1">{errors.location}</p>}
        </div>

        <div>
          <label htmlFor="review-installer" className="block text-sm font-medium text-[#0A0F1E] mb-1">
            Who installed it? (optional)
          </label>
          <input
            id="review-installer"
            type="text"
            value={installer}
            onChange={(e) => {
              setInstaller(e.target.value);
              clearError('installer');
            }}
            placeholder="Installer's name or company"
            aria-invalid={!!errors.installer}
            className={inputCls(!!errors.installer)}
          />
          {errors.installer && <p className="text-rose-600 text-xs mt-1">{errors.installer}</p>}
        </div>
      </div>

      {status === 'error' && (
        <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-rose-700 text-sm">
            We couldn&apos;t send your review just now &mdash; that&apos;s on us, not you. Try again, or{' '}
            <a
              href={whatsappLink('Hi SolarBuilders, I want to leave a review of my install.')}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold"
            >
              send it to us on WhatsApp
            </a>
            .
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className={`w-full py-3 rounded-lg font-heading font-bold text-base transition-colors ${
          status !== 'submitting'
            ? 'bg-[#F59E0B] text-[#0A0F1E] hover:bg-[#D97706]'
            : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
        }`}
      >
        {status === 'submitting' ? 'Sending...' : 'Send my review'}
      </button>
    </form>
  );
}
