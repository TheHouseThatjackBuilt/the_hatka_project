import type { ComponentProps } from 'react';

import './ui.css';

export type FloatingPanelProps = ComponentProps<'div'>;

export function FloatingPanel({ className, ...props }: FloatingPanelProps) {
  const classes = ['hatka-panel', className].filter(Boolean).join(' ');

  return <div {...props} className={classes} />;
}
