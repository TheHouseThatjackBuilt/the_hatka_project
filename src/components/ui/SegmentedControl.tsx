import { useId, type ChangeEvent } from 'react';

import './segmented-control.css';

export type SegmentedControlOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SegmentedControlProps = {
  label: string;
  options: readonly SegmentedControlOption[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md';
};

export function SegmentedControl({
  label,
  options,
  value,
  onValueChange,
  disabled = false,
  orientation = 'horizontal',
  size = 'md',
}: SegmentedControlProps) {
  const groupId = useId();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.currentTarget.disabled) {
      onValueChange(event.currentTarget.value);
    }
  };

  return (
    <fieldset
      className={`hatka-segmented hatka-segmented--${orientation} hatka-segmented--${size}`}
      disabled={disabled}
    >
      <legend className="hatka-segmented-legend">{label}</legend>
      {options.map((option, index) => {
        const id = `${groupId}-${index}`;
        return (
          <label className="hatka-segmented-option" key={option.value} htmlFor={id}>
            <input
              id={id}
              className="hatka-segmented-input"
              type="radio"
              name={groupId}
              value={option.value}
              checked={option.value === value}
              disabled={option.disabled}
              onChange={handleChange}
            />
            <span className="hatka-segmented-label">{option.label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
