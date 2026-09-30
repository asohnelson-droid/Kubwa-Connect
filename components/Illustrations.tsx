import React from 'react';

/*
 * Original flat illustrations for Sell Am Here's four services.
 * Pure SVG: no downloads, crisp at any size, tiny in the bundle.
 * All share a 360 x 260 canvas so they can be swapped in the same frame.
 */

const INK = '#161A2B';
const PRIMARY = '#FF5A36';
const PRIMARY_DARK = '#E2431F';
const CREAM = '#FFE8A3';
const AMBER = '#FBBF24';
const AMBER_DARK = '#F59E0B';
const GREEN = '#16A34A';
const GREEN_DARK = '#15803D';
const BLUE = '#2563EB';

const Sparkle: React.FC<{ x: number; y: number; s?: number; fill?: string; opacity?: number }> = ({ x, y, s = 8, fill = '#FFFFFF', opacity = 1 }) => (
  <path
    d={`M${x} ${y - s} L${x + s * 0.28} ${y - s * 0.28} L${x + s} ${y} L${x + s * 0.28} ${y + s * 0.28} L${x} ${y + s} L${x - s * 0.28} ${y + s * 0.28} L${x - s} ${y} L${x - s * 0.28} ${y - s * 0.28} Z`}
    fill={fill}
    opacity={opacity}
  />
);

const svgProps = { viewBox: '0 0 360 260', className: 'w-full h-full', 'aria-hidden': true as const };

/** A seller's phone with their shop open and a new order coming in. */
export const SellArt: React.FC = () => (
  <svg {...svgProps}>
    <circle cx="236" cy="128" r="104" fill="#FFFFFF" opacity="0.1" />
    <ellipse cx="236" cy="248" rx="84" ry="8" fill="#000" opacity="0.15" />
    {/* phone */}
    <rect x="172" y="16" width="128" height="228" rx="22" fill={INK} />
    <rect x="180" y="28" width="112" height="204" rx="15" fill="#FFFFFF" />
    <rect x="180" y="28" width="112" height="40" rx="15" fill={PRIMARY} />
    <rect x="180" y="52" width="112" height="16" fill={PRIMARY} />
    <rect x="220" y="32" width="32" height="6" rx="3" fill={INK} />
    <circle cx="198" cy="52" r="9" fill="#FFFFFF" />
    <path d="M194 52 h8 M198 48 v8" stroke={PRIMARY} strokeWidth="2.5" strokeLinecap="round" />
    <rect x="212" y="46" width="52" height="6" rx="3" fill="#FFFFFF" opacity="0.95" />
    <rect x="212" y="56" width="34" height="5" rx="2.5" fill="#FFFFFF" opacity="0.6" />
    {/* product tiles */}
    <rect x="188" y="76" width="46" height="58" rx="9" fill="#FFF1DC" />
    <circle cx="211" cy="99" r="12" fill="#FB923C" />
    <ellipse cx="214" cy="87" rx="5" ry="2.5" fill={GREEN} />
    <rect x="194" y="120" width="24" height="5" rx="2.5" fill="#CBD5E1" />
    <rect x="240" y="76" width="46" height="58" rx="9" fill="#DCFCE7" />
    <path d="M252 92 l8 -5 h6 l8 5 l-4 8 h-2 v14 h-12 v-14 h-2 z" fill={GREEN} />
    <rect x="246" y="120" width="24" height="5" rx="2.5" fill="#CBD5E1" />
    <rect x="188" y="140" width="46" height="58" rx="9" fill="#DBEAFE" />
    <path d="M200 172 v-6 a11 11 0 0 1 22 0 v6" stroke={BLUE} strokeWidth="4" fill="none" />
    <rect x="197" y="166" width="7" height="12" rx="3" fill={BLUE} />
    <rect x="218" y="166" width="7" height="12" rx="3" fill={BLUE} />
    <rect x="194" y="184" width="24" height="5" rx="2.5" fill="#CBD5E1" />
    <rect x="240" y="140" width="46" height="58" rx="9" fill="#FFE4DC" />
    <path d="M248 176 h26 a5 5 0 0 1 0 10 h-26 z" fill={PRIMARY} />
    <path d="M249 176 l5 -12 h9 l7 12 z" fill={PRIMARY_DARK} />
    <rect x="246" y="190" width="24" height="5" rx="2.5" fill="#CBD5E1" />
    <rect x="188" y="206" width="98" height="18" rx="9" fill={INK} />
    <rect x="218" y="213" width="38" height="4" rx="2" fill="#FFFFFF" opacity="0.85" />
    {/* new order card */}
    <rect x="40" y="76" width="152" height="58" rx="14" fill="#000" opacity="0.12" />
    <rect x="34" y="68" width="152" height="58" rx="14" fill="#FFFFFF" />
    <circle cx="60" cy="97" r="14" fill={GREEN} />
    <text x="60" y="102.5" textAnchor="middle" fontSize="15" fontWeight="700" fill="#FFFFFF" fontFamily="Space Grotesk, sans-serif">₦</text>
    <rect x="82" y="86" width="82" height="7" rx="3.5" fill={INK} opacity="0.85" />
    <rect x="82" y="100" width="56" height="6" rx="3" fill="#94A3B8" />
    {/* coins */}
    <ellipse cx="88" cy="222" rx="28" ry="8" fill={AMBER_DARK} />
    {[0, 1, 2].map(i => (
      <g key={i}>
        <rect x="60" y={202 - i * 11} width="56" height="20" fill={AMBER_DARK} />
        <ellipse cx="88" cy={202 - i * 11} rx="28" ry="8" fill={AMBER} />
      </g>
    ))}
    <Sparkle x={320} y={46} s={10} />
    <Sparkle x={140} y={170} s={7} opacity={0.8} />
    <circle cx="28" cy="36" r="4" fill="#FFFFFF" opacity="0.6" />
  </svg>
);

