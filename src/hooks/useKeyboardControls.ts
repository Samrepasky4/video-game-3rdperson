import { useEffect } from 'react';

export type ControlState = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
};

export type ControlsApi = {
  state: { current: ControlState };
  setControlState: (control: keyof ControlState, nextValue: boolean) => void;
  reset: () => void;
};

const CONTROL_PRESETS: Record<keyof ControlState, string[]> = {
  forward: ['KeyW', 'ArrowUp'],
  backward: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowRight'],
  right: ['KeyD', 'ArrowLeft'],
  jump: ['Space'],
};

const state: ControlState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false,
};

const stateRef = { current: { ...state } };
const activeControls = new Set<keyof ControlState>();
const keyToControl = new Map<string, keyof ControlState>();
(Object.keys(CONTROL_PRESETS) as (keyof ControlState)[]).forEach((control) => {
  CONTROL_PRESETS[control].forEach((key) => {
    keyToControl.set(key, control);
  });
});

const setControlState = (control: keyof ControlState, nextValue: boolean) => {
  if (stateRef.current[control] === nextValue) return;
  stateRef.current = { ...stateRef.current, [control]: nextValue };
  if (nextValue) {
    activeControls.add(control);
  } else {
    activeControls.delete(control);
  }
};

const resetControls = () => {
  if (activeControls.size === 0) return;
  const nextState: ControlState = { ...stateRef.current };
  activeControls.forEach((control) => {
    nextState[control] = false;
  });
  stateRef.current = nextState;
  activeControls.clear();
};

let subscriberCount = 0;
let detachListeners: (() => void) | null = null;

const ensureListeners = () => {
  if (detachListeners) return;

  const handleKeyDown = (event: KeyboardEvent) => {
    const control = keyToControl.get(event.code);
    if (!control) return;

    if (event.repeat) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    setControlState(control, true);
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    const control = keyToControl.get(event.code);
    if (!control) return;

    event.preventDefault();
    setControlState(control, false);
  };

  const handleBlur = () => {
    resetControls();
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState !== 'visible') {
      resetControls();
    }
  };

  window.addEventListener('keydown', handleKeyDown, { passive: false });
  window.addEventListener('keyup', handleKeyUp, { passive: false });
  window.addEventListener('blur', handleBlur);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  detachListeners = () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('blur', handleBlur);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    detachListeners = null;
  };
};

export const controlsApi: ControlsApi = {
  state: stateRef,
  setControlState,
  reset: resetControls,
};

export const useKeyboardControls = () => {
  useEffect(() => {
    subscriberCount += 1;
    ensureListeners();

    return () => {
      subscriberCount -= 1;
      if (subscriberCount === 0 && detachListeners) {
        detachListeners();
      }
    };
  }, []);

  return controlsApi;
};
