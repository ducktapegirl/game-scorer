// Discriminates a short tap from a long press / right-click on a single
// surface, from pointer events. Used by the M5 correction phase to overload
// one cell with two actions: tap cycles a green/gray height, long press (or
// right-click) opens the full cell editor. Pure timing/state — no DOM types
// beyond the structural PointerLike, so it unit-tests in Node with fake timers.

export interface PressGestureEvent {
  type: "tap" | "press" | "cancel";
}

// The subset of PointerEvent/MouseEvent this needs; kept structural so tests
// can feed plain objects.
export interface PointerLike {
  button?: number; // 2 = secondary (right) button
  clientX: number;
  clientY: number;
}

export interface PressGestureConfig {
  onGesture(event: PressGestureEvent): void;
  pressDurationMs?: number; // hold this long → press (default 500)
  moveTolerancePx?: number; // move farther than this before release → cancel
}

const DEFAULT_PRESS_MS = 500;
const DEFAULT_MOVE_TOLERANCE = 10;

export interface PressGesture {
  pointerDown(e: PointerLike): void;
  pointerMove(e: PointerLike): void;
  pointerUp(): void;
  // True exactly once after a long press fires, so the DOM layer can swallow
  // the synthetic click the browser emits on pointerup after a hold.
  shouldSuppressClick(): boolean;
}

export function createPressGesture(config: PressGestureConfig): PressGesture {
  const pressMs = config.pressDurationMs ?? DEFAULT_PRESS_MS;
  const tolerance = config.moveTolerancePx ?? DEFAULT_MOVE_TOLERANCE;

  let timer: ReturnType<typeof setTimeout> | null = null;
  let startX = 0;
  let startY = 0;
  let active = false; // a left-button press is in progress
  let pressFired = false; // the hold timer already emitted a press
  let cancelled = false; // the pointer moved away; release will cancel
  let suppressClick = false;

  function clearTimer(): void {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function pointerDown(e: PointerLike): void {
    clearTimer();
    active = false;
    pressFired = false;
    cancelled = false;

    // Right-click is an immediate press — no hold, no synthetic left click to
    // suppress.
    if (e.button === 2) {
      config.onGesture({ type: "press" });
      return;
    }

    active = true;
    startX = e.clientX;
    startY = e.clientY;
    timer = setTimeout(() => {
      timer = null;
      pressFired = true;
      suppressClick = true;
      config.onGesture({ type: "press" });
    }, pressMs);
  }

  function pointerMove(e: PointerLike): void {
    if (!active || pressFired) return;
    if (Math.hypot(e.clientX - startX, e.clientY - startY) > tolerance) {
      clearTimer();
      active = false;
      cancelled = true;
    }
  }

  function pointerUp(): void {
    clearTimer();
    if (pressFired) {
      // The press already fired on the hold; the release just ends it.
      pressFired = false;
      active = false;
      return;
    }
    if (cancelled) {
      cancelled = false;
      config.onGesture({ type: "cancel" });
      return;
    }
    if (active) {
      active = false;
      config.onGesture({ type: "tap" });
    }
  }

  function shouldSuppressClick(): boolean {
    if (suppressClick) {
      suppressClick = false;
      return true;
    }
    return false;
  }

  return { pointerDown, pointerMove, pointerUp, shouldSuppressClick };
}