/** A market stall with fresh produce and a shopping bag. */
export const MartArt: React.FC = () => (
  <svg {...svgProps}>
    <circle cx="250" cy="110" r="98" fill="#FFFFFF" opacity="0.08" />
    <ellipse cx="180" cy="240" rx="150" ry="10" fill="#000" opacity="0.14" />
    {/* stall */}
    <rect x="62" y="66" width="9" height="166" rx="4" fill="#0F5F2C" />
    <rect x="289" y="66" width="9" height="166" rx="4" fill="#0F5F2C" />
    {Array.from({ length: 8 }).map((_, i) => (
      <rect key={`s${i}`} x={44 + i * 34} y="56" width="34" height="32" fill={i % 2 ? CREAM : '#FFFFFF'} />
    ))}
    {Array.from({ length: 8 }).map((_, i) => (
      <circle key={`c${i}`} cx={61 + i * 34} cy="88" r="17" fill={i % 2 ? CREAM : '#FFFFFF'} />
    ))}
    <rect x="40" y="44" width="280" height="16" rx="8" fill={INK} />
    {/* price tag */}
    <line x1="112" y1="105" x2="112" y2="116" stroke={INK} strokeWidth="1.5" />
    <rect x="97" y="116" width="30" height="21" rx="5" fill="#FFFFFF" />
    <text x="112" y="131.5" textAnchor="middle" fontSize="14" fontWeight="700" fill={GREEN_DARK} fontFamily="Space Grotesk, sans-serif">₦</text>
    {/* counter */}
    <rect x="56" y="176" width="248" height="58" rx="10" fill="#FFFFFF" />
    <path d="M118 188 v38 M180 188 v38 M242 188 v38" stroke="#E5E7EB" strokeWidth="3" strokeLinecap="round" />
    <rect x="50" y="168" width="260" height="12" rx="6" fill={CREAM} />
    {/* tomatoes */}
    <circle cx="84" cy="152" r="12" fill="#EF4444" />
    <circle cx="104" cy="146" r="12" fill="#DC2626" />
    <circle cx="124" cy="152" r="12" fill="#EF4444" />
    <circle cx="80" cy="148" r="3" fill="#FFFFFF" opacity="0.45" />
    <circle cx="120" cy="148" r="3" fill="#FFFFFF" opacity="0.45" />
    <path d="M80 142 q4 -5 8 0 M100 136 q4 -5 8 0 M120 142 q4 -5 8 0" stroke={GREEN_DARK} strokeWidth="3" fill="none" strokeLinecap="round" />
    <rect x="70" y="154" width="68" height="16" rx="3" fill="#B45309" />
    <rect x="70" y="161" width="68" height="2.5" fill="#92400E" />
    {/* oranges */}
    {[[160, 158], [180, 158], [200, 158], [170, 141], [190, 141], [180, 124]].map(([x, y]) => (
      <circle key={`${x}-${y}`} cx={x} cy={y} r="10" fill="#FB923C" />
    ))}
    <ellipse cx="184" cy="114" rx="5" ry="2.5" fill={GREEN} />
    {/* bags */}
    <rect x="244" y="112" width="50" height="62" rx="8" fill="#FFFFFF" opacity="0.9" />
    <path d="M246 128 v-12 a17 17 0 0 1 34 0 v12" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />
    <rect x="230" y="124" width="66" height="80" rx="10" fill={PRIMARY} />
    <rect x="230" y="124" width="66" height="14" rx="7" fill={PRIMARY_DARK} />
    <circle cx="263" cy="168" r="13" fill="#FFFFFF" />
    <path d="M257 168 l4 4 l8 -9" stroke={PRIMARY} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <Sparkle x={26} y={40} s={8} opacity={0.7} />
    <Sparkle x={334} y={30} s={9} fill={CREAM} />
    <circle cx="336" cy="190" r="5" fill="#FFFFFF" opacity="0.35" />
  </svg>
);

