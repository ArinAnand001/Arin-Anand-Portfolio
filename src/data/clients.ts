/**
 * Companies you've worked with, shown after "How I work".
 * The logo assets are stored in the repository's "Client's Logo" folder.
 * They are loaded from GitHub's raw asset endpoint so the source files stay unchanged.
 */
export interface ClientLogo {
  name: string;
  /** Absolute image URL or path in /public. */
  logo?: string;
  /** Optional link to the company's site. */
  href?: string;
  keepColors?: boolean;
}

const logoBase =
  "https://raw.githubusercontent.com/ArinAnand001/Arin-Anand-Portfolio/main/Client%27s%20Logo/";

export const clients: ClientLogo[] = Array.from({ length: 10 }, (_, index) => ({
  name: `Client ${index + 1}`,
  logo: `${logoBase}${index + 1}.png`,
}));

/**
 * The headline number, e.g. 25 shows "25+ companies".
 * Leave at 0 to count the logos above automatically.
 */
export const companiesCount = 0;

/** Text next to the number. */
export const companiesLabel = 'companies and brands I have worked with';
