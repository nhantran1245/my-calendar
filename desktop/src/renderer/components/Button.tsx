import React from 'react';
import { Icon } from './Icon';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize    = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: Parameters<typeof Icon>[0]['name'];
  iconPosition?: 'left' | 'right';
  kbd?: string;
  loading?: boolean;
}

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '4px 10px', fontSize: 12, height: 28, gap: 5 },
  md: { padding: '7px 14px', fontSize: 13, height: 34, gap: 7 },
  lg: { padding: '9px 18px', fontSize: 14, height: 40, gap: 8 },
};

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary:   { background: 'var(--accent)',  color: 'var(--accent-fg)', border: 'none' },
  secondary: { background: 'var(--bg-0)',    color: 'var(--fg-0)',      border: '1px solid var(--border)' },
  ghost:     { background: 'transparent',    color: 'var(--fg-1)',      border: 'none' },
  danger:    { background: 'var(--danger-tint)', color: 'var(--danger)', border: '1px solid transparent' },
};

const hoverStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary:   { opacity: 0.9 },
  secondary: { background: 'var(--bg-1)' },
  ghost:     { background: 'var(--bg-hover)' },
  danger:    { background: 'var(--danger-tint)', opacity: 0.8 },
};

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconPosition = 'left',
  kbd,
  loading,
  children,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const [hovered, setHovered] = React.useState(false);

  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition: `background var(--dur-fast) var(--ease-out), opacity var(--dur-fast) var(--ease-out)`,
    whiteSpace: 'nowrap',
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...(hovered && !disabled && !loading ? hoverStyles[variant] : {}),
    ...style,
  };

  const iconSize = size === 'sm' ? 13 : size === 'lg' ? 17 : 15;
  const strokeWidth = variant === 'primary' ? 2.2 : 1.8;

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      style={base}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {icon && iconPosition === 'left' && (
        <Icon name={icon} size={iconSize} strokeWidth={strokeWidth} />
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <Icon name={icon} size={iconSize} strokeWidth={strokeWidth} />
      )}
      {kbd && (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          opacity: 0.65,
          padding: '1px 5px',
          background: 'rgba(255,255,255,0.18)',
          borderRadius: 3,
          marginLeft: 4,
        }}>
          {kbd}
        </span>
      )}
    </button>
  );
}
