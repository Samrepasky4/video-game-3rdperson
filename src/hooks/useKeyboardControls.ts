import { useEffect, useMemo, useState } from 'react';

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

const INITIAL_STATE: ControlState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false,
};

export const useKeyboardControls = (): ControlState => {
  const [state, setState] = useState<ControlState>(INITIAL_STATE);


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

    const updateState = (control: keyof ControlState, value: boolean) => {
      setState((previous) => {
        if (previous[control] === value) {
          return previous;
        }
        return { ...previous, [control]: value };
      });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const control = keyToControl.get(event.code);
      if (!control) return;
      event.preventDefault();
      updateState(control, true);

    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const control = keyToControl.get(event.code);
      if (!control) return;

      event.preventDefault();
      updateState(control, false);

    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keyToControl]);

  return state;
};
