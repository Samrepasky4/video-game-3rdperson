
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

    const handleKeyDown = (event: KeyboardEvent) => {
      const control = keyToControl.get(event.code);
      if (!control) return;
      event.preventDefault();

      if (stateRef.current[control]) return;
      stateRef.current = { ...stateRef.current, [control]: true };

    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const control = keyToControl.get(event.code);
      if (!control) return;

      event.preventDefault();

      if (!stateRef.current[control]) return;
      stateRef.current = { ...stateRef.current, [control]: false };

    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keyToControl]);


  return stateRef;

};
