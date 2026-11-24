import type { ReactNode, SVGProps } from 'react';

export type IconName =
  | 'arrow'
  | 'arrow-up'
  | 'arrow-down'
  | 'close'
  | 'menu'
  | 'mail'
  | 'phone'
  | 'external'
  | 'play'
  | 'sparkle'
  | 'linkedin'
  | 'instagram'
  | 'behance'
  | 'dribbble'
  | 'x'
  | 'github'
  | 'youtube'
  | 'link';

const paths: Record<IconName, ReactNode> = {
  arrow: <path d="M5 19 19 5M8 5h11v11" />,
  'arrow-up': <path d="M12 20V4M5 11l7-7 7 7" />,
  'arrow-down': <path d="M12 4v16M5 13l7 7 7-7" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M4 8h16M4 16h16" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  phone: (
    <path d="M5 4h3.5l1.8 4.4-2.2 1.4a11 11 0 0 0 6.1 6.1l1.4-2.2L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5C10.6 20 4 13.4 3.5 5.6A1.5 1.5 0 0 1 5 4Z" />
  ),
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />,
  play: <path d="M8 5.5v13l11-6.5-11-6.5Z" />,
  sparkle: <path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7Z" />,
  linkedin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M7.5 10.5V17M7.5 7.2v.1M11.5 17v-6.5M11.5 13.2c0-1.6 1-2.7 2.5-2.7s2.5 1 2.5 2.7V17" />
    </>
  ),
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5.5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.3 6.7v.1" />
    </>
  ),
  behance: (
    <path d="M3 7h5a2.5 2.5 0 0 1 0 5H3V7Zm0 5h5.5a2.5 2.5 0 0 1 0 5H3v-5ZM14.5 13.5h7c0-2.4-1.5-4-3.5-4s-3.5 1.6-3.5 3.8 1.5 3.7 3.6 3.7c1.4 0 2.5-.7 3-1.8M15 6.5h5" />
  ),
  dribbble: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 4.2c3.5 4.4 6 9.6 7.6 16M3.3 10.4c5.6.4 10.5-.8 14.6-4.3M6 18.6c3-4 7.6-6 14.8-4.6" />
    </>
  ),
  x: <path d="M4 4l16 16M20 4 4 20" />,
  github: (
    <path d="M9 19c-4 1.3-4-2-6-2.5m12 5v-3.3a2.9 2.9 0 0 0-.8-2.2c2.7-.3 5.5-1.3 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.5 2.3 5.5 2.6 5.5 2.6a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9c0 4.6 2.8 5.6 5.5 6a2.9 2.9 0 0 0-.8 2.2V21.5" />
  ),
  youtube: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="M10 9.3v5.4l4.6-2.7L10 9.3Z" />
    </>
  ),
  link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 18, className, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
