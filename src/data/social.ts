/**
 * Social and profile links.
 * Paste the full profile URL into `href` to make an entry clickable.
 * `handle` is the name shown next to the network (e.g. your profile name).
 * Entries with neither an href nor a handle are hidden, so nothing on the site points nowhere.
 * Add, remove or reorder entries freely; `icon` picks the glyph (see components/shared/Icon.tsx).
 */
export type SocialIcon = 'linkedin' | 'instagram' | 'behance' | 'dribbble' | 'x' | 'github' | 'youtube' | 'link';

export interface SocialLink {
  label: string;
  href: string;
  handle?: string;
  icon: SocialIcon;
}

export const socials: SocialLink[] = [
  // Add your LinkedIn profile URL to href, e.g. 'https://www.linkedin.com/in/your-name/'
  { label: 'LinkedIn', href: '', handle: 'Arin Anand', icon: 'linkedin' },
  { label: 'Instagram', href: '', icon: 'instagram' },
  { label: 'Behance', href: '', icon: 'behance' },
  // More examples - uncomment and fill in:
  // { label: 'Dribbble', href: '', icon: 'dribbble' },
  // { label: 'X', href: '', icon: 'x' },
  // { label: 'GitHub', href: '', icon: 'github' },
  // { label: 'YouTube', href: '', icon: 'youtube' },
];

/** Socials worth showing: anything with a link or a handle. */
export const visibleSocials = socials.filter((s) => s.href.trim() || s.handle?.trim());
