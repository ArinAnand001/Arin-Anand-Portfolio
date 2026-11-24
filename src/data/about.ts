/**
 * About section content and photos.
 * Photos live in /public/about/. To swap one, replace the file (or point `src` at a new one)
 * and update the width/height so the layout reserves the right space while it loads.
 */
export interface AboutPhoto {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export const about = {
  statement:
    'I work where design, strategy, marketing and technology meet, building brands that look the part and do the work.',
  intro:
    "I'm Arin Anand, a graphic designer and performance marketer who also builds. I start with the business behind a brand, then turn it into identities, websites and campaigns that people notice and act on.",
  pillars: [
    {
      title: 'Design',
      text: 'Identity, layout and motion with a clear point of view. Craft matters, because people decide quickly.',
    },
    {
      title: 'Business thinking',
      text: 'Every project starts with the goal behind it: who it is for, what should change and how we will know.',
    },
    {
      title: 'Marketing',
      text: 'Performance marketing keeps the work honest. Campaigns are planned, measured and improved with real data.',
    },
    {
      title: 'Technology',
      text: 'Websites, apps, AI tools and automations, so good ideas leave the page and go live.',
    },
  ],
  roles: ['Graphic Designer', 'Performance Marketer', 'Digital Strategist', 'Creative Thinker', 'Digital Agency Builder'],
  photos: {
    main: {
      src: 'about/arin-portrait.webp',
      alt: 'Black-and-white portrait of Arin Anand in sunglasses and a dark blazer',
      width: 1080,
      height: 1246,
    } as AboutPhoto,
  },
};
