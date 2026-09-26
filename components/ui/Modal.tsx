'use client';

import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

/**
 * The one modal shell. Both capture modals used to hand-roll this, which is how
 * they ended up inconsistent — QuoteContactModal had no dialog semantics at all
 * while LeadCaptureModal had some, and neither closed on Escape.
 *
 * What this gives every caller:
 *   - role="dialog", aria-modal, and an accessible name from the visible
 *     heading (aria-labelledby), so the name cannot drift from the heading.
 *   - Escape closes, unless `canClose` is false (never abandon a submit).
 *   - Focus moves into the dialog on open, is trapped while it is open
 *     (Tab and Shift+Tab cycle), and returns to the triggering control on close.
 *   - `document.body` scroll is locked while open and restored on close,
 *     including when the component unmounts without an explicit close.
 *   - Backdrop click closes; the close button keeps its own aria-label.
 *
 * The honeypot problem solves itself: it renders with `hidden` + tabIndex={-1},
 * so it is neither visible nor focusable, and the focus trap skips it.
 */

/** Visible, non-disabled, non-honeypot focus targets. */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function visibleFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null && el.getAttribute('aria-hidden') !== 'true',
  );
}

interface Props {
  /** id of the visible heading that names this dialog. */
  labelledBy: string;
  onClose: () => void;
  /** false while a submit is in flight — Escape and the backdrop stop closing. */
  canClose?: boolean;
  /** Layout only. `bottom` gives the mobile bottom-sheet shape. */
  align?: 'center' | 'bottom';
  /** Extra classes for the panel. */
  panelClassName?: string;
  children: ReactNode;
}

export default function Modal({
  labelledBy,
  onClose,
  canClose = true,
  align = 'center',
  panelClassName = '',
  children,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  // The element that opened us, so focus can go back where the user left it.
  const triggerRef = useRef<HTMLElement | null>(null);
  // Latest onClose without re-binding the key handler on every render.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const canCloseRef = useRef(canClose);
  canCloseRef.current = canClose;

  const requestClose = useCallback(() => {
    if (canCloseRef.current) closeRef.current();
  }, []);

  // Capture the trigger, lock scroll, move focus in.
  useEffect(() => {
    triggerRef.current = document.activeElement as HTMLElement | null;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    if (panel) {
      // Prefer the first real field, so a capture modal is ready to type in.
      const field = Array.from(
        panel.querySelectorAll<HTMLElement>('input:not([type="hidden"]), select, textarea'),
      ).find((el) => el.offsetParent !== null && el.getAttribute('aria-hidden') !== 'true');
      const target = field ?? visibleFocusable(panel)[0] ?? panel;
      target.focus({ preventScroll: true });
    }

    return () => {
      document.body.style.overflow = prevOverflow;
      // Restore focus to the control that opened us, if it is still on the page.
      const trigger = triggerRef.current;
      if (trigger && document.contains(trigger)) trigger.focus({ preventScroll: true });
    };
  }, []);

  // Escape closes; Tab and Shift+Tab cycle inside the panel.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        requestClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;
      const items = visibleFocusable(panel);
      if (items.length === 0) {
        // Nothing focusable (e.g. the success screen): keep focus on the panel.
        e.preventDefault();
        panel.focus({ preventScroll: true });
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [requestClose]);

  return (
    <div
      className={`fixed inset-0 z-[60] flex justify-center ${
        align === 'bottom' ? 'items-end sm:items-center p-0 sm:p-4' : 'items-center p-4'
      }`}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={requestClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`relative bg-white shadow-xl focus:outline-none ${panelClassName}`}
      >
        <button
          type="button"
          onClick={requestClose}
          className="absolute top-4 right-4 text-[#64748B] hover:text-[#0A0F1E] transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
        {children}
      </div>
    </div>
  );
}
