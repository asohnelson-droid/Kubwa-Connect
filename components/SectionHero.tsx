import React from 'react';
import { cn } from './cn';
import { MartArt, FixItArt, RideArt } from './Illustrations';

type HeroVariant = 'mart' | 'fixit' | 'ride';

interface SectionHeroProps {
  variant: HeroVariant;
  className?: string;
}

const COPY: Record<HeroVariant, { eyebrow: string; title: string; text: string; chips: string[] }> = {
  mart: {
    eyebrow: 'Sell Am Here Mart',
    title: 'Shop from sellers near you',
    text: 'Groceries, fashion, electronics and more from verified local vendors. Pay securely and get it delivered in your city.',
    chips: ['Verified vendors', 'Secure payment', 'Same-city delivery'],
  },
  fixit: {
    eyebrow: 'FixIt Services',
    title: 'Hire trusted hands for any job',
    text: 'Plumbers, electricians, cleaners, mechanics and more. Compare rates and reviews, then book in a few taps.',
    chips: ['Reviewed artisans', 'Clear rates', 'Book in minutes'],
  },
  ride: {
    eyebrow: 'Ride Deliveries',
    title: 'Send packages across your city',
    text: 'Request a rider, see your price upfront and track your delivery from pickup to drop-off.',
    chips: ['Upfront pricing', 'Live tracking', 'Vetted riders'],
  },
};

const THEME: Record<HeroVariant, { bg: string; text: string; sub: string; chip: string }> = {
  mart: {
    bg: 'bg-gradient-to-br from-[#15803D] to-[#16A34A]',
    text: 'text-white',
    sub: 'text-white/85',
    chip: 'bg-white/15 text-white',
  },
  fixit: {
    bg: 'bg-gradient-to-br from-[#F59E0B] to-[#FBBF24]',
    text: 'text-kubwa-ink',
    sub: 'text-kubwa-ink/80',
    chip: 'bg-kubwa-ink/10 text-kubwa-ink',
  },
  ride: {
    bg: 'bg-gradient-to-br from-[#1D4ED8] to-[#2563EB]',
    text: 'text-white',
    sub: 'text-white/85',
    chip: 'bg-white/15 text-white',
  },
};

const ART: Record<HeroVariant, React.FC> = { mart: MartArt, fixit: FixItArt, ride: RideArt };

/**
 * Illustrated banner at the top of Mart, FixIt and Ride.
 * Shown from md (768px) up only; phones keep the compact header.
 */
const SectionHero: React.FC<SectionHeroProps> = ({ variant, className }) => {
  const copy = COPY[variant];
  const theme = THEME[variant];
  const Art = ART[variant];
  return (
    <section
      aria-label={copy.eyebrow}
      className={cn('hidden md:flex relative overflow-hidden rounded-[2rem] mb-6 px-8 lg:px-10 py-8 items-center gap-6', theme.bg, className)}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute right-40 -bottom-24 w-56 h-56 rounded-full bg-white/10" />
      <div className="relative flex-1 min-w-0">
        <p className={cn('text-xs font-bold uppercase tracking-widest mb-2', theme.sub)}>{copy.eyebrow}</p>
        <h1 className={cn('font-display text-3xl lg:text-4xl font-bold tracking-tight leading-tight', theme.text)}>{copy.title}</h1>
        <p className={cn('mt-3 text-sm lg:text-base font-medium max-w-md', theme.sub)}>{copy.text}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {copy.chips.map(chip => (
            <span key={chip} className={cn('px-3 py-1.5 rounded-full text-xs font-bold', theme.chip)}>{chip}</span>
          ))}
        </div>
      </div>
      <div className="relative shrink-0 w-60 lg:w-80 h-44 lg:h-56">
        <Art />
      </div>
    </section>
  );
};

export default SectionHero;
