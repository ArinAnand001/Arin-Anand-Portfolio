import { useRef, type MouseEvent, type ReactNode } from 'react';
import { useMagnetic } from '../../hooks/useMagnetic';
import { cn } from '../../lib/utils';
import { Icon, type IconName } from './Icon';

interface ButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  variant?: 'primary' | 'ghost';
  size?: 'md' | 'sm';
  icon?: IconName;
  magnetic?: boolean;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
  external?: boolean;
  'aria-describedby'?: string;
}

/**
 * Pill button or link. Magnetic by default on mouse/trackpad devices.
 * Renders an <a> when given an href, otherwise a <button>.
 */
export function Button({
  children,
  href,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  magnetic = true,
  type = 'button',
  disabled,
  className,
  external,
  ...rest
}: ButtonProps) {
  const wrap = useRef<HTMLSpanElement>(null);
  useMagnetic(wrap, magnetic ? (size === 'sm' ? 0.22 : 0.3) : 0);

  const classes = cn('btn', `btn--${variant}`, size === 'sm' && 'btn--sm', className);
  const content = (
    <span className="btn__label" data-magnetic-inner>
      {children}
      {icon && <Icon name={icon} className="btn__icon" size={16} />}
    </span>
  );

  return (
    <span className="magnetic" ref={wrap}>
      {href ? (
        <a
          className={classes}
          href={href}
          onClick={onClick}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          {...rest}
        >
          {content}
        </a>
      ) : (
        <button className={classes} type={type} onClick={onClick} disabled={disabled} {...rest}>
          {content}
        </button>
      )}
    </span>
  );
}
