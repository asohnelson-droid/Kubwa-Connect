import React from 'react';
import { AppSection } from '../types';

/** Footer links to About, FAQ, Contact, Terms and Privacy. */
const HelpLinks: React.FC<{ setSection: (s: AppSection) => void; className?: string }> = ({ setSection, className = '' }) => {
  const links: { label: string; section: AppSection }[] = [
    { label: 'About', section: AppSection.ABOUT },
    { label: 'FAQ', section: AppSection.FAQ },
    { label: 'Contact', section: AppSection.CONTACT },
    { label: 'Terms', section: AppSection.TERMS },
    { label: 'Privacy', section: AppSection.PRIVACY },
  ];
  return (
    <nav aria-label="Help and legal" className={`flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-bold text-gray-500 ${className}`}>
      {links.map(l => (
        <button key={l.label} type="button" onClick={() => setSection(l.section)} className="hover:text-kubwa-primary underline-offset-2 hover:underline">
          {l.label}
        </button>
      ))}
    </nav>
  );
};

export default HelpLinks;
