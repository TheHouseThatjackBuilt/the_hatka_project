import { useEffect, useId, useRef, useState } from 'react';
import { Button } from './ui/Button.tsx';

const STORAGE_KEY = 'hatka:viewer-help-seen:v1';
let seenThisSession = false;

function claimFirstVisit() {
  if (seenThisSession) return false;
  seenThisSession = true;
  try {
    if (window.localStorage.getItem(STORAGE_KEY) === '1') return false;
    window.localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Private browsing or blocked storage must not prevent showing help.
  }
  return true;
}

export function ViewerHelp({ ready }: { ready: boolean }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState(false);
  const automatic = useRef<boolean | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const trigger = useRef<HTMLButtonElement>(null);

  function cancelTimer() {
    clearTimeout(timer.current);
    timer.current = undefined;
  }

  useEffect(() => {
    if (!ready) return;
    // Keep the decision through StrictMode's setup/cleanup replay.
    automatic.current ??= claimFirstVisit();
    if (!automatic.current) return;
    setOpen(true);
    timer.current = setTimeout(() => {
      automatic.current = false;
      setOpen(false);
    }, 4000);
    return cancelTimer;
  }, [ready]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      event.stopPropagation();
      cancelTimer();
      automatic.current = false;
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div className="viewer-help">
      <Button
        ref={trigger}
        size="sm"
        variant="ghost"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          cancelTimer();
          claimFirstVisit();
          setManual(true);
          // Opening help deliberately takes ownership away from the auto-hide timer.
          setOpen(automatic.current ? true : !open);
          automatic.current = false;
        }}
      >
        <span aria-hidden="true">?</span> Управление
      </Button>
      {open && (
        <div id={id} className="viewer-help-content" role="status" aria-live="polite">
          <p>Мышь: вращение — левая кнопка, перемещение — правая или Shift, масштаб — колёсико.</p>
          <p>Сенсорный экран: один палец вращает, два — перемещают и меняют масштаб.</p>
          {manual && (
            <>
              <p>«Перемещать камеру» включает перемещение одним пальцем или левой кнопкой.</p>
              <p>
                «Вписать» сохраняет ракурс, «Сбросить» возвращает исходный срез, «Вид сверху» —
                план.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
