'use client';

import { useEffect, useRef, ReactNode } from 'react';

interface AnimatedSectionProps {
  children: ReactNode;
  delay?: 75 | 150 | 225 | 300 | 450;
  className?: string;
}

const DELAY_CLASS: Record<number, string> = {
  75: 'delay-75',
  150: 'delay-150',
  225: 'delay-225',
  300: 'delay-300',
  450: 'delay-450',
};

export default function AnimatedSection({ children, delay, className = '' }: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reveal = () => el.classList.add('in-view');

    if (typeof IntersectionObserver === 'undefined') {
      reveal();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal();
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);

    // Failsafe: if the observer hasn't fired by now (headless renderers and
    // some crawlers never scroll), show the content anyway. Never leave it
    // stuck at opacity 0.
    const failsafe = window.setTimeout(() => {
      reveal();
      observer.disconnect();
    }, 1500);

    return () => {
      window.clearTimeout(failsafe);
      observer.disconnect();
    };
  }, []);

  const delayClass = delay ? DELAY_CLASS[delay] : '';

  return (
    <div
      ref={ref}
      className={`section-animate ${delayClass} ${className}`}
    >
      {children}
    </div>
  );
}
