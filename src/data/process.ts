/** "How I work" stages, shown in order. */
export interface ProcessStep {
  title: string;
  description: string;
}

export const process: ProcessStep[] = [
  {
    title: 'Discover',
    description: 'Listening first: the goals, the audience, the market and what has been tried before.',
  },
  {
    title: 'Strategize',
    description: 'Turning what we learned into a clear direction, a plan and a way to measure success.',
  },
  {
    title: 'Design',
    description: 'Exploring ideas widely, then refining one into an identity, interface or campaign.',
  },
  {
    title: 'Develop',
    description: 'Building it properly: websites, assets, content and campaigns ready for real use.',
  },
  {
    title: 'Launch',
    description: 'Putting the work in front of people with care, tracking in place from day one.',
  },
  {
    title: 'Optimize',
    description: 'Reading the results, learning what works and improving it round after round.',
  },
];
