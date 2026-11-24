/**
 * Skills and services, and the work samples shown when a visitor opens one.
 *
 * `visual` chooses the animated illustration on each card (see components/Services/ServiceVisual.tsx).
 * `samples` are your creatives for that skill. Put the files in /public/work/<skill id>/ and list them
 * here; the card shows how many there are and opens them in a gallery. A skill with no samples yet
 * shows a "coming soon" message instead.
 *
 * Example sample entries:
 *   samples: [
 *     { type: 'image', src: 'work/logo-brand-identity/cafe-logo.webp', alt: 'Logo for a cafe on a coffee cup', title: 'Cafe logo' },
 *     { type: 'video', src: 'work/video/brand-reel.mp4', poster: 'work/video/brand-reel.webp', alt: 'Brand reel', title: 'Brand reel' },
 *     { type: 'image', src: 'work/web/site.webp', alt: 'Homepage design', title: 'Website', href: 'https://example.com' },
 *   ],
 */
export type ServiceVisualKind =
  | 'identity'
  | 'graphic'
  | 'marketing'
  | 'social'
  | 'performance'
  | 'gmb'
  | 'video'
  | 'brochure'
  | 'deck'
  | 'label'
  | 'motion'
  | 'web'
  | 'ai'
  | 'uiux'
  | 'app'
  | 'software';

export interface WorkSample {
  type: 'image' | 'video';
  /** Path in /public (e.g. 'work/web/homepage.webp') or a full URL. */
  src: string;
  /** Describe the creative for screen readers. */
  alt: string;
  /** Short name shown under the creative. */
  title?: string;
  /** Optional extra line: client, year, what you did. Only include what you can share. */
  caption?: string;
  /** Video only: still image shown before playback. */
  poster?: string;
  /** Optional link to the live work, Behance post, etc. */
  href?: string;
}

export interface Service {
  /** Lowercase letters, numbers and hyphens. Also the folder name in /public/work/ and the share link #skill-<id>. */
  id: string;
  title: string;
  description: string;
  deliverables: string[];
  visual: ServiceVisualKind;
  samples: WorkSample[];
}

export const services: Service[] = [
  {
    id: 'logo-brand-identity',
    title: 'Logo Designing & Brand Identity',
    description: 'Logos and identity systems with real personality, made to work everywhere from a visiting card to a billboard.',
    deliverables: ['Logo design', 'Brand guidelines', 'Colour & type'],
    visual: 'identity',
    samples: [],
  },
  {
    id: 'graphic-design',
    title: 'Graphic Designing',
    description: 'Posters, creatives, print and everyday design that look sharp and stay on brand.',
    deliverables: ['Posters & flyers', 'Creatives', 'Print design'],
    visual: 'graphic',
    samples: [],
  },
  {
    id: 'digital-marketing',
    title: 'Digital Marketing',
    description: 'Campaigns across search, social and email that bring the right people to your brand.',
    deliverables: ['Campaign planning', 'SEO', 'Email marketing'],
    visual: 'marketing',
    samples: [],
  },
  {
    id: 'social-media',
    title: 'Social Media Management',
    description: 'Consistent, on-brand pages with planned content, regular posting and a voice people recognise.',
    deliverables: ['Content calendars', 'Posts & reels', 'Page management'],
    visual: 'social',
    samples: [],
  },
  {
    id: 'performance-marketing',
    title: 'Performance Marketing',
    description: 'Paid ads set up around clear goals, tracked properly and improved with every round of data.',
    deliverables: ['Paid social & search', 'Tracking setup', 'A/B testing'],
    visual: 'performance',
    samples: [],
  },
  {
    id: 'gmb',
    title: 'GMB Management',
    description: 'Google Business Profile setup and upkeep, so local customers can find you, trust you and get in touch.',
    deliverables: ['Profile setup', 'Posts & photos', 'Review replies'],
    visual: 'gmb',
    samples: [],
  },
  {
    id: 'video',
    title: 'Video Shoot & Editing',
    description: 'Shoots planned around a story, then edited into reels, ads and brand films that hold attention.',
    deliverables: ['Shoot planning', 'Reels & shorts', 'Editing & colour'],
    visual: 'video',
    samples: [],
  },
  {
    id: 'brochure',
    title: 'Brochure Designing',
    description: 'Brochures and catalogues that explain your offer clearly and feel good in the hand or on screen.',
    deliverables: ['Tri-fold & bi-fold', 'Catalogues', 'Print-ready files'],
    visual: 'brochure',
    samples: [],
  },
  {
    id: 'decks',
    title: 'Presentation & Pitch Deck Design',
    description: 'Decks that make a complex story easy to follow, for investors, clients and stages.',
    deliverables: ['Pitch decks', 'Company profiles', 'Slide templates'],
    visual: 'deck',
    samples: [],
  },
  {
    id: 'product-labels',
    title: 'Product Label Designing',
    description: 'Labels and packaging that stand out on the shelf and still carry every detail they need to.',
    deliverables: ['Label design', 'Packaging', 'Print-ready dielines'],
    visual: 'label',
    samples: [],
  },
  {
    id: 'motion',
    title: 'Motion Graphics & Visual Content',
    description: 'Animated logos, explainers and social motion that give a brand rhythm.',
    deliverables: ['Logo animation', 'Explainers', 'Social motion'],
    visual: 'motion',
    samples: [],
  },
  {
    id: 'web',
    title: 'Website Design & Development',
    description: 'Fast, responsive websites designed around what visitors need, then built and launched properly.',
    deliverables: ['Business websites', 'Landing pages', 'E-commerce'],
    visual: 'web',
    samples: [],
  },
  {
    id: 'ai-automation',
    title: 'AI & Automation',
    description: 'AI tools and automated workflows that take the repetitive work off your plate.',
    deliverables: ['AI chatbots', 'Workflow automation', 'AI content tools'],
    visual: 'ai',
    samples: [],
  },
  {
    id: 'ui-ux',
    title: 'UI UX Designing',
    description: 'Interfaces that feel obvious to use, from user flows and wireframes to polished screens.',
    deliverables: ['User flows', 'Wireframes', 'UI & prototypes'],
    visual: 'uiux',
    samples: [],
  },
  {
    id: 'app-development',
    title: 'App Development',
    description: 'Mobile apps designed and built for real users, from the first idea to launch.',
    deliverables: ['Mobile apps', 'App UI', 'Testing & launch'],
    visual: 'app',
    samples: [],
  },
  {
    id: 'software-development',
    title: 'Software Development',
    description: 'Custom software and web tools built around the way your business actually works.',
    deliverables: ['Custom tools', 'Dashboards', 'Integrations'],
    visual: 'software',
    samples: [],
  },
];
