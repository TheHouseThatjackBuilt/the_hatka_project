import type { ComponentProps } from 'react';

import './ui.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md';

export type ButtonProps = ComponentProps<'button'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  const classes = ['hatka-button', `hatka-button--${variant}`, `hatka-control--${size}`, className]
    .filter(Boolean)
    .join(' ');

  return <button {...props} type={type} className={classes} />;
}
