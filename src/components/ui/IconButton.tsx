import type { ReactNode } from 'react';

import { Button, type ButtonProps } from './Button.tsx';
import './ui.css';

export type IconButtonProps = Omit<ButtonProps, 'children'> & {
  'aria-label': string;
  children: ReactNode;
};

export function IconButton({ children, className, ...props }: IconButtonProps) {
  const classes = ['hatka-icon-button', className].filter(Boolean).join(' ');

  return (
    <Button {...props} className={classes}>
      <span className="hatka-icon" aria-hidden="true">
        {children}
      </span>
    </Button>
  );
}