/** An open toolbox surrounded by the kinds of jobs FixIt covers. */
export const FixItArt: React.FC = () => (
  <svg {...svgProps}>
    <circle cx="180" cy="124" r="102" fill="#FFFFFF" opacity="0.16" />
    <ellipse cx="180" cy="238" rx="130" ry="10" fill="#000" opacity="0.12" />
    {/* ring spanner */}
    <g transform="translate(142 40) rotate(-22)">
      <rect x="-7" y="18" width="14" height="120" rx="7" fill="#E5E7EB" />
      <circle cx="0" cy="12" r="21" fill="#E5E7EB" />
      <circle cx="0" cy="12" r="9" fill="#94A3B8" />
    </g>
    {/* hammer */}
    <g transform="translate(184 30) rotate(6)">
      <rect x="-6" y="14" width="12" height="112" rx="6" fill="#92400E" />
      <rect x="-28" y="0" width="56" height="20" rx="5" fill="#475569" />
      <rect x="-28" y="0" width="12" height="20" rx="4" fill="#334155" />
    </g>
    {/* screwdriver */}
    <g transform="translate(228 34) rotate(22)">
      <rect x="-3" y="48" width="6" height="82" rx="2" fill="#CBD5E1" />
      <rect x="-12" y="0" width="24" height="54" rx="10" fill={PRIMARY} />
      <rect x="-12" y="16" width="24" height="5" fill={PRIMARY_DARK} />
      <rect x="-12" y="30" width="24" height="5" fill={PRIMARY_DARK} />
    </g>
    {/* toolbox */}
    <path d="M146 134 v-18 h68 v18" stroke={INK} strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="76" y="142" width="208" height="88" rx="14" fill={INK} />
    <rect x="68" y="128" width="224" height="28" rx="10" fill="#2A3050" />
    <rect x="168" y="144" width="24" height="18" rx="4" fill={AMBER} />
    <rect x="96" y="192" width="168" height="7" rx="3.5" fill="#2A3050" />
    {/* job bubbles: electrical, plumbing, reviews */}
    <circle cx="58" cy="84" r="27" fill="#FFFFFF" />
    <path d="M62 68 l-13 20 h10 l-4 16 l15 -22 h-10 z" fill={AMBER_DARK} />
    <circle cx="306" cy="92" r="25" fill="#FFFFFF" />
    <path d="M306 78 c8 10 12 16 12 22 a12 12 0 0 1 -24 0 c0 -6 4 -12 12 -22 z" fill={BLUE} />
    <circle cx="42" cy="190" r="22" fill="#FFFFFF" />
    <path d="M42 178 L45.5 186 L54 186.5 L47.5 192 L49.5 200.5 L42 196 L34.5 200.5 L36.5 192 L30 186.5 L38.5 186 Z" fill={AMBER_DARK} />
    <Sparkle x={322} y={170} s={9} />
    <Sparkle x={110} y={40} s={7} opacity={0.85} />
  </svg>
);

