import { createPortal } from 'react-dom';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import './tooltip.css';

type TooltipChildProps = { 'aria-describedby'?: string };
export type TooltipProps = { content: string; children: (props: TooltipChildProps) => ReactNode };
const CLOSE_BRIDGE_MS = 80;

export function Tooltip({ content, children }: TooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<number | undefined>(undefined);
  const closeTimer = useRef<number | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0, placement: 'bottom' });
  const suppressedRef = useRef(false);
  const hovering = useRef(false);
  const focused = useRef(false);
  const tooltipId = `hatka-tooltip-${useId().replace(/:/g, '')}`;

  const clearTimers = useCallback(() => {
    if (openTimer.current !== undefined) window.clearTimeout(openTimer.current);
    if (closeTimer.current !== undefined) window.clearTimeout(closeTimer.current);
    openTimer.current = undefined;
    closeTimer.current = undefined;
  }, []);
  const hide = useCallback(() => {
    clearTimers();
    setOpen(false);
  }, [clearTimers]);
  const scheduleOpen = useCallback(() => {
    if (suppressedRef.current || open || openTimer.current !== undefined || !triggerRef.current)
      return;
    const delay = Number.parseFloat(
      getComputedStyle(triggerRef.current).getPropertyValue('--tooltip-delay'),
    );
    openTimer.current = window.setTimeout(
      () => {
        openTimer.current = undefined;
        if (!suppressedRef.current && (hovering.current || focused.current)) setOpen(true);
      },
      Number.isFinite(delay) ? Math.max(0, delay) : 400,
    );
  }, [open]);
  const scheduleClose = useCallback(() => {
    if (closeTimer.current !== undefined) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = undefined;
      if (!hovering.current && !focused.current) hide();
    }, CLOSE_BRIDGE_MS);
  }, [hide]);
  useEffect(() => clearTimers, [clearTimers]);
  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (
        event.key === 'Escape' &&
        (hovering.current || focused.current || openTimer.current !== undefined)
      ) {
        suppressedRef.current = true;
        hide();
      }
    };
    const onViewportChange = (event: Event) => {
      if (event.target instanceof Node && tooltipRef.current?.contains(event.target)) return;
      hide();
    };
    document.addEventListener('keydown', onEscape);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);
    return () => {
      document.removeEventListener('keydown', onEscape);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
    };
  }, [hide]);
  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !tooltipRef.current) return;
    const trigger = triggerRef.current.getBoundingClientRect();
    const tooltip = tooltipRef.current.getBoundingClientRect();
    const styles = getComputedStyle(triggerRef.current);
    const gap = parseFloat(styles.getPropertyValue('--s-2'));
    const margin = gap;
    const placement =
      trigger.bottom + gap + tooltip.height <= window.innerHeight - margin ? 'bottom' : 'top';
    const rawTop =
      placement === 'bottom' ? trigger.bottom + gap : trigger.top - gap - tooltip.height;
    const top = Math.max(margin, Math.min(rawTop, window.innerHeight - tooltip.height - margin));
    const left = Math.max(
      margin,
      Math.min(
        trigger.left + (trigger.width - tooltip.width) / 2,
        document.documentElement.clientWidth - tooltip.width - margin,
      ),
    );
    setPosition({ left, top, placement });
  }, [content, open]);
  const onPointerEnter = (event: React.PointerEvent) => {
    if (event.pointerType !== 'touch') {
      hovering.current = true;
      if (closeTimer.current !== undefined) window.clearTimeout(closeTimer.current);
      scheduleOpen();
    }
  };
  const onPointerLeave = (event: React.PointerEvent) => {
    if (event.pointerType !== 'touch') {
      hovering.current = false;
      suppressedRef.current = false;
      if (!focused.current && openTimer.current !== undefined) {
        window.clearTimeout(openTimer.current);
        openTimer.current = undefined;
      }
      scheduleClose();
    }
  };
  const onFocus = () => {
    focused.current = true;
    scheduleOpen();
  };
  const onBlur = () => {
    focused.current = false;
    suppressedRef.current = false;
    if (hovering.current) return;
    hide();
  };
  return (
    <span
      ref={triggerRef}
      className="hatka-tooltip-trigger"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocusCapture={onFocus}
      onBlurCapture={onBlur}
    >
      {children({ 'aria-describedby': open ? tooltipId : undefined })}
      {open &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            className={`hatka-theme hatka-tooltip hatka-tooltip--${position.placement}`}
            style={{ left: position.left, top: position.top }}
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
          >
            {content}
          </div>,
          document.body,
        )}
    </span>
  );
}
