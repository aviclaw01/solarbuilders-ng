'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface ReviewFormProps {
  builderSlug: string;
  builderName: string;
}

export default function ReviewForm({ builderSlug, builderName }: ReviewFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const valid = name.trim() && city.trim() && rating > 0 && body.trim().length >= 20;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setStatus('submitting');
    try {
      const res = await fetch('/api/submit-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          builderSlug,
          builderName,
          authorName: name.trim(),
          location: city.trim(),
          rating,
          reviewBody: body.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-[#E2E8F0] p-6 text-center">
        <p className="text-[#059669] font-heading font-semibold text-lg mb-1">Thanks!</p>
        <p className="text-[#64748B] text-sm">Your review will appear after verification.</p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-4 rounded-2xl border-2 border-dashed border-[#E2E8F0] text-[#64748B] font-heading font-semibold hover:border-[#F59E0B] hover:text-[#F59E0B] transition-colors"
      >
        Write a Review
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-[#E2E8F0] p-6 space-y-4">
      <h3 className="font-heading font-bold text-[#0A0F1E] text-lg">Write a Review</h3>

      <div>
        <label className="block text-sm font-medium text-[#0A0F1E] mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name"
          className="w-full bg-white border border-[#E2E8F0] rounded-lg px-4 py-3 text-[#0A0F1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#F59E0B] transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#0A0F1E] mb-1">City</label>
        <input
          type="text"
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="e.g. Lagos"
          className="w-full bg-white border border-[#E2E8F0] rounded-lg px-4 py-3 text-[#0A0F1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#F59E0B] transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#0A0F1E] mb-1">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setRating(s)}
              onMouseEnter={() => setHoverRating(s)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-0.5"
            >
              <Star
                className={`w-7 h-7 transition-colors ${
                  s <= (hoverRating || rating)
                    ? 'text-[#F59E0B] fill-current'
                    : 'text-[#E2E8F0]'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#0A0F1E] mb-1">Review</label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Share your experience (min 20 characters)"
          rows={4}
          className="w-full bg-white border border-[#E2E8F0] rounded-lg px-4 py-3 text-[#0A0F1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#F59E0B] transition-colors resize-none"
        />
        {body.length > 0 && body.length < 20 && (
          <p className="text-[#94A3B8] text-xs mt-1">{20 - body.length} more characters needed</p>
        )}
      </div>

      {status === 'error' && (
        <p className="text-red-500 text-sm">Something went wrong, please try again.</p>
      )}

      <button
        type="submit"
        disabled={!valid || status === 'submitting'}
        className={`w-full py-3 rounded-lg font-heading font-bold text-base transition-colors ${
          valid && status !== 'submitting'
            ? 'bg-[#F59E0B] text-[#0A0F1E] hover:bg-[#D97706]'
            : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
        }`}
      >
        {status === 'submitting' ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