/** A delivery bike with its parcel box and a live route card. */
export const RideArt: React.FC = () => (
  <svg {...svgProps}>
    <circle cx="250" cy="120" r="96" fill="#FFFFFF" opacity="0.08" />
    {/* route card */}
    <rect x="30" y="28" width="170" height="92" rx="16" fill="#000" opacity="0.12" />
    <rect x="24" y="22" width="170" height="92" rx="16" fill="#FFFFFF" />
    <path d="M36 52 H182 M36 80 H182 M90 32 V104 M140 32 V104" stroke="#EEF2F7" strokeWidth="2" />
    <path d="M48 96 C 84 96, 88 58, 122 64 S 160 74, 170 62" stroke={BLUE} strokeWidth="4" strokeDasharray="2 8" strokeLinecap="round" fill="none" />
    <circle cx="48" cy="96" r="7" fill={GREEN} />
    <circle cx="48" cy="96" r="3" fill="#FFFFFF" />
    <path d="M170 62 s-12 -12 -12 -21 a12 12 0 0 1 24 0 c0 9 -12 21 -12 21 z" fill={PRIMARY} />
    <circle cx="170" cy="41" r="4.5" fill="#FFFFFF" />
    {/* road */}
    <rect x="0" y="228" width="360" height="18" rx="9" fill="#1E3A8A" opacity="0.55" />
    <line x1="12" y1="237" x2="348" y2="237" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="16 12" opacity="0.7" />
    {/* speed lines */}
    <line x1="62" y1="168" x2="110" y2="168" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
    <line x1="48" y1="186" x2="104" y2="186" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.35" />
    {/* parcel box */}
    <rect x="246" y="94" width="66" height="56" rx="8" fill={AMBER} />
    <rect x="246" y="94" width="66" height="12" rx="6" fill={AMBER_DARK} />
    <rect x="275" y="94" width="8" height="56" fill={AMBER_DARK} />
    {/* bike */}
    <rect x="270" y="186" width="38" height="8" rx="4" fill="#94A3B8" />
    <path d="M162 194 L198 150 L280 150 L300 194 Z" fill={PRIMARY} />
    <rect x="204" y="138" width="56" height="15" rx="7.5" fill={INK} />
    <path d="M184 168 L170 122" stroke={INK} strokeWidth="7" strokeLinecap="round" />
    <path d="M158 120 H184" stroke={INK} strokeWidth="7" strokeLinecap="round" />
    <circle cx="168" cy="144" r="7" fill={AMBER} />
    {[156, 292].map(cx => (
      <g key={cx}>
        <circle cx={cx} cy="202" r="28" fill={INK} />
        <circle cx={cx} cy="202" r="12" fill="#E5E7EB" />
        <circle cx={cx} cy="202" r="4" fill={INK} />
      </g>
    ))}
    <Sparkle x={332} y={40} s={9} />
    <circle cx="224" cy="60" r="4" fill={AMBER} />
  </svg>
);
