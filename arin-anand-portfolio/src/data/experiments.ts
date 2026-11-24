/**
 * Creative experiments.
 * `modes` are the live, interactive pieces inside the playground (built in code).
 * `entries` is your own list of experimental work - placeholders until you add real pieces.
 * Give an entry an `href` (a video, Behance post, CodePen…) to make it clickable.
 */
export type PlaygroundMode = 'gravity' | 'constellation' | 'nebula' | 'warp';

export interface PlaygroundModeInfo {
  id: PlaygroundMode;
  title: string;
  hint: string;
  touchHint: string;
}

export const playgroundModes: PlaygroundModeInfo[] = [
  {
    id: 'gravity',
    title: 'Gravity well',
    hint: 'Move to pull the particles. Click to drop a new star.',
    touchHint: 'Drag to pull the particles. Tap to drop a new star.',
  },
  {
    id: 'constellation',
    title: 'Constellations',
    hint: 'Move across the sky to link nearby stars. Click a star to pin it.',
    touchHint: 'Drag across the sky to link stars. Tap a star to pin it.',
  },
  {
    id: 'nebula',
    title: 'Nebula brush',
    hint: 'Paint glowing gas with your pointer. Click for a burst.',
    touchHint: 'Paint glowing gas with your finger. Tap for a burst.',
  },
  {
    id: 'warp',
    title: 'Warp drive',
    hint: 'Steer with your pointer. Hold the button down to jump to light speed.',
    touchHint: 'Drag to steer. Hold to jump to light speed.',
  },
];

export interface ExperimentEntry {
  title: string;
  kind: 'Visual design' | 'Motion graphics' | '3D concept' | 'Interactive web' | 'Creative technology';
  description: string;
  href: string;
}

export const experimentEntries: ExperimentEntry[] = [
  {
    title: 'Experimental visual series',
    kind: 'Visual design',
    description: 'Placeholder - posters, type studies and visual explorations.',
    href: '',
  },
  {
    title: 'Motion studies',
    kind: 'Motion graphics',
    description: 'Placeholder - loops, transitions and animated identities.',
    href: '',
  },
  {
    title: '3D concepts',
    kind: '3D concept',
    description: 'Placeholder - renders, product concepts and spatial ideas.',
    href: '',
  },
  {
    title: 'Interactive web pieces',
    kind: 'Interactive web',
    description: 'Placeholder - small sites and browser toys like the one above.',
    href: '',
  },
  {
    title: 'Creative technology',
    kind: 'Creative technology',
    description: 'Placeholder - tools, automations and AI-assisted workflows.',
    href: '',
  },
];
