import React from 'react';
import { Mail, MapPin, ShieldCheck } from 'lucide-react';
import BrandMark from './BrandMark';
import { BRAND } from '../config/brand';
import { AppSection } from '../types';

type PartnerRole = 'VENDOR' | 'PROVIDER' | 'RIDER';

interface SiteFooterProps {
  setSection: (section: AppSection) => void;
  /** Starts the vendor, artisan or rider sign-up. */
  onPartner: (role: PartnerRole) => void;
}

interface FooterLink { label: string; onClick: () => void }

const Column: React.FC<{ title: string; links: FooterLink[] }> = ({ title, links }) => (
  <nav aria-label={title}>
    <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4">{title}</h3>
    <ul className="space-y-2.5">
      {links.map(link => (
        <li key={link.label}>
          <button
            type="button"
            onClick={link.onClick}
            className="text-sm font-semibold text-white/80 hover:text-white hover:underline underline-offset-4 text-left"
          >
            {link.label}
          </button>
        </li>
      ))}
    </ul>
  </nav>
);

/** Site footer: brand, service links, partner sign-ups, help and legal. */
const SiteFooter: React.FC<SiteFooterProps> = ({ setSection, onPartner }) => {
  const go = (section: AppSection) => () => setSection(section);

  const columns: { title: string; links: FooterLink[] }[] = [
    {
      title: 'Services',
      links: [
        { label: 'Mart', onClick: go(AppSection.MART) },
        { label: 'FixIt', onClick: go(AppSection.FIXIT) },
        { label: 'Ride', onClick: go(AppSection.RIDE) },
        { label: 'Cities we serve', onClick: go(AppSection.CITIES) },
      ],
    },
    {
      title: 'Earn with us',
      links: [
        { label: 'Sell on ' + BRAND.name, onClick: () => onPartner('VENDOR') },
        { label: 'Offer your skills', onClick: () => onPartner('PROVIDER') },
        { label: 'Ride and earn', onClick: () => onPartner('RIDER') },
      ],
    },
    {
      title: 'Help',
      links: [
        { label: 'How it works', onClick: go(AppSection.HOW_IT_WORKS) },
        { label: 'Safety tips', onClick: go(AppSection.SAFETY) },
        { label: 'FAQ', onClick: go(AppSection.FAQ) },
        { label: 'Contact us', onClick: go(AppSection.CONTACT) },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About us', onClick: go(AppSection.ABOUT) },
        { label: 'Terms of Service', onClick: go(AppSection.TERMS) },
        { label: 'Privacy Policy', onClick: go(AppSection.PRIVACY) },
      ],
    },
  ];

  return (
    <footer className="mt-16 bg-kubwa-ink text-white rounded-t-[2.5rem] md:rounded-[2.5rem] px-6 pt-12 pb-8 md:px-12 md:pt-14 lg:px-14">
      <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)] md:gap-8">
        <div className="max-w-xs">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-10 rounded-xl bg-white/10 p-2 flex items-center justify-center">
              <BrandMark className="w-full h-full" />
            </span>
            <span className="font-display text-xl font-bold tracking-tight">{BRAND.name}</span>
          </div>
          <p className="text-sm text-white/70 font-medium leading-relaxed">{BRAND.tagline} Shop, hire artisans and send packages, all from people near you.</p>
          <ul className="mt-5 space-y-2 text-sm font-semibold text-white/80">
            <li>
              <a href={`mailto:${BRAND.supportEmail}`} className="inline-flex items-center gap-2 hover:text-white hover:underline underline-offset-4">
                <Mail size={16} className="text-kubwa-primary" /> {BRAND.supportEmail}
              </a>
            </li>
            <li className="inline-flex items-center gap-2">
              <MapPin size={16} className="text-kubwa-primary" /> {BRAND.city}, {BRAND.country}
            </li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 md:contents">
          {columns.map(col => <Column key={col.title} title={col.title} links={col.links} />)}
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-white/10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-xs font-semibold text-white/60">
        <p>&copy; {new Date().getFullYear()} {BRAND.legalName}. All rights reserved.</p>
        <p className="inline-flex items-center gap-2">
          <ShieldCheck size={14} className="text-kubwa-mart" /> Online payments secured by Paystack
        </p>
      </div>
    </footer>
  );
};

export default SiteFooter;
