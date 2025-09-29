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
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  jump: ['Space'],
};

export const useKeyboardControls = (): ControlState => {
  const [state, setState] = useState<ControlState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  });

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
      setState((previous) => ({ ...previous, [control]: true }));
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const control = keyToControl.get(event.code);
      if (!control) return;
      setState((previous) => ({ ...previous, [control]: false }));
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
