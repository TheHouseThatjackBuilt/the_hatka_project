import type { ComponentProps } from 'react';

import './ui.css';

export type StatusBadgeProps = ComponentProps<'span'>;

export function StatusBadge({ className, ...props }: StatusBadgeProps) {
  const classes = ['hatka-status', className].filter(Boolean).join(' ');

  return <span {...props} className={classes} />;
}
