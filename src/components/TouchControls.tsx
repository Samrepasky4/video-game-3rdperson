import { useEffect } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { ControlsApi } from '../hooks/useKeyboardControls';

type TouchControlsProps = {
  controls: ControlsApi;
  disabled?: boolean;
};

type DirectionControl = 'forward' | 'backward' | 'left' | 'right';

const CONTROL_SYMBOLS: Record<DirectionControl, string> = {
  forward: '▲',
  backward: '▼',
  left: '⟲',
  right: '⟳',
};

export const TouchControls = ({ controls, disabled = false }: TouchControlsProps) => {
  useEffect(() => {
    if (disabled) {
      controls.reset();
    }
  }, [controls, disabled]);

  const handlePress = (control: DirectionControl, nextValue: boolean) => {
    if (disabled) {
      controls.setControlState(control, false);
      return;
    }
    controls.setControlState(control, nextValue);
  };

  const createPressHandler = (control: DirectionControl, nextValue: boolean) => {
    return (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      handlePress(control, nextValue);
    };
  };

  const handlePointerUp = (control: DirectionControl) => {
    return () => {
      controls.setControlState(control, false);
    };
  };

  return (
    <div className="touch-controls" aria-hidden="true">
      <div className="touch-controls__inner">
        <div className="touch-controls__cluster">
          <button
            type="button"
            className="touch-controls__button touch-controls__button--wide"
            onPointerDown={createPressHandler('forward', true)}
            onPointerUp={handlePointerUp('forward')}
            onPointerLeave={handlePointerUp('forward')}
            onPointerCancel={handlePointerUp('forward')}
          >
            <span>{CONTROL_SYMBOLS.forward}</span>
          </button>
          <div className="touch-controls__row">
            <button
              type="button"
              className="touch-controls__button"
              onPointerDown={createPressHandler('left', true)}
              onPointerUp={handlePointerUp('left')}
              onPointerLeave={handlePointerUp('left')}
              onPointerCancel={handlePointerUp('left')}
            >
              <span>{CONTROL_SYMBOLS.left}</span>
            </button>
            <button
              type="button"
              className="touch-controls__button"
              onPointerDown={createPressHandler('right', true)}
              onPointerUp={handlePointerUp('right')}
              onPointerLeave={handlePointerUp('right')}
              onPointerCancel={handlePointerUp('right')}
            >
              <span>{CONTROL_SYMBOLS.right}</span>
            </button>
          </div>
          <button
            type="button"
            className="touch-controls__button touch-controls__button--wide"
            onPointerDown={createPressHandler('backward', true)}
            onPointerUp={handlePointerUp('backward')}
            onPointerLeave={handlePointerUp('backward')}
            onPointerCancel={handlePointerUp('backward')}
          >
            <span>{CONTROL_SYMBOLS.backward}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

TouchControls.displayName = 'TouchControls';
