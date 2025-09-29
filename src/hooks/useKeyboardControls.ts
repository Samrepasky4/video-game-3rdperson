import { useEffect, useMemo, useRef } from 'react';

type ControlState = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
};

const CONTROL_PRESETS: Record<keyof ControlState, string[]> = {
  forward: ['KeyW', 'ArrowUp'],
  backward: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowRight'],
  right: ['KeyD', 'ArrowLeft'],
  jump: ['Space'],
};

const INITIAL_STATE: ControlState = Object.freeze({

  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false,
});

export const useKeyboardControls = () => {
  const stateRef = useRef<ControlState>({ ...INITIAL_STATE });
  const activeControls = useRef(new Set<keyof ControlState>());
  const keyToControl = useMemo(() => {
    const map = new Map<string, keyof ControlState>();
    (Object.keys(CONTROL_PRESETS) as (keyof ControlState)[]).forEach((control) => {
      CONTROL_PRESETS[control].forEach((key) => {
        map.set(key, control);
      });
    });
    return map;
  }, []);

  useEffect(() => {
    const setControlState = (control: keyof ControlState, nextValue: boolean) => {
      if (stateRef.current[control] === nextValue) return;
      stateRef.current = { ...stateRef.current, [control]: nextValue };
      if (nextValue) {
        activeControls.current.add(control);
      } else {
        activeControls.current.delete(control);
      }
    };


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
      if (activeControls.current.size === 0) return;
      const nextState: ControlState = { ...stateRef.current };
      activeControls.current.forEach((control) => {
        nextState[control] = false;
      });
      stateRef.current = nextState;
      activeControls.current.clear();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        handleBlur();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp, { passive: false });
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);


    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [keyToControl]);

  return stateRef;

};
