import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { matchOption, moveOption, type SelectOption } from './select-navigation.ts';
import './select.css';

export type { SelectOption } from './select-navigation.ts';
export type SelectProps = {
  label: string;
  options: readonly SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  className?: string;
  'aria-describedby'?: string;
};

export function Select({
  label,
  options,
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Выберите…',
  id: providedId,
  className = '',
  'aria-describedby': description,
}: SelectProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const listId = `${id}-list`;
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const search = useRef({ text: '', time: 0 });
  const [expanded, setExpanded] = useState(false);
  const [activeValue, setActiveValue] = useState<string | null>(null);
  const [position, setPosition] = useState<CSSProperties>({ visibility: 'hidden' });
  const enabled = options.filter((option) => !option.disabled);
  const unavailable = disabled || enabled.length === 0;
  const open = expanded && !unavailable;
  const active =
    enabled.find((option) => option.value === activeValue) ??
    enabled.find((option) => option.value === value) ??
    enabled[0];
  const activeIndex = options.findIndex((option) => option.value === active?.value);
  const selected = options.find((option) => option.value === value);

  const close = (commit = false) => {
    if (commit && active && active.value !== value) onValueChange(active.value);
    setExpanded(false);
    search.current = { text: '', time: 0 };
  };
  const show = () => {
    if (unavailable) return;
    setActiveValue(
      enabled.find((option) => option.value === value)?.value ?? enabled[0]?.value ?? null,
    );
    setExpanded(true);
  };

  useEffect(() => {
    if (unavailable) setExpanded(false);
  }, [unavailable]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !trigger.current?.contains(event.target) &&
        !popup.current?.contains(event.target)
      ) {
        setExpanded(false);
        search.current = { text: '', time: 0 };
      }
    };
    document.addEventListener('pointerdown', outside, true);
    return () => document.removeEventListener('pointerdown', outside, true);
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !trigger.current) return;
    const place = () => {
      const button = trigger.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const styles = getComputedStyle(button);
      const gap = parseFloat(styles.getPropertyValue('--s-1'));
      const margin = parseFloat(styles.getPropertyValue('--s-2'));
      const desired = parseFloat(styles.getPropertyValue('--control-md')) * 8;
      const viewWidth = document.documentElement.clientWidth;
      const viewHeight = window.innerHeight;
      const below = Math.max(0, viewHeight - rect.bottom - gap - margin);
      const above = Math.max(0, rect.top - gap - margin);
      const down = below >= Math.min(desired, above);
      const maxHeight = Math.min(desired, down ? below : above);
      const width = Math.min(rect.width, Math.max(0, viewWidth - margin * 2));
      setPosition({
        left: Math.max(margin, Math.min(rect.left, viewWidth - width - margin)),
        width,
        maxHeight,
        ...(down
          ? { top: rect.bottom + gap, bottom: 'auto' }
          : { bottom: viewHeight - rect.top + gap, top: 'auto' }),
      });
    };
    place();
    window.addEventListener('resize', place);
    const scroll = (event: Event) => {
      if (popup.current?.contains(event.target as Node)) return;
      const button = trigger.current;
      if (button && event.target instanceof HTMLElement && event.target.contains(button)) {
        const anchor = button.getBoundingClientRect();
        const container = event.target.getBoundingClientRect();
        if (
          anchor.bottom <= container.top ||
          anchor.top >= container.bottom ||
          anchor.right <= container.left ||
          anchor.left >= container.right
        ) {
          // A scrolled-out trigger must not leave a detached popup over the scene.
          setExpanded(false);
          search.current = { text: '', time: 0 };
          return;
        }
      }
      place();
    };
    window.addEventListener('scroll', scroll, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', scroll, true);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const list = popup.current;
    const option = document.getElementById(`${listId}-${activeIndex}`);
    if (!list || !option) return;
    // Scroll only the list: scrollIntoView could also move the page under the trigger.
    const optionRect = option.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    if (optionRect.top < listRect.top) list.scrollTop -= listRect.top - optionRect.top;
    else if (optionRect.bottom > listRect.bottom)
      list.scrollTop += optionRect.bottom - listRect.bottom;
  }, [open, activeIndex, listId, position]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (unavailable || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing) return;
    const key = event.key;
    if (key === 'Escape') {
      if (open) {
        event.preventDefault();
        event.stopPropagation();
        close();
      }
      return;
    }
    if (key === 'Tab') {
      if (open) close(true);
      return;
    }
    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      if (open) close(true);
      else show();
      return;
    }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp'].includes(key)) {
      event.preventDefault();
      if (event.altKey && key === 'ArrowUp' && open) {
        close(true);
        return;
      }
      let next = active?.value ?? null;
      if (key === 'Home') next = enabled[0]?.value ?? null;
      else if (key === 'End') next = enabled.at(-1)?.value ?? null;
      else if (open)
        next = moveOption(
          options,
          next,
          key === 'PageDown' ? 10 : key === 'PageUp' ? -10 : key === 'ArrowDown' ? 1 : -1,
        );
      setActiveValue(next);
      setExpanded(true);
      return;
    }
    if (key.length === 1 && !event.altKey) {
      event.preventDefault();
      const now = Date.now();
      const query = (now - search.current.time < 700 ? search.current.text : '') + key;
      search.current = { text: query, time: now };
      setActiveValue(matchOption(options, active?.value ?? null, query));
      setExpanded(true);
    }
  };

  return (
    <div className={`hatka-select ${className}`}>
      <label className="hatka-select-label" id={`${id}-label`} htmlFor={id}>
        {label}
      </label>
      <button
        ref={trigger}
        id={id}
        type="button"
        role="combobox"
        aria-labelledby={`${id}-label`}
        aria-describedby={description}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        disabled={unavailable}
        className="hatka-select-trigger"
        onClick={() => (open ? close() : show())}
        onKeyDown={onKeyDown}
        onBlur={() => close()}
      >
        <span>{selected?.label ?? placeholder}</span>
        <span aria-hidden="true">⌄</span>
      </button>
      {open &&
        createPortal(
          <div
            className="hatka-theme hatka-select-popup"
            ref={popup}
            style={position}
            id={listId}
            role="listbox"
            aria-labelledby={`${id}-label`}
            onMouseDown={(event) => event.preventDefault()}
          >
            {options.map((option, index) => (
              <div
                key={option.value}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={option.value === active?.value}
                aria-disabled={option.disabled || undefined}
                className="hatka-select-option"
                onClick={() => {
                  if (!option.disabled) {
                    onValueChange(option.value);
                    close();
                    trigger.current?.focus();
                  }
                }}
              >
                {option.label}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
