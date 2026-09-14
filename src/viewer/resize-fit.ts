// Window changes refit after settling; panel-only changes just resize the canvas.
export function createResizeFit(fit: () => void, hasSize: () => boolean = () => true) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let waitingForSize = false;
  let disposed = false;
  function cancel() {
    clearTimeout(timer);
    timer = undefined;
    waitingForSize = false;
  }
  function schedule() {
    if (disposed) return;
    cancel();
    timer = setTimeout(() => {
      timer = undefined;
      if (disposed) return;
      if (hasSize()) fit();
      else waitingForSize = true;
    }, 150);
  }
  return {
    schedule,
    cancel,
    get pending() {
      return timer !== undefined || waitingForSize;
    },
    dispose() {
      disposed = true;
      cancel();
    },
  };
}
