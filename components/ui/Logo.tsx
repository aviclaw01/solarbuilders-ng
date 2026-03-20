import React from 'react';

type LogoVariant = 'horizontal' | 'icon' | 'stacked';
type ColorMode = 'light' | 'dark';
type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  variant?: LogoVariant;
  colorMode?: ColorMode;
  size?: LogoSize;
  className?: string;
}

const sizeMap = {
  sm: { icon: 24, text: 'text-sm', gap: 'gap-1.5', stackedGap: 'gap-1' },
  md: { icon: 32, text: 'text-base', gap: 'gap-2', stackedGap: 'gap-1.5' },
  lg: { icon: 44, text: 'text-xl', gap: 'gap-2.5', stackedGap: 'gap-2' },
};

const SolarIcon = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    style={{ flexShrink: 0 }}
  >
    <circle cx="100" cy="100" r="100" fill="#F59E0B" />
    <polygon
      points="100.0,18.0 119.8,80.2 182.0,100.0 119.8,119.8 100.0,182.0 80.2,119.8 18.0,100.0 80.2,80.2"
      fill="#0F172A"
    />
    <polygon points="100,86 114,100 100,114 86,100" fill="#F59E0B" />
  </svg>
);

const Wordmark = ({
  colorMode,
  textClass,
}: {
  colorMode: ColorMode;
  textClass: string;
}) => {
  const primaryColor = colorMode === 'dark' ? '#FAFAF7' : '#0F172A';
  const accentColor = colorMode === 'dark' ? '#94A3B8' : '#64748B';

  return (
    <span
      className={`font-heading font-bold leading-none ${textClass}`}
      style={{ fontFamily: 'var(--font-heading), "Plus Jakarta Sans", sans-serif' }}
    >
      <span style={{ color: primaryColor }}>SolarBuilders</span>
      <span style={{ color: accentColor }}>.ng</span>
    </span>
  );
};

export default function Logo({
  variant = 'horizontal',
  colorMode = 'light',
  size = 'md',
  className = '',
}: LogoProps) {
  const { icon: iconSize, text: textClass, gap, stackedGap } = sizeMap[size];

  if (variant === 'icon') {
    return (
      <span className={`inline-flex ${className}`} aria-label="SolarBuilders.ng">
        <SolarIcon size={iconSize} />
      </span>
    );
  }

  if (variant === 'stacked') {
    return (
      <span
        className={`inline-flex flex-col items-center ${stackedGap} ${className}`}
        aria-label="SolarBuilders.ng"
      >
        <SolarIcon size={iconSize} />
        <Wordmark colorMode={colorMode} textClass={textClass} />
      </span>
    );
  }

  // horizontal (default)
  return (
    <span
      className={`inline-flex items-center ${gap} ${className}`}
      aria-label="SolarBuilders.ng"
    >
      <SolarIcon size={iconSize} />
      <Wordmark colorMode={colorMode} textClass={textClass} />
    </span>
  );
}
