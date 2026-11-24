/**
 * Blog / journal entries. These are placeholders - replace them with real posts.
 * Set `href` to the full article URL (Medium, Substack, LinkedIn, your own blog…).
 * Entries without an href are shown as "In the works" and are not clickable.
 */
export interface BlogPost {
  title: string;
  excerpt: string;
  topic: string;
  /** Publication date as YYYY-MM-DD. Leave empty for drafts. */
  date: string;
  href: string;
}

export const blogPosts: BlogPost[] = [
  {
    title: 'Where design and performance meet',
    excerpt: 'Placeholder - a post about making work that looks right and also does its job.',
    topic: 'Design × Marketing',
    date: '',
    href: '',
  },
  {
    title: 'Building a brand from a blank page',
    excerpt: 'Placeholder - notes on the first weeks of an identity project.',
    topic: 'Branding',
    date: '',
    href: '',
  },
  {
    title: 'Small experiments, big lessons',
    excerpt: 'Placeholder - why quick prototypes beat long debates.',
    topic: 'Creative technology',
    date: '',
    href: '',
  },
];
