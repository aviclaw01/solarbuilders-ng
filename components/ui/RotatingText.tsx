'use client';
import { useState, useEffect } from 'react';

const WORDS = ['Verified Builders', 'Your System Size', 'Solar Quotes', 'The Right Installer'];

export default function RotatingText() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(i => (i + 1) % WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-block relative">
      <span
        key={index}
        className="inline-block animate-[fadeSlideIn_0.5s_ease-out]"
      >
        {WORDS[index]}
      </span>
      <style jsx>{`
        @keyframes fadeSlideIn {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </span>
  );
}
