import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPressGesture, type PressGestureEvent } from "./press-gesture";

describe("createPressGesture", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function setup() {
    const events: PressGestureEvent[] = [];
    const gesture = createPressGesture({ onGesture: (e) => events.push(e) });
    return { events, gesture };
  }

  it("emits a tap on a quick down/up within the hold window", () => {
    const { events, gesture } = setup();
    gesture.pointerDown({ button: 0, clientX: 0, clientY: 0 });
    vi.advanceTimersByTime(100);
    gesture.pointerUp();
    expect(events).toEqual([{ type: "tap" }]);
    expect(gesture.shouldSuppressClick()).toBe(false);
  });

  it("emits a press after holding past the threshold and suppresses the following click once", () => {
    const { events, gesture } = setup();
    gesture.pointerDown({ button: 0, clientX: 0, clientY: 0 });
    vi.advanceTimersByTime(500);
    expect(events).toEqual([{ type: "press" }]);
    gesture.pointerUp();
    expect(events).toEqual([{ type: "press" }]); // release adds no tap
    expect(gesture.shouldSuppressClick()).toBe(true);
    expect(gesture.shouldSuppressClick()).toBe(false); // consumed
  });

  it("emits a press immediately on right-click, with no wait", () => {
    const { events, gesture } = setup();
    gesture.pointerDown({ button: 2, clientX: 5, clientY: 5 });
    expect(events).toEqual([{ type: "press" }]);
    expect(gesture.shouldSuppressClick()).toBe(false);
  });

  it("cancels when the pointer moves away before release", () => {
    const { events, gesture } = setup();
    gesture.pointerDown({ button: 0, clientX: 0, clientY: 0 });
    gesture.pointerMove({ button: 0, clientX: 50, clientY: 50 });
    vi.advanceTimersByTime(500); // timer was cleared by the move; no press
    gesture.pointerUp();
    expect(events).toEqual([{ type: "cancel" }]);
  });

  it("ignores small jitter within the move tolerance", () => {
    const { events, gesture } = setup();
    gesture.pointerDown({ button: 0, clientX: 0, clientY: 0 });
    gesture.pointerMove({ button: 0, clientX: 3, clientY: 3 });
    vi.advanceTimersByTime(100);
    gesture.pointerUp();
    expect(events).toEqual([{ type: "tap" }]);
  });
});
