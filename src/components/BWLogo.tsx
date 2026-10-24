import React from 'react';

export type BWLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type BWLogoVariant = 'badge' | 'badge-light' | 'glyph' | 'monochrome-white' | 'monochrome-dark';

interface BWLogoProps {
  size?: BWLogoSize;
  variant?: BWLogoVariant;
  className?: string;
  withText?: boolean;
  textColor?: string;
}

const sizeMap: Record<BWLogoSize, { box: string; px: number }> = {
  xs: { box: 'h-6 w-6', px: 24 },
  sm: { box: 'h-8 w-8', px: 32 },
  md: { box: 'h-10 w-10', px: 40 },
  lg: { box: 'h-14 w-14', px: 56 },
  xl: { box: 'h-18 w-18', px: 72 },
  '2xl': { box: 'h-24 w-24', px: 96 },
};

/**
 * BAL WALA Master Artistic "BW" Brand Logo
 * Single Source of Truth for brand mark across Customer, Collector, Admin, and PWA.
 * Features an elegant, hair & beauty inspired intertwined "BW" monogram.
 */
export const BWLogo: React.FC<BWLogoProps> = ({
  size = 'md',
  variant = 'badge',
  className = '',
  withText = false,
  textColor = 'text-white',
}) => {
  const { box } = sizeMap[size] || sizeMap.md;

  // Render pure vector monogram glyph
  const renderGlyph = (strokeColor: string = '#FFFFFF', accentColor: string = '#FFFFFF') => (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* Letter B: Vertical Backbone Stem */}
      <path d="M 32 30 L 32 88" stroke={strokeColor} strokeWidth="7" />
      {/* Top Crown Serif of B */}
      <path d="M 26 30 L 38 30" stroke={strokeColor} strokeWidth="3.5" />
      {/* Bottom Base Serif of B */}
      <path d="M 26 88 L 38 88" stroke={strokeColor} strokeWidth="3.5" />

      {/* Upper Bowl of B (Graceful, Silken Hair Curl) */}
      <path
        d="M 32 31 C 48 30, 60 38, 60 48 C 60 58, 48 60, 32 60"
        stroke={strokeColor}
        strokeWidth="6"
      />

      {/* Lower Bowl of B (Flowing Hair Wave transitioning toward W) */}
      <path
        d="M 32 60 C 52 59, 64 68, 64 78 C 64 88, 49 88, 32 88"
        stroke={strokeColor}
        strokeWidth="6"
      />

      {/* Letter W: Interlocking Dynamic Hair Strands */}
      <path
        d="M 55 52 L 67 88 L 78 58 L 89 88 L 99 42"
        stroke={strokeColor}
        strokeWidth="6"
      />

      {/* Beauty Hair Flourish: Upward Tress Flare on right leg of W */}
      <path
        d="M 99 42 C 100 36, 103 33, 106 33"
        stroke={strokeColor}
        strokeWidth="3.5"
      />

      {/* Luxury Glimmer / Diamond Accent Accent above W */}
      <circle cx="99" cy="27" r="2.75" fill={accentColor} stroke="none" />
    </g>
  );

  const renderContent = () => {
    switch (variant) {
      case 'badge':
        // Luxury Monochrome Black Squircle with Crisp Solid White BW Monogram (100% Reliable Contrast)
        return (
          <svg
            viewBox="0 0 120 120"
            className={`${box} shrink-0 drop-shadow-md transition-transform hover:scale-105 select-none`}
            xmlns="http://www.w3.org/2000/svg"
            aria-label="BAL WALA BW Logo"
            role="img"
          >
            {/* Dark Squircle Container */}
            <rect
              x="4"
              y="4"
              width="112"
              height="112"
              rx="28"
              fill="#09090B"
              stroke="#27272A"
              strokeWidth="2"
            />
            {/* Subtle Inner Hairline Ring */}
            <circle
              cx="60"
              cy="60"
              r="48"
              stroke="#FFFFFF"
              strokeWidth="1"
              strokeOpacity="0.14"
              fill="none"
            />
            {renderGlyph('#FFFFFF', '#FFFFFF')}
          </svg>
        );

      case 'badge-light':
        // Crisp Warm White Squircle with Dark Deep Plum / Slate Monogram
        return (
          <svg
            viewBox="0 0 120 120"
            className={`${box} shrink-0 shadow-md transition-transform hover:scale-105 select-none`}
            xmlns="http://www.w3.org/2000/svg"
            aria-label="BAL WALA BW Logo"
            role="img"
          >
            <rect
              x="4"
              y="4"
              width="112"
              height="112"
              rx="28"
              fill="#FFFFFF"
              stroke="#E2E8F0"
              strokeWidth="2"
            />
            <circle
              cx="60"
              cy="60"
              r="48"
              stroke="#09090B"
              strokeWidth="1"
              strokeOpacity="0.08"
              fill="none"
            />
            {renderGlyph('#09090B', '#09090B')}
          </svg>
        );

      case 'monochrome-white':
        return (
          <svg
            viewBox="0 0 120 120"
            className={`${box} shrink-0 select-none`}
            xmlns="http://www.w3.org/2000/svg"
            aria-label="BAL WALA BW Logo"
          >
            {renderGlyph('#FFFFFF', '#FFFFFF')}
          </svg>
        );

      case 'monochrome-dark':
        return (
          <svg
            viewBox="0 0 120 120"
            className={`${box} shrink-0 select-none`}
            xmlns="http://www.w3.org/2000/svg"
            aria-label="BAL WALA BW Logo"
          >
            {renderGlyph('#09090B', '#09090B')}
          </svg>
        );

      case 'glyph':
      default:
        // Inherits currentColor for adaptive styling
        return (
          <svg
            viewBox="0 0 120 120"
            className={`${box} shrink-0 select-none`}
            xmlns="http://www.w3.org/2000/svg"
            aria-label="BAL WALA BW Logo"
          >
            {renderGlyph('currentColor', 'currentColor')}
          </svg>
        );
    }
  };

  if (withText) {
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        {renderContent()}
        <div className="flex flex-col leading-none">
          <span className={`font-black tracking-tight text-sm sm:text-base ${textColor}`}>
            BAL WALA
          </span>
          <span className="text-[9px] font-semibold text-[#FDBA9A] tracking-wider uppercase mt-0.5">
            Artistic Hair Care
          </span>
        </div>
      </div>
    );
  }

  return <div className={`inline-flex items-center justify-center ${className}`}>{renderContent()}</div>;
};
