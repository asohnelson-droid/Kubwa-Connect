import React from 'react';

/**
 * The Sell Am Here mark: one "S" drawn as three strokes in the category
 * colours (Mart green, FixIt amber, Ride blue). Source files live in the
 * brand kit; keep these paths in sync with public/favicon.svg.
 */
const BrandMark: React.FC<{ className?: string; title?: string }> = ({ className = 'w-6 h-6', title }) => (
  <svg viewBox="0 0 200 200" className={className} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
    <g strokeLinecap="round" fill="none" strokeWidth="34">
      <path d="M 124 108 C 150 118 156 148 132 164 C 110 178 70 172 54 146" stroke="#2563EB" />
      <path d="M 146 60 C 134 38 108 32 86 36 C 58 42 50 72 68 88" stroke="#16A34A" />
      <path d="M 68 88 C 80 99 104 100 124 108" stroke="#F59E0B" />
    </g>
  </svg>
);

export default BrandMark;
