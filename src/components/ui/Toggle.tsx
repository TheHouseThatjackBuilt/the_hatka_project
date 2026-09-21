import { useId, type ChangeEvent, type ComponentProps } from 'react';

import './ui.css';

export type ToggleProps = Omit<
  ComponentProps<'input'>,
  'type' | 'role' | 'checked' | 'defaultChecked' | 'onChange' | 'children'
> & {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function Toggle({
  label,
  checked,
  onCheckedChange,
  className,
  id: providedId,
  ...props
}: ToggleProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const classes = ['hatka-toggle', className].filter(Boolean).join(' ');
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onCheckedChange(event.currentTarget.checked);
  };

  return (
    <label className={classes} htmlFor={id}>
      <input
        {...props}
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={handleChange}
        className="hatka-toggle-input"
      />
      <span className="hatka-toggle-track" aria-hidden="true" />
      <span className="hatka-toggle-label">{label}</span>
    </label>
  );
}
