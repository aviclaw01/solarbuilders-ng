'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

/**
 * A form that shows what the server action said.
 *
 * The admin pages deliberately ship no client JS, because an operator can
 * reload. The partner portal is different: a partner accepting a job or
 * uploading a receipt needs to know whether it worked, and "the page looks the
 * same" is not an answer. That needs the action's return value, which only
 * useActionState gives you — so this is the one client component in the portal.
 *
 * Every action it drives returns the same { ok, message | error } shape.
 */

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

export function SubmitButton({
  children,
  className = '',
  variant = 'primary',
}: {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
}) {
  const { pending } = useFormStatus();
  const base =
    variant === 'primary'
      ? 'bg-slate-900 hover:bg-slate-800 text-white'
      : 'border border-slate-300 hover:border-slate-900 text-slate-800';
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-heading font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${base} ${className}`}
    >
      {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

export default function PortalForm({
  action,
  children,
  className = '',
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(
    async (_prev: ActionResult | null, formData: FormData) => action(formData),
    null as ActionResult | null,
  );

  return (
    <form action={formAction} className={className}>
      {children}

      {state && !state.ok && (
        <p role="alert" className="mt-2 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 flex gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          {state.error}
        </p>
      )}
      {state?.ok && state.message && (
        <p role="status" className="mt-2 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          {state.message}
        </p>
      )}
    </form>
  );
}
