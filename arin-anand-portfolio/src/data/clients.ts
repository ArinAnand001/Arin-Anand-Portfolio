/**
 * Companies you've worked with, shown after "How I work".
 *
 * Put logo files in /public/clients/ (SVG or transparent PNG/WebP work best) and add one entry each:
 *   { name: 'Vijaya Grand', logo: 'clients/vijaya-grand.png' },
 *   { name: 'Acme Studio', logo: 'clients/acme.svg', href: 'https://acme.example' },
 *   { name: 'Company without a logo file' },          // shown as a text logo
 *
 * Logos are shown as white silhouettes so every brand sits evenly on the dark background,
 * and light up in full colour on hover. Set `keepColors: true` for a logo that needs its own colours
 * all the time (for example one that sits on its own coloured badge).
 */
export interface ClientLogo {
  name: string;
  /** Path in /public, e.g. 'clients/acme.svg'. Leave out to show the name as a text logo. */
  logo?: string;
  /** Optional link to the company's site. */
  href?: string;
  keepColors?: boolean;
}

export const clients: ClientLogo[] = [];

/**
 * The headline number, e.g. 25 shows "25+ companies".
 * Leave at 0 to count the logos above automatically.
 */
export const companiesCount = 0;

/** Text next to the number. */
export const companiesLabel = 'companies and brands I have worked with';
