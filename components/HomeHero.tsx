import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import BrandMark from './BrandMark';
import { cn } from './cn';
import { BRAND } from '../config/brand';
import { SellArt, MartArt, FixItArt, RideArt } from './Illustrations';

export type HeroSlideId = 'sell' | 'mart' | 'fixit' | 'ride';

interface SlideDef {
  id: HeroSlideId;
  eyebrow: string;
  title: string;
  text: string;
  cta: string;
  Art: React.FC;
  bg: string;
  dark: boolean; // true when the slide uses dark text on a light background
}

const SLIDES: SlideDef[] = [
  {
    id: 'sell',
    eyebrow: 'Sell Am Here',
    title: 'Got something to sell? Sell am here.',
    text: 'Open a free shop in minutes and reach buyers across your city and beyond.',
    cta: 'Start selling',
    Art: SellArt,
    bg: 'bg-gradient-to-br from-[#E2431F] to-[#FF5A36]',
    dark: false,
  },
  {
    id: 'mart',
    eyebrow: 'Mart',
    title: 'Shop quality products from sellers near you.',
    text: 'Groceries, fashion, gadgets and more from verified vendors, with secure payment.',
    cta: 'Browse the Mart',
    Art: MartArt,
    bg: 'bg-gradient-to-br from-[#15803D] to-[#16A34A]',
    dark: false,
  },
  {
    id: 'fixit',
    eyebrow: 'FixIt',
    title: 'Find trusted artisans near you, in minutes.',
    text: 'Plumbers, electricians, cleaners, mechanics and more, with clear rates and reviews.',
    cta: 'Find an artisan',
    Art: FixItArt,
    bg: 'bg-gradient-to-br from-[#F59E0B] to-[#FBBF24]',
    dark: true,
  },
  {
    id: 'ride',
    eyebrow: 'Ride',
    title: 'Send and track packages across your city.',
    text: 'See your price upfront, then follow your rider from pickup to drop-off.',
    cta: 'Book a delivery',
    Art: RideArt,
    bg: 'bg-gradient-to-br from-[#1D4ED8] to-[#2563EB]',
    dark: false,
  },
];

const INTERVAL_MS = 6000;

interface HomeHeroProps {
  onAction: (slide: HeroSlideId) => void;
  /** The search bar, shown under every slide. */
  children?: React.ReactNode;
}

/**
 * Home page hero: four illustrated slides (Sell, Mart, FixIt, Ride) that
 * cross-fade on a timer. Pauses on hover, focus or when the tab is hidden,
 * supports swiping on phones, and stays still for people who prefer reduced motion.
 */
const HomeHero: React.FC<HomeHeroProps> = ({ onAction, children }) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchX = useRef<number | null>(null);
  const active = SLIDES[index];

  const go = useCallback((next: number) => setIndex((next + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') setIndex(i => (i + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [paused, reducedMotion, index]);

  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
  };

  const fade = reducedMotion ? '' : 'transition-all duration-700 ease-out';

  return (
    <section
      aria-roledescription="carousel"
      aria-label={`What you can do on ${BRAND.name}`}
      className="relative overflow-hidden rounded-b-[2.5rem] shadow-2xl md:rounded-[2.5rem] md:mt-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* cross-fading backgrounds */}
      {SLIDES.map((s, i) => (
        <div key={s.id} aria-hidden="true" className={cn('absolute inset-0', s.bg, fade, i === index ? 'opacity-100' : 'opacity-0')} />
      ))}
      <div aria-hidden="true" className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-2xl" />
      <div aria-hidden="true" className="absolute -bottom-24 -left-16 w-60 h-60 rounded-full bg-black/10 blur-2xl" />

      <div className="relative z-10 px-6 pt-12 pb-7 md:px-12 md:pt-12 md:pb-10 lg:px-14">
        <div className={cn('flex items-center gap-3 mb-5 md:hidden', fade, active.dark ? 'text-kubwa-ink' : 'text-white')}>
          <div className="bg-white p-2 rounded-2xl shadow-xl -rotate-6">
            <BrandMark className="w-[22px] h-[22px]" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">{BRAND.name}</span>
        </div>

        <div className="grid items-center gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:gap-8">
          {/* illustrations */}
          <div className="grid order-first md:order-none md:col-start-2 w-full max-w-[260px] mx-auto h-36 md:max-w-none md:w-72 md:h-52 lg:w-96 lg:h-64">
            {SLIDES.map((s, i) => (
              <div
                key={s.id}
                aria-hidden="true"
                className={cn('[grid-area:1/1]', fade, i === index ? 'opacity-100 scale-100' : 'opacity-0 scale-95')}
              >
                <s.Art />
              </div>
            ))}
          </div>

          {/* words */}
          <div className="grid md:col-start-1 md:row-start-1">
            {SLIDES.map((s, i) => {
              const isActive = i === index;
              return (
                <div
                  key={s.id}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${SLIDES.length}: ${s.eyebrow}`}
                  aria-hidden={!isActive}
                  inert={!isActive}
                  className={cn('[grid-area:1/1] flex flex-col justify-center', fade,
                    isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none')}
                >
                  <p className={cn('text-[11px] md:text-xs font-bold uppercase tracking-widest mb-2', s.dark ? 'text-kubwa-ink/75' : 'text-white/80')}>{s.eyebrow}</p>
                  <h1 className={cn('font-display text-[1.65rem] leading-[1.15] font-bold md:text-4xl lg:text-5xl md:leading-[1.08] md:max-w-xl', s.dark ? 'text-kubwa-ink' : 'text-white')}>
                    {s.title}
                  </h1>
                  <p className={cn('hidden md:block mt-4 text-base font-medium max-w-lg', s.dark ? 'text-kubwa-ink/80' : 'text-white/85')}>{s.text}</p>
                  <div className="mt-4 md:mt-6">
                    <button
                      type="button"
                      onClick={() => onAction(s.id)}
                      className={cn('inline-flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 rounded-2xl text-sm font-bold shadow-lg transition-transform hover:-translate-y-0.5 active:scale-95',
                        s.dark ? 'bg-kubwa-ink text-white' : 'bg-white text-kubwa-ink')}
                    >
                      {s.cta} <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* slide dots */}
        <div className="flex items-center gap-2 mt-5 md:mt-6" role="tablist" aria-label="Choose a slide">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show ${s.eyebrow}`}
              onClick={() => go(i)}
              className={cn('h-2 rounded-full transition-all duration-300',
                i === index ? 'w-7' : 'w-2 opacity-50 hover:opacity-80',
                active.dark ? 'bg-kubwa-ink' : 'bg-white')}
            />
          ))}
        </div>

        {children && <div className="mt-6 md:mt-8">{children}</div>}
      </div>
    </section>
  );
};

export default HomeHero;
