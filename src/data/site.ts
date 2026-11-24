/**
 * Site-wide settings. Edit these values - no component changes needed.
 *
 * Anything left as an empty string is treated as "not set yet":
 * the site hides it or shows a quiet placeholder instead of a broken link.
 */
export const site = {
  /** The closing feature in the footer: a photo, then a line of text. */
  footer: {
    photo: {
      src: 'about/arin-vijaya-grand.webp',
      alt: 'Arin Anand seated on a lounge sofa beneath a backlit Vijaya Grand sign',
      width: 640,
      height: 800,
    },
    tagline: 'Brands, websites, campaigns and experiments',
  },

  name: 'Arin Anand',
  role: 'Creative thinker, designer and performance marketer',
  shortBio:
    'Creative thinker, designer and performance marketer combining creativity, strategy and technology to build meaningful brands and digital experiences.',

  contact: {
    /** Public email address. Shown on the site and used by the contact form. */
    email: 'arinanand001@gmail.com',
    /** Phone number, written the way it should appear on the site. Leave empty to hide. */
    phone: '+91 7258955061',
    /**
     * Optional form endpoint that accepts a JSON POST (Formspree, Getform, Basin, your own API...).
     * Example: 'https://formspree.io/f/xxxxxxx'. When empty, the form opens the visitor's email
     * app addressed to `email` above.
     */
    formEndpoint: '',
    /** Optional line under the contact headline, e.g. a city or time zone. Leave empty to hide. */
    location: '',
    /** Shown next to the form. Keep it true to what you can actually offer. */
    availability: 'Open to new projects and collaborations.',
  },
};

/** tel: link for a phone number written with spaces. */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

export interface NavItem {
  id: string;
  label: string;
}

/** Header navigation. Each id must match a section id on the page. */
export const nav: NavItem[] = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'services', label: 'Services' },
  { id: 'clients', label: 'Clients' },
  { id: 'blog', label: 'Blog' },
  { id: 'contact', label: 'Contact' },
];

/** Sections that are not in the menu light up the nearest menu item before them. */
export const sectionToNav: Record<string, string> = {
  home: 'home',
  about: 'about',
  services: 'services',
  process: 'services',
  clients: 'clients',
  experiments: 'clients',
  blog: 'blog',
  contact: 'contact',
};
