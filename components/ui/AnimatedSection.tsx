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

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('in-view');
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
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
